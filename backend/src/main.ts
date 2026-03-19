import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_BYPASS_ENABLED === 'true') {
    throw new Error('AUTH_BYPASS_ENABLED cannot be true in production.');
  }

  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '80mb' }));
  app.use(urlencoded({ limit: '80mb', extended: true }));
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'],
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
