"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocxParserService = void 0;
const common_1 = require("@nestjs/common");
const mammoth_1 = require("mammoth");
let DocxParserService = class DocxParserService {
    async parseFromBase64(fileName, contentBase64) {
        const warnings = [];
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
    async extractRawText(buffer, warnings) {
        try {
            const result = await mammoth_1.default.extractRawText({ buffer });
            if (result.messages.length > 0) {
                warnings.push(...result.messages.map((message) => message.message));
            }
            return result.value;
        }
        catch {
            warnings.push('Could not parse DOCX with OpenXML parser; used plain text fallback.');
            return buffer.toString('utf8');
        }
    }
};
exports.DocxParserService = DocxParserService;
exports.DocxParserService = DocxParserService = __decorate([
    (0, common_1.Injectable)()
], DocxParserService);
function decodeBase64(base64) {
    try {
        return Buffer.from(base64, 'base64');
    }
    catch {
        return Buffer.alloc(0);
    }
}
function stripExtension(fileName) {
    const index = fileName.lastIndexOf('.');
    return index > 0 ? fileName.slice(0, index) : fileName;
}
function findSection(lines, keywords) {
    const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
    const match = lines.find((line) => {
        const normalized = line.toLowerCase();
        return lowerKeywords.some((keyword) => normalized.includes(keyword));
    });
    return match;
}
function buildSections(lines) {
    if (lines.length === 0) {
        return [];
    }
    const sections = [];
    let currentHeading = 'Section 1';
    let currentContent = [];
    const pushSection = () => {
        if (currentContent.length === 0) {
            return;
        }
        sections.push({
            heading: currentHeading,
            content: currentContent.join(' '),
        });
    };
    for (const line of lines) {
        const headingLike = line.endsWith(':') ||
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
//# sourceMappingURL=docx-parser.service.js.map