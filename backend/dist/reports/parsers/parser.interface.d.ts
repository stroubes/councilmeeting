import type { ParsedDocxReport } from './parser.types';
export interface ReportParser {
    parseFromBase64(fileName: string, contentBase64: string): Promise<ParsedDocxReport>;
}
