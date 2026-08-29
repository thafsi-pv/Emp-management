# Supabase PostgreSQL Setup Guide

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in: Project name, Database password (save this!), Region (pick closest to you)
4. Click **Create new project** and wait ~2 minutes

---

## Step 2 — Get Your Connection Strings

1. In your project dashboard, go to **Project Settings → Database**
2. Scroll to **Connection string** section
3. Copy two URLs:

### Pooled URL (for the app — port 6543)
Select **Transaction** mode:
```
postgresql://postgres.YOURREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```
Add `?pgbouncer=true&connection_limit=1` to the end.

### Direct URL (for migrations — port 5432)
Select **Session** mode:
```
postgresql://postgres.YOURREF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

---

## Step 3 — Configure .env

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Pooled — used by NestJS at runtime
DATABASE_URL="postgresql://postgres.xxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct — used only by prisma migrate / db push / seed
DIRECT_URL="postgresql://postgres.xxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

JWT_ACCESS_SECRET="generate-a-random-64-char-string"
JWT_REFRESH_SECRET="generate-another-random-64-char-string"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

PORT=3000
FRONTEND_URL="http://localhost:5173"
```

> **Tip:** Generate secure JWT secrets:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Step 4 — Run Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to Supabase (creates all tables)
npm run prisma:push

# Seed sample data
npm run prisma:seed

# OR run all 3 at once:
npm run setup
```

---

## Step 5 — Start the Server

```bash
npm run start:dev
```

You should see:
```
✅ Connected to Supabase PostgreSQL
🚀 Server running at: http://localhost:3000/api
```

---

## Step 6 — Verify in Supabase

Go to **Supabase Dashboard → Table Editor** — you should see all tables:
`users`, `employees`, `departments`, `designations`, `appointments`, `attendance`, `payroll`, `service_breaks`, `contract_renewals`, `contract_terminations`

---

## Migrations vs db push

| Command | When to use |
|---|---|
| `npm run prisma:push` | Development — fast, no migration files |
| `npm run prisma:migrate` | Production — creates migration history |
| `npm run prisma:migrate:deploy` | CI/CD — applies pending migrations |

For Supabase, `prisma db push` is recommended for initial setup. Switch to `prisma migrate` when going to production.

---

## Troubleshooting

### "prepared statement already exists"
Your DATABASE_URL is missing `?pgbouncer=true`. Add it:
```
...supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### "Can't reach database server"
- Check your IP is allowed in Supabase → Project Settings → Database → Network Restrictions
- Or disable network restrictions for development

### Connection timeout
Make sure you're using port **6543** for DATABASE_URL and **5432** for DIRECT_URL.

### "Environment variable not found: DATABASE_URL"
Make sure `.env` file exists in the project root (not `.env.example`).
