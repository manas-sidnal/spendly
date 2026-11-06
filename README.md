# Spendly – personal expense tracker

Next.js 15 (React 19 frontend + API routes as the Node backend), Postgres on Supabase via Prisma,
cookie-based login (bcrypt + signed JWT), Recharts for charts. Everything runs on free tiers.

## Structure
```
app/
  page.tsx                  dashboard (protected)
  login/page.tsx            sign in / create account
  api/auth/{login,signup,logout}/route.ts
  api/expenses/route.ts     GET ?month=YYYY-MM, POST
  api/expenses/[id]/route.ts  DELETE
components/Dashboard.tsx    form, stats, charts, table
lib/                        db (Prisma), jwt, auth (cookies), constants (categories)
middleware.ts               redirects to /login when not signed in
prisma/schema.prisma        User, Expense
```

## Run locally
1. `npm install`
2. Create a free project at supabase.com. Project Settings -> Database -> Connection string.
3. `cp .env.example .env` and fill in:
   - `DATABASE_URL` (pooled, port 6543) and `DIRECT_URL` (direct, port 5432)
   - `AUTH_SECRET` from `openssl rand -base64 32`
4. `npm run db:push` to create the tables
5. `npm run dev`, open http://localhost:3000 and create your account (the first account is always allowed)

## Deploy (Vercel, free)
1. Push this folder to GitHub and import it in Vercel.
2. Add `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (and optionally `ALLOW_SIGNUP`) as environment variables.
3. Deploy. The build script runs `prisma generate` automatically.

## Notes
- Sign-ups are closed after the first account unless `ALLOW_SIGNUP="true"`.
- Amounts are stored as `Decimal(12,2)`, dates as plain dates (no timezone drift).
- Categories and payment methods live in `lib/constants.ts`.

## Next steps
- Edit existing expenses (PATCH route + inline form)
- Monthly budgets per category with overspend warnings
- Income, recurring bills, CSV export/import
- PWA install support
