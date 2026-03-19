export declare class CreateTemplateDto {
    type: 'AGENDA' | 'STAFF_REPORT';
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
}
