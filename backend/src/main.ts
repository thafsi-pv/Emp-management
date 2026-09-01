import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Ensure upload directories exist
  ['uploads/photos', 'uploads/documents'].forEach((dir) => {
    mkdirSync(join(process.cwd(), dir), { recursive: true });
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Global prefix — all routes under /api
  app.setGlobalPrefix('api');

  // CORS — allow React frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:5173',
      'https://emp-management-jade.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:80',
      'http://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation — strips unknown fields, auto-transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running at:        http://0.0.0.0:${port}/api`);
  logger.log(`📋 Dashboard:                http://localhost:${port}/api/reports/dashboard`);
  logger.log(`🗄️  Database:                 Supabase PostgreSQL (pooled)`);
  logger.log(`🌍 Allowed frontend origin:  ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`);
}

bootstrap();
