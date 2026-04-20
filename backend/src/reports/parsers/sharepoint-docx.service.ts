import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class SharePointDocxService {
  constructor(private readonly configService: ConfigService) {}

  hasGraphCredentials(): boolean {
    return Boolean(
      this.configService.get<string>('microsoft.tenantId') &&
        this.configService.get<string>('microsoft.clientId') &&
        this.configService.get<string>('microsoft.clientSecret'),
    );
  }

  async resolveBase64(input: {
    contentBase64?: string;
    sharePointDriveId?: string;
    sharePointItemId?: string;
  }): Promise<string | null> {
    if (input.contentBase64?.trim()) {
      return input.contentBase64.trim();
    }

    if (!input.sharePointDriveId || !input.sharePointItemId) {
      return null;
    }

    const token = await this.getGraphAccessToken();
    const downloadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(input.sharePointDriveId)}/items/${encodeURIComponent(input.sharePointItemId)}/content`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!downloadResponse.ok) {
      throw new UnauthorizedException('Unable to fetch DOCX from SharePoint item.');
    }

    const buffer = Buffer.from(await downloadResponse.arrayBuffer());
    return buffer.toString('base64');
  }

  async uploadBase64File(input: {
    sharePointDriveId: string;
    fileName: string;
    contentBase64: string;
    mimeType?: string;
  }): Promise<{ itemId: string; webUrl?: string; sizeBytes?: number }> {
    if (!this.hasGraphCredentials()) {
      return this.storeLocalBase64File(input);
    }

    const token = await this.getGraphAccessToken();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = `CouncilMeetingAttachments/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(input.contentBase64, 'base64');

    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(input.sharePointDriveId)}/root:/${encodeURIComponent(targetPath)}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(input.mimeType ? { 'Content-Type': input.mimeType } : {}),
        },
        body: bytes,
      },
    );

    if (!uploadResponse.ok) {
      throw new UnauthorizedException('Unable to upload attachment to SharePoint.');
    }

    const payload = (await uploadResponse.json()) as {
      id?: string;
      webUrl?: string;
      size?: number;
    };

    if (!payload.id) {
      throw new UnauthorizedException('SharePoint upload response missing item id.');
    }

    return {
      itemId: payload.id,
      webUrl: payload.webUrl,
      sizeBytes: payload.size,
    };
  }

  async storeLocalBase64File(input: {
    fileName: string;
    contentBase64: string;
    mimeType?: string;
  }): Promise<{ itemId: string; webUrl: string; sizeBytes: number }> {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const itemId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const storedFileName = `${itemId}-${safeName}`;
    const buffer = Buffer.from(input.contentBase64, 'base64');
    const storageDir = join(process.cwd(), '.local-report-attachments');

    await mkdir(storageDir, { recursive: true });
    await writeFile(join(storageDir, storedFileName), buffer);

    return {
      itemId,
      webUrl: `http://localhost:3000/api/reports/local-attachments/${storedFileName}`,
      sizeBytes: buffer.byteLength,
    };
  }

  private async getGraphAccessToken(): Promise<string> {
    const tenantId = this.configService.get<string>('microsoft.tenantId');
    const clientId = this.configService.get<string>('microsoft.clientId');
    const clientSecret = this.configService.get<string>('microsoft.clientSecret');

    if (!tenantId || !clientId || !clientSecret) {
      throw new UnauthorizedException(
        'Microsoft client credentials are required for SharePoint DOCX retrieval.',
      );
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default',
    });

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Unable to acquire Microsoft Graph access token.');
    }

    const payload = (await tokenResponse.json()) as { access_token?: string };
    if (!payload.access_token) {
      throw new UnauthorizedException('Microsoft Graph token response missing access_token.');
    }

    return payload.access_token;
  }
}
