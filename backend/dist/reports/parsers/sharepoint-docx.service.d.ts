import { ConfigService } from '@nestjs/config';
export declare class SharePointDocxService {
    private readonly configService;
    constructor(configService: ConfigService);
    resolveBase64(input: {
        contentBase64?: string;
        sharePointDriveId?: string;
        sharePointItemId?: string;
    }): Promise<string | null>;
    uploadBase64File(input: {
        sharePointDriveId: string;
        fileName: string;
        contentBase64: string;
        mimeType?: string;
    }): Promise<{
        itemId: string;
        webUrl?: string;
        sizeBytes?: number;
    }>;
    private getGraphAccessToken;
}
