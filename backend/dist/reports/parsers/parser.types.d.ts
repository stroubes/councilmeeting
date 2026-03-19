export interface ParsedReportSection {
    heading: string;
    content: string;
}
export interface ParsedDocxReport {
    title: string;
    executiveSummary?: string;
    recommendations?: string;
    sections: ParsedReportSection[];
    rawText: string;
    warnings: string[];
}
