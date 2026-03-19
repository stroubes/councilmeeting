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
exports.SharePointDocxService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SharePointDocxService = class SharePointDocxService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async resolveBase64(input) {
        if (input.contentBase64?.trim()) {
            return input.contentBase64.trim();
        }
        if (!input.sharePointDriveId || !input.sharePointItemId) {
            return null;
        }
        const token = await this.getGraphAccessToken();
        const downloadResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(input.sharePointDriveId)}/items/${encodeURIComponent(input.sharePointItemId)}/content`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!downloadResponse.ok) {
            throw new common_1.UnauthorizedException('Unable to fetch DOCX from SharePoint item.');
        }
        const buffer = Buffer.from(await downloadResponse.arrayBuffer());
        return buffer.toString('base64');
    }
    async uploadBase64File(input) {
        const token = await this.getGraphAccessToken();
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetPath = `CouncilMeetingAttachments/${Date.now()}-${safeName}`;
        const bytes = Buffer.from(input.contentBase64, 'base64');
        const uploadResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(input.sharePointDriveId)}/root:/${encodeURIComponent(targetPath)}:/content`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                ...(input.mimeType ? { 'Content-Type': input.mimeType } : {}),
            },
            body: bytes,
        });
        if (!uploadResponse.ok) {
            throw new common_1.UnauthorizedException('Unable to upload attachment to SharePoint.');
        }
        const payload = (await uploadResponse.json());
        if (!payload.id) {
            throw new common_1.UnauthorizedException('SharePoint upload response missing item id.');
        }
        return {
            itemId: payload.id,
            webUrl: payload.webUrl,
            sizeBytes: payload.size,
        };
    }
    async getGraphAccessToken() {
        const tenantId = this.configService.get('microsoft.tenantId');
        const clientId = this.configService.get('microsoft.clientId');
        const clientSecret = this.configService.get('microsoft.clientSecret');
        if (!tenantId || !clientId || !clientSecret) {
            throw new common_1.UnauthorizedException('Microsoft client credentials are required for SharePoint DOCX retrieval.');
        }
        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'https://graph.microsoft.com/.default',
        });
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });
        if (!tokenResponse.ok) {
            throw new common_1.UnauthorizedException('Unable to acquire Microsoft Graph access token.');
        }
        const payload = (await tokenResponse.json());
        if (!payload.access_token) {
            throw new common_1.UnauthorizedException('Microsoft Graph token response missing access_token.');
        }
        return payload.access_token;
    }
};
exports.SharePointDocxService = SharePointDocxService;
exports.SharePointDocxService = SharePointDocxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SharePointDocxService);
//# sourceMappingURL=sharepoint-docx.service.js.map