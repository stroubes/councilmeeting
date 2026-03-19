import type { ReportParser } from './parser.interface';
import type { ParsedDocxReport } from './parser.types';
export declare class DocxParserService implements ReportParser {
    parseFromBase64(fileName: string, contentBase64: string): Promise<ParsedDocxReport>;
    private extractRawText;
}
