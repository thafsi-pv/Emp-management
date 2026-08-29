/**
 * Supabase PostgreSQL — Connection Guide
 * =======================================
 *
 * Supabase exposes two PostgreSQL endpoints:
 *
 * 1. POOLED (Supavisor) — Port 6543  →  set as DATABASE_URL
 *    Used by the NestJS app at runtime.
 *    Append: ?pgbouncer=true&connection_limit=1
 *    (pgbouncer=true disables prepared statements, required for PgBouncer compatibility)
 *
 * 2. DIRECT — Port 5432  →  set as DIRECT_URL
 *    Used ONLY by: prisma migrate dev / prisma db push / prisma db seed
 *    Migrations need a persistent direct connection, not pooled.
 *
 * Where to find URLs:
 *   Supabase Dashboard → Project Settings → Database → Connection string
 *   Toggle "Transaction" (pooled) and "Session" (direct)
 *
 * Example .env:
 *   DATABASE_URL="postgresql://postgres.abcdef:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
 *   DIRECT_URL="postgresql://postgres.abcdef:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
 */
export const supabaseDbNote = 'See comments above for Supabase connection setup';
