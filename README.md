# Spendly – Personal Expense Tracker

Spendly is a minimal, fast, and responsive personal expense tracker built with Next.js (App Router), React 19, TypeScript, Tailwind CSS, and Prisma with PostgreSQL (e.g. Supabase). It features cookie-based JWT authentication, offline PWA support, category analytics, and daily breakdowns.

---

## Features

- **PWA & Mobile-First**: Installable as a Progressive Web App (Service Worker, Web App Manifest, offline fallback page).
- **Authentication & Security**: Secure cookie-based sessions (JWT signed with `jose` using HS256, passwords hashed with `bcryptjs`).
- **Single or Multi-user Control**: Initial admin account creation is always enabled; subsequent sign-ups can be disabled via `ALLOW_SIGNUP="false"`.
- **Expense Management**:
  - Add, edit (PATCH), and delete expenses.
  - Precise currency math (`Decimal(12,2)`) and date handling without timezone drift.
  - Payment method tracking (UPI, Card, Cash, Net banking).
  - Notes and tags per expense.
- **Visual Analytics**:
  - Daily spending bar charts via Recharts.
  - Category breakdown with visual color coding.
  - Separate rent tracking and exclude-from-average rules for fixed lump-sum bills.
  - Month-by-month picker with previous/next navigation.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: React 19
- **Database ORM**: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg` / `pg`)
- **Validation**: Zod
- **Auth**: `jose` (JWT) + `bcryptjs`
- **Charts**: Recharts
- **Styling**: Tailwind CSS / Vanilla CSS Variables

---

## Project Structure

```
spendly/
├── app/
│   ├── layout.tsx                     # Root layout with PWA metadata & service worker registration
│   ├── page.tsx                       # Protected dashboard route
│   ├── globals.css                    # Design system tokens and styles
│   ├── login/
│   │   └── page.tsx                   # Auth page (Sign in / Sign up)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts         # User login endpoint
│       │   ├── logout/route.ts        # Clear session cookie
│       │   ├── signup/route.ts        # User registration endpoint
│       │   ├── me/route.ts            # Fetch current logged-in user profile
│       │   └── status/route.ts        # Check if any user accounts exist
│       └── expenses/
│           ├── route.ts               # GET (?month=YYYY-MM) and POST expenses
│           └── [id]/route.ts          # PATCH and DELETE expense by ID
├── components/
│   ├── Dashboard.tsx                  # Main dashboard state & orchestration
│   ├── AddExpense.tsx                 # Modal/drawer form to log an expense
│   ├── EditExpense.tsx                # Modal/drawer form to edit an expense
│   ├── CategoryBreakdown.tsx          # Category summary & distribution
│   ├── CategoryDetail.tsx             # Category deep-dive view
│   ├── DailyChart.tsx                 # Recharts daily bar chart
│   ├── DayCard.tsx                    # Daily grouping card
│   ├── ExpenditureView.tsx            # Expense list presentation
│   ├── ExpenseRow.tsx                 # Individual expense row with action triggers
│   ├── MonthPicker.tsx                # Month navigation popover
│   ├── ServiceWorkerRegister.tsx      # Registers /sw.js in the browser
│   ├── UserMenu.tsx                   # Profile details & sign out modal
│   └── icons.tsx                      # SVG icon set
├── lib/
│   ├── auth.ts                        # Session cookie helpers (createSession, destroySession, getUserId)
│   ├── calc.ts                        # Expense math, aggregations, daily averages
│   ├── constants.ts                   # Categories, payment methods, category color maps
│   ├── db.ts                          # PrismaClient singleton with PrismaPg adapter
│   ├── expense.ts                     # Zod schema validation & serialization helpers
│   ├── format.ts                      # Currency and date formatting utilities
│   ├── jwt.ts                         # Token creation and verification with jose
│   └── types.ts                       # Shared TypeScript interfaces
├── prisma/
│   ├── schema.prisma                  # Prisma data models (User, Expense)
│   └── config.ts                      # Prisma config (datasource url configuration)
├── public/
│   ├── manifest.webmanifest           # PWA web manifest
│   ├── sw.js                          # Service worker cache strategy & offline support
│   └── offline.html                   # Offline fallback UI
└── middleware.ts                      # Session route protection
```

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- A PostgreSQL database (e.g. free project on [Supabase](https://supabase.com) or local PostgreSQL)

### 2. Installation
```bash
npm install
```
*(This triggers `prisma generate` via `postinstall` to compile `@/generated/prisma/client`.)*

### 3. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
Fill in the values in `.env`:
```env
# Supabase -> Project Settings -> Database -> Connection string
# Transaction pooler (port 6543) used by the running app:
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# Direct connection (port 5432) used by schema migrations/push:
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"

# Secret for signing JWT session cookies (e.g. generate via: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret"

# Allow new user registrations beyond the first user ("true" or "false")
ALLOW_SIGNUP="false"
```

### 4. Push Database Schema
Apply the Prisma schema to your PostgreSQL database:
```bash
npm run db:push
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The first user to register becomes the primary user.

---

## Production Deployment (e.g., Vercel)

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `ALLOW_SIGNUP` (optional, defaults to `"false"`)
4. Deploy. The `npm run build` script automatically runs `prisma generate && next build`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the Next.js development server with Turbopack |
| `npm run build` | Generates the Prisma client and compiles the Next.js production build |
| `npm run start` | Starts the production Next.js server |
| `npm run db:push` | Pushes the schema in `prisma/schema.prisma` directly to the database |
| `npm run db:studio` | Opens Prisma Studio to browse and edit database records |
| `npx tsc --noEmit` | Runs full static TypeScript type checks |
