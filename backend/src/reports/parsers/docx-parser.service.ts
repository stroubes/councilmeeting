import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import type { ReportParser } from './parser.interface';
import type { ParsedDocxReport } from './parser.types';

@Injectable()
export class DocxParserService implements ReportParser {
  async parseFromBase64(fileName: string, contentBase64: string): Promise<ParsedDocxReport> {
    const warnings: string[] = [];
    const buffer = decodeBase64(contentBase64);
    if (buffer.length === 0) {
      return {
        title: stripExtension(fileName),
        sections: [],
        rawText: '',
        warnings: ['Decoded DOCX content is empty.'],
      };
    }

    const extracted = await this.extractRawText(buffer, warnings);
    const normalized = extracted.replace(/\r/g, '\n').replace(/\n{2,}/g, '\n').trim();
    const lines = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const title = lines[0] ?? stripExtension(fileName);
    const executiveSummary = findSection(lines, ['executive summary', 'summary']);
    const recommendations = findSection(lines, ['recommendation', 'recommendations']);

    const sections = buildSections(lines.slice(1));

    return {
      title,
      executiveSummary,
      recommendations,
      sections,
      rawText: normalized,
      warnings,
    };
  }

  private async extractRawText(buffer: Buffer, warnings: string[]): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.messages.length > 0) {
        warnings.push(...result.messages.map((message) => message.message));
      }

      return result.value;
    } catch {
      warnings.push('Could not parse DOCX with OpenXML parser; used plain text fallback.');
      return buffer.toString('utf8');
    }
  }
}

function decodeBase64(base64: string): Buffer {
  try {
    return Buffer.from(base64, 'base64');
  } catch {
    return Buffer.alloc(0);
  }
}

function stripExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index > 0 ? fileName.slice(0, index) : fileName;
}

function findSection(lines: string[], keywords: string[]): string | undefined {
  const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const match = lines.find((line) => {
    const normalized = line.toLowerCase();
    return lowerKeywords.some((keyword) => normalized.includes(keyword));
  });
  return match;
}

function buildSections(lines: string[]): Array<{ heading: string; content: string }> {
  if (lines.length === 0) {
    return [];
  }

  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = 'Section 1';
  let currentContent: string[] = [];

  const pushSection = (): void => {
    if (currentContent.length === 0) {
      return;
    }

    sections.push({
      heading: currentHeading,
      content: currentContent.join(' '),
    });
  };

  for (const line of lines) {
    const headingLike =
      line.endsWith(':') ||
      /^[A-Z][A-Z\s\d&\-]{3,}$/.test(line) ||
      /^\d+(\.\d+)*\s+/.test(line);

    if (headingLike) {
      pushSection();
      currentHeading = line.replace(/:$/, '');
      currentContent = [];
      continue;
    }

    currentContent.push(line);
  }

  pushSection();

  if (sections.length === 0) {
    return lines.map((line, index) => ({
      heading: `Line ${index + 1}`,
      content: line,
    }));
  }

  return sections;
}
