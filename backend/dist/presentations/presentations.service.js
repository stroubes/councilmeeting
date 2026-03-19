"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentationsService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const node_child_process_1 = require("node:child_process");
const audit_service_1 = require("../audit/audit.service");
const meetings_service_1 = require("../meetings/meetings.service");
const presentations_repository_1 = require("./presentations.repository");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
let PresentationsService = class PresentationsService {
    meetingsService;
    presentationsRepository;
    auditService;
    constructor(meetingsService, presentationsRepository, auditService) {
        this.meetingsService = meetingsService;
        this.presentationsRepository = presentationsRepository;
        this.auditService = auditService;
    }
    health() {
        return { status: 'ok' };
    }
    list(meetingId) {
        return this.presentationsRepository.list(meetingId);
    }
    getById(id) {
        return this.presentationsRepository.getById(id);
    }
    getWithContentById(id) {
        return this.presentationsRepository.getWithContentById(id);
    }
    async remove(id, user) {
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
    async create(dto, user) {
        const meetingExists = await this.meetingsService.exists(dto.meetingId);
        if (!meetingExists) {
            throw new common_1.BadRequestException('Meeting does not exist for this presentation');
        }
        if (!dto.contentBase64?.trim()) {
            throw new common_1.BadRequestException('Presentation upload requires contentBase64.');
        }
        const normalizedName = dto.fileName.trim();
        const extension = (0, node_path_1.extname)(normalizedName).toLowerCase();
        const supportedExtensions = new Set(['.pdf', '.ppt', '.pptx']);
        if (!supportedExtensions.has(extension)) {
            throw new common_1.BadRequestException('Only PDF, PPT, and PPTX presentations are supported.');
        }
        const prepared = extension === '.pdf'
            ? { fileName: normalizedName, pdfBase64: dto.contentBase64.trim() }
            : await this.convertPowerPointToPdf(normalizedName, dto.contentBase64.trim());
        const pageCount = this.countPdfPages(prepared.pdfBase64);
        const created = await this.presentationsRepository.create({
            meetingId: dto.meetingId,
            fileName: prepared.fileName,
            title: dto.title?.trim() || (0, node_path_1.basename)(prepared.fileName, '.pdf'),
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
    async convertPowerPointToPdf(fileName, contentBase64) {
        const tempDir = await node_fs_1.promises.mkdtemp((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'council-meeting-presentation-'));
        try {
            const sourcePath = (0, node_path_1.join)(tempDir, fileName);
            await node_fs_1.promises.writeFile(sourcePath, Buffer.from(contentBase64, 'base64'));
            const conversionArgs = [
                '--headless',
                '--convert-to',
                'pdf:writer_pdf_Export',
                '--outdir',
                tempDir,
                sourcePath,
            ];
            const candidateCommands = ['soffice', 'libreoffice'];
            let lastError = null;
            for (const command of candidateCommands) {
                try {
                    await execFileAsync(command, conversionArgs, { timeout: 180_000 });
                    lastError = null;
                    break;
                }
                catch (error) {
                    lastError = error;
                }
            }
            if (lastError) {
                throw new common_1.BadRequestException('PowerPoint conversion failed. Install LibreOffice on the backend host or upload PDF directly.');
            }
            const convertedFileName = `${(0, node_path_1.basename)(fileName, (0, node_path_1.extname)(fileName))}.pdf`;
            const pdfPath = (0, node_path_1.join)(tempDir, convertedFileName);
            const pdfBuffer = await node_fs_1.promises.readFile(pdfPath);
            return {
                fileName: convertedFileName,
                pdfBase64: pdfBuffer.toString('base64'),
            };
        }
        finally {
            await node_fs_1.promises.rm(tempDir, { recursive: true, force: true });
        }
    }
    countPdfPages(contentBase64) {
        const buffer = Buffer.from(contentBase64, 'base64');
        const text = buffer.toString('latin1');
        const matches = text.match(/\/Type\s*\/Page\b/g) ?? [];
        const pageCount = matches.length;
        if (pageCount <= 0) {
            return 1;
        }
        return pageCount;
    }
};
exports.PresentationsService = PresentationsService;
exports.PresentationsService = PresentationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        presentations_repository_1.PresentationsRepository,
        audit_service_1.AuditService])
], PresentationsService);
//# sourceMappingURL=presentations.service.js.map