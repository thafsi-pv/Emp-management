# Employee Payroll Management System — NestJS Backend

Production-ready NestJS REST API connected to **Supabase PostgreSQL**.

> 📖 **First time setup?** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for step-by-step instructions.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript |
| ORM | Prisma (with Supabase pgbouncer support) |
| Database | Supabase PostgreSQL |
| Auth | JWT — Access token (15m) + Refresh token (7d) |
| File Upload | Multer (disk storage) |
| PDF | PDFKit |
| Validation | class-validator + class-transformer |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure (fill in your Supabase URLs + JWT secrets)
cp .env.example .env

# 3. Generate Prisma client + push schema + seed data
npm run setup

# 4. Start dev server
npm run start:dev
# → http://localhost:3000/api
```

**Default logins after seed:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@company.com | admin123 |
| Supervisor | supervisor@company.com | super123 |
| Employee | mohammed@company.com | emp123 |

---

## Environment Variables

```env
# Supabase — Pooled (port 6543) — used by app at runtime
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase — Direct (port 5432) — used by prisma migrate/push/seed
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"

JWT_ACCESS_SECRET="your-64-char-secret"
JWT_REFRESH_SECRET="your-other-64-char-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

PORT=3000
FRONTEND_URL="http://localhost:5173"
```

---

## Project Structure

```
src/
├── auth/
│   ├── decorators/          @CurrentUser(), @Roles()
│   ├── guards/              JwtAuthGuard, RolesGuard
│   ├── strategies/          jwt.strategy.ts
│   └── auth.service.ts      Login, logout, refresh, JWT generation
├── prisma/
│   └── prisma.service.ts    Global PrismaClient (Supabase-aware)
├── common/
│   └── dto/pagination.dto.ts
├── config/
│   └── database.config.ts   Supabase connection notes
└── modules/
    ├── departments/
    ├── designations/
    ├── employees/            Photo upload (Multer)
    ├── appointments/         + PDF generation (PDFKit)
    ├── attendance/           Approve/reject workflow
    ├── payroll/              Auto-calc from attendance + payslip PDF
    ├── service-break/
    ├── contract-renewal/     Creates new appointment automatically
    ├── contract-termination/ Cascades to employee + appointments
    └── reports/              Dashboard stats + all report types
```

---

## API Reference

### Auth
```
POST  /api/auth/login
POST  /api/auth/logout        (Bearer token required)
POST  /api/auth/refresh
GET   /api/auth/me            (Bearer token required)
```

### Employees
```
GET    /api/employees         ?search=&departmentId=&status=&page=&limit=
GET    /api/employees/stats
GET    /api/employees/:id
POST   /api/employees         (ADMIN, multipart/form-data)
PATCH  /api/employees/:id     (ADMIN)
DELETE /api/employees/:id     (ADMIN)
```

### Departments & Designations
```
GET    /api/departments
POST   /api/departments       (ADMIN)
PATCH  /api/departments/:id   (ADMIN)
DELETE /api/departments/:id   (ADMIN)

GET    /api/designations
POST   /api/designations      (ADMIN)
```

### Appointments
```
GET   /api/appointments           ?employeeId=&status=&page=&limit=
GET   /api/appointments/expiring  ?days=30
GET   /api/appointments/:id
GET   /api/appointments/:id/pdf   → PDF download
POST  /api/appointments           (ADMIN)
PATCH /api/appointments/:id       (ADMIN)
```

### Attendance
```
GET    /api/attendance              ?date=&month=&year=&employeeId=&approvalStatus=
GET    /api/attendance/daily-summary?date=YYYY-MM-DD
POST   /api/attendance
POST   /api/attendance/bulk
PATCH  /api/attendance/:id/approve  (ADMIN, SUPERVISOR)
PATCH  /api/attendance/:id/reject   (ADMIN, SUPERVISOR)
```

### Payroll
```
GET   /api/payroll              ?month=&year=&employeeId=&status=
GET   /api/payroll/summary      ?month=&year=
GET   /api/payroll/:id
GET   /api/payroll/:id/payslip  → PDF download
POST  /api/payroll/generate     (ADMIN)
PATCH /api/payroll/:id/approve  (ADMIN)
PATCH /api/payroll/:id/paid     (ADMIN)
```

### Service Breaks
```
GET    /api/service-breaks
POST   /api/service-breaks      (ADMIN)
PATCH  /api/service-breaks/:id  (ADMIN)
DELETE /api/service-breaks/:id  (ADMIN)
```

### Contract Renewal & Termination
```
GET  /api/contract-renewals
POST /api/contract-renewals         (ADMIN)

GET  /api/contract-terminations
POST /api/contract-terminations     (ADMIN)
```

### Reports
```
GET  /api/reports/dashboard
GET  /api/reports/employees   ?departmentId=&status=
GET  /api/reports/attendance  ?month=&year=&employeeId=
GET  /api/reports/payroll     ?month=&year=&departmentId=
GET  /api/reports/contracts   ?status=
```

---

## Payroll Formula (UAE)

```
Working days = weekdays excluding Friday & Saturday
Earned basic = (basicSalary ÷ totalWorkingDays) × workedDays
Net salary   = earnedBasic + allowance + bonus + gratuity + overtime − deduction
```

Only `APPROVED` attendance records count toward payroll.

---

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Start with ts-node (hot reload) |
| `npm run build` | Compile TypeScript → dist/ |
| `npm run start` | Run compiled output |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to Supabase (dev) |
| `npm run prisma:migrate` | Create & apply migration |
| `npm run prisma:migrate:deploy` | Apply pending migrations (prod/CI) |
| `npm run prisma:seed` | Seed sample data |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run setup` | generate + push + seed (one command) |
