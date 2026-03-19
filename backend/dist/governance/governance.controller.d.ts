import { GovernanceService } from './governance.service';
import { SetActiveProfileDto } from './dto/set-active-profile.dto';
export declare class GovernanceController {
    private readonly governanceService;
    constructor(governanceService: GovernanceService);
    health(): {
        status: string;
    };
    getActiveProfile(): Promise<import("./municipal-profile.constants").MunicipalProfile>;
    listProfiles(): import("./municipal-profile.constants").MunicipalProfile[];
    setActiveProfile(dto: SetActiveProfileDto): Promise<import("./municipal-profile.constants").MunicipalProfile>;
    getPolicyPack(): Promise<import("./governance.service").MunicipalPolicyPack>;
}
