import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApiSettingsService } from './api-settings.service';
import { UpsertApiSettingDto } from './dto/upsert-api-setting.dto';
export declare class ApiSettingsController {
    private readonly apiSettingsService;
    constructor(apiSettingsService: ApiSettingsService);
    health(): {
        status: string;
    };
    list(): Promise<import("./api-settings.service").ApiSettingView[]>;
    runtimeMetadata(): Promise<{
        profileId: string;
        configuredChannels: string;
        integrations: Array<{
            key: string;
            configured: boolean;
        }>;
    }>;
    upsert(dto: UpsertApiSettingDto, user: AuthenticatedUser): Promise<import("./api-settings.service").ApiSettingView>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
