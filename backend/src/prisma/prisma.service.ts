import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

/**
 * PrismaService — Supabase-compatible
 *
 * Uses DATABASE_URL (pooled, port 6543) at runtime via pgbouncer.
 * Prisma is configured in schema.prisma with directUrl = env("DIRECT_URL")
 * so `prisma migrate` uses the direct connection (port 5432) automatically.
 */

// PrismaClient is loaded at runtime after `prisma generate` has been run.
// This lazy-load pattern allows the project to compile before the client is generated.
let PrismaClientClass: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');
  PrismaClientClass = PrismaClient;
} catch {
  // Prisma client not yet generated — run: npm run prisma:generate
  PrismaClientClass = class FallbackPrisma {
    async $connect() {}
    async $disconnect() {}
  };
}

@Injectable()
export class PrismaService extends (PrismaClientClass as any) implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
      // Supabase pgbouncer: disable prepared statements
      // This is handled automatically by the ?pgbouncer=true param in DATABASE_URL
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to Supabase PostgreSQL');
    } catch (err) {
      this.logger.error('❌ Failed to connect to database', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
