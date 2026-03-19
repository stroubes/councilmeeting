import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicPortalService } from './public-portal.service';
export declare class PublicDigestScheduler implements OnModuleInit, OnModuleDestroy {
    private readonly publicPortalService;
    private readonly configService;
    private readonly logger;
    private timer;
    constructor(publicPortalService: PublicPortalService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runSweep(): Promise<void>;
    private resolveIntervalMs;
}
