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
var PublicDigestScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicDigestScheduler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const public_portal_service_1 = require("./public-portal.service");
let PublicDigestScheduler = PublicDigestScheduler_1 = class PublicDigestScheduler {
    publicPortalService;
    configService;
    logger = new common_1.Logger(PublicDigestScheduler_1.name);
    timer = null;
    constructor(publicPortalService, configService) {
        this.publicPortalService = publicPortalService;
        this.configService = configService;
    }
    onModuleInit() {
        const enabled = this.configService.get('publicDigestSchedulerEnabled') ?? true;
        if (!enabled) {
            this.logger.log('Public digest scheduler disabled by configuration.');
            return;
        }
        const intervalMs = this.resolveIntervalMs();
        this.timer = setInterval(() => {
            void this.runSweep();
        }, intervalMs);
        this.logger.log(`Public digest scheduler started (interval=${intervalMs}ms).`);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async runSweep() {
        try {
            const result = await this.publicPortalService.runDigestSweep();
            this.logger.log(`Digest sweep completed runAt=${result.runAt} processed=${result.processed} delivered=${result.delivered} skipped=${result.skipped}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown digest scheduler error';
            this.logger.error(`Digest sweep failed: ${message}`);
        }
    }
    resolveIntervalMs() {
        const raw = this.configService.get('publicDigestSchedulerIntervalMs') ?? 10 * 60 * 1000;
        if (!Number.isFinite(raw)) {
            return 10 * 60 * 1000;
        }
        return Math.max(60 * 1000, Number(raw));
    }
};
exports.PublicDigestScheduler = PublicDigestScheduler;
exports.PublicDigestScheduler = PublicDigestScheduler = PublicDigestScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [public_portal_service_1.PublicPortalService,
        config_1.ConfigService])
], PublicDigestScheduler);
//# sourceMappingURL=public-digest.scheduler.js.map