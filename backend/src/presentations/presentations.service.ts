import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import type { CreatePresentationDto } from './dto/create-presentation.dto';
import {
  type PresentationRecord,
  type PresentationSummary,
  PresentationsRepository,
} from './presentations.repository';

const execFileAsync = promisify(execFile);

@Injectable()
export class PresentationsService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly presentationsRepository: PresentationsRepository,
    private readonly auditService: AuditService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  list(meetingId?: string): Promise<PresentationSummary[]> {
    return this.presentationsRepository.list(meetingId);
  }

  getById(id: string): Promise<PresentationSummary> {
    return this.presentationsRepository.getById(id);
  }

  getWithContentById(id: string): Promise<PresentationRecord> {
    return this.presentationsRepository.getWithContentById(id);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    const existing = await this.presentationsRepository.getById(id);
    await this.presentationsRepository.remove(id);

    await this.auditService.log({
      actorUserId: user.id,
      action: 'presentation.delete',
      entityType: 'presentation',
      entityId: id,
      changesJson: { meetingId: existing.meetingId },
    });

    return { ok: true };
  }

  async create(dto: CreatePresentationDto, user: AuthenticatedUser): Promise<PresentationSummary> {
    const meetingExists = await this.meetingsService.exists(dto.meetingId);
    if (!meetingExists) {
      throw new BadRequestException('Meeting does not exist for this presentation');
    }

    if (!dto.contentBase64?.trim()) {
      throw new BadRequestException('Presentation upload requires contentBase64.');
    }

    const normalizedName = dto.fileName.trim();
    const extension = extname(normalizedName).toLowerCase();
    const supportedExtensions = new Set(['.pdf', '.ppt', '.pptx']);
    if (!supportedExtensions.has(extension)) {
      throw new BadRequestException('Only PDF, PPT, and PPTX presentations are supported.');
    }

    const prepared = extension === '.pdf'
      ? { fileName: normalizedName, pdfBase64: dto.contentBase64.trim() }
      : await this.convertPowerPointToPdf(normalizedName, dto.contentBase64.trim());

    const pageCount = this.countPdfPages(prepared.pdfBase64);
    const created = await this.presentationsRepository.create({
      meetingId: dto.meetingId,
      fileName: prepared.fileName,
      title: dto.title?.trim() || basename(prepared.fileName, '.pdf'),
      mimeType: 'application/pdf',
      pageCount,
      contentBase64: prepared.pdfBase64,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'presentation.create',
      entityType: 'presentation',
      entityId: created.id,
      changesJson: { meetingId: created.meetingId, pageCount: created.pageCount },
    });

    return created;
  }

  private async convertPowerPointToPdf(
    fileName: string,
    contentBase64: string,
  ): Promise<{ fileName: string; pdfBase64: string }> {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'council-meeting-presentation-'));
    try {
      const sourcePath = join(tempDir, fileName);
      await fs.writeFile(sourcePath, Buffer.from(contentBase64, 'base64'));

      const conversionArgs = [
        '--headless',
        '--convert-to',
        'pdf:writer_pdf_Export',
        '--outdir',
        tempDir,
        sourcePath,
      ];

      const candidateCommands = ['soffice', 'libreoffice'];
      let lastError: unknown = null;
      for (const command of candidateCommands) {
        try {
          await execFileAsync(command, conversionArgs, { timeout: 180_000 });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw new BadRequestException(
          'PowerPoint conversion failed. Install LibreOffice on the backend host or upload PDF directly.',
        );
      }

      const convertedFileName = `${basename(fileName, extname(fileName))}.pdf`;
      const pdfPath = join(tempDir, convertedFileName);
      const pdfBuffer = await fs.readFile(pdfPath);
      return {
        fileName: convertedFileName,
        pdfBase64: pdfBuffer.toString('base64'),
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  private countPdfPages(contentBase64: string): number {
    const buffer = Buffer.from(contentBase64, 'base64');
    const text = buffer.toString('latin1');
    const matches = text.match(/\/Type\s*\/Page\b/g) ?? [];
    const pageCount = matches.length;
    if (pageCount <= 0) {
      return 1;
    }
    return pageCount;
  }
}
