import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicPortalService } from './public-portal.service';

@Injectable()
export class PublicDigestScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicDigestScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly publicPortalService: PublicPortalService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const enabled = this.configService.get<boolean>('publicDigestSchedulerEnabled') ?? true;
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

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runSweep(): Promise<void> {
    try {
      const result = await this.publicPortalService.runDigestSweep();
      this.logger.log(
        `Digest sweep completed runAt=${result.runAt} processed=${result.processed} delivered=${result.delivered} skipped=${result.skipped}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown digest scheduler error';
      this.logger.error(`Digest sweep failed: ${message}`);
    }
  }

  private resolveIntervalMs(): number {
    const raw = this.configService.get<number>('publicDigestSchedulerIntervalMs') ?? 10 * 60 * 1000;
    if (!Number.isFinite(raw)) {
      return 10 * 60 * 1000;
    }

    return Math.max(60 * 1000, Number(raw));
  }
}
