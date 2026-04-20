import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { createRateLimitMiddleware } from './core/middleware/rate-limit.middleware';
import { csrfHeaderMiddleware } from './core/middleware/csrf-header.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv = (configService.get<string>('nodeEnv') ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  const authBypassEnabled = configService.get<boolean>('authBypassEnabled') === true;
  const authBypassAllowedEnvs = configService.get<string[]>('authBypassAllowedEnvs') ?? ['development', 'test', 'local'];

  if (authBypassEnabled && !authBypassAllowedEnvs.includes(nodeEnv)) {
    throw new Error(`AUTH_BYPASS_ENABLED is not allowed in NODE_ENV=${nodeEnv}.`);
  }

  app.use(
    createRateLimitMiddleware({
      windowMs: configService.get<number>('rateLimitWindowMs') ?? 60_000,
      generalMax: configService.get<number>('rateLimitGeneralMax') ?? 120,
      publicMax: configService.get<number>('rateLimitPublicMax') ?? 90,
      authMax: configService.get<number>('rateLimitAuthMax') ?? 30,
    }),
  );
  app.use(csrfHeaderMiddleware);
  app.use(json({ limit: '80mb' }));
  app.use(urlencoded({ limit: '80mb', extended: true }));
  const corsOrigins = configService.get<string[]>('corsOrigins') ?? [];
  if (corsOrigins.length === 0) {
    throw new Error('FATAL: CORS_ORIGINS is empty. Configure allowed frontend origins (comma-separated).');
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
