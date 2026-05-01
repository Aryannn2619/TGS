# TheGrindSociety — Platform (v0.2)

Production-ready spine for the multi-user fitness SaaS + trainer marketplace.
Built with Next.js 14 (App Router), Prisma, NextAuth, Razorpay, Tailwind.

## Status

### v0.2 additions — Progress Tracker
- ✅ Body measurements table + log form (`/progress/log`) — weight, body fat, chest, waist, hips, arms, thighs, shoulders, neck
- ✅ Progress photos table + gallery (`/progress/photos`) — front/side/back angle, private/trainer/leaderboard visibility
- ✅ Workout logs + per-exercise sets/reps/weight/RPE (`/workout/log`)
- ✅ Auto-detected PRs (1RM Epley, max weight, max reps, max volume) on every workout save
- ✅ Progressive overload tracker (improved/same/dropped vs last session)
- ✅ Volume per muscle group (auto-classified by exercise name)
- ✅ Smart Progress Score (0–100, weighted across consistency/nutrition/sleep/steps/goal/strength)
- ✅ Heuristic "Analyze My Progress" output (going-well / slowing / next-week)
- ✅ 30-day workout heatmap, weight trend chart, waist trend chart (inline SVG, no chart deps)
- ✅ APIs: `progress/log,history,summary,photo,photos,analyze` + `workouts/log,history,progress,prs,volume`
- ✅ New nav link `/progress` for logged-in users

### v0.1 base
- ✅ Auth (email + password, hashed) with `client | trainer | admin` roles
- ✅ Role-gated dashboards (`/client`, `/trainer`, `/admin`) via middleware
- ✅ Prisma schema for all 15 spec tables (sqlite for dev, Postgres-portable)
- ✅ 3 challenges seeded (₹1000, ₹1000, ₹3000)
- ✅ Razorpay order + signature verification (server-side) with **mock mode** when keys absent
- ✅ 70/30 platform/trainer split written atomically on payment verify
- ✅ Trainer apply → admin approve/reject → marketplace
- ✅ Booking flow → payment → trainer earning record
- ✅ Client dashboard: BMR/TDEE/macro targets (Mifflin-St Jeor), active challenge, payment history
- ✅ Trainer dashboard: total/trainer share/platform share/pending payout, request payout
- ✅ Admin dashboard: platform analytics + pending trainer queue with approve/reject

## Not yet (flagged for next milestone)

- Email verification + forgot password (needs SMTP)
- Google OAuth (needs OAuth client ID/secret)
- Cloudinary file uploads — both for trainer certs AND progress photos (schema has URL fields; wire one upload util)
- Real AI progress analysis via Claude API (heuristic stub in place at `/api/progress/analyze`; swap with `lib/analyze.ts` calling the SDK once `ANTHROPIC_API_KEY` is set, server-only)
- Notifications/reminders (need cron + email or push)
- Calendar heatmap (currently last-30-days grid; expand to GitHub-style year)
- Achievement badges table (currently derived on-the-fly from PRs/streaks)
- Daily-goal generator per challenge (skeleton in `lib/fitness.ts`)
- "Ask Your Coach" chat
- Admin payout approval flow (status fields in schema; UI not built)
- Reviews submission (table exists, UI not built)
- Subscriptions / starter kit store

> **Note on schema rename:** the original v0.1 spec called the body-measurement table `progress_logs`. To avoid colliding with the existing daily-activity `ProgressLog` model, body measurements live in the new `BodyMeasurement` model. Photo tracking moved out of the old `progressPhotoUrl` column on `ProgressLog` (now removed) into a dedicated `ProgressPhoto` table.

## Setup

Prereqs: Node 18+, npm.

```bash
# 1. Install Node if missing (macOS):
brew install node

# 2. Install deps
cd TheGrindSociety-platform
npm install

# 3. Configure env
cp .env.example .env
# Open .env and at minimum set NEXTAUTH_SECRET (run `openssl rand -base64 32`)
# Leave Razorpay keys empty to run in mock-payment mode.

# 4. Initialize DB and seed
npm run db:push
npm run db:seed

# 5. Start dev server
npm run dev
```

Visit http://localhost:3000.

## Seeded accounts

| Role    | Email                              | Password    |
|---------|------------------------------------|-------------|
| admin   | admin@thegrindsociety.com          | admin123    |
| trainer | aarav@thegrindsociety.com          | trainer123  |

> Change these immediately for any real environment.

## Mock-payment mode (default for dev)

If `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not set, the platform skips
the real Razorpay checkout: clicking *Unlock Challenge* / *Hire* posts a fake
order ID and bypasses signature verification on `/api/payments/verify`.

This lets you click through the whole flow end-to-end without keys, and exercises
the same DB writes as real mode (challenge unlocks, booking activates, 70/30 split row).

## Real Razorpay (test mode)

1. Create a Razorpay account, enable **test mode**, copy your Test Key ID + Secret.
2. Set in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
   ```
3. Restart `npm run dev`. Now the join button opens the real Razorpay checkout, and
   `/api/payments/verify` enforces HMAC-SHA256 signature checks against your secret.

For prod: switch to live keys + KYC-completed merchant account.

## Switch to Postgres for production

1. In `prisma/schema.prisma` change:
   ```prisma
   datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
   ```
2. Set `DATABASE_URL` to your Supabase / Neon / RDS connection string.
3. `npm run db:migrate -- --name init`
4. `npm run db:seed`

The schema is provider-agnostic; no other changes required.

## Deployment

- Frontend + API: Vercel (zero-config, set the env vars in dashboard).
- DB: Supabase free tier or Neon.
- File uploads (when wired): Cloudinary.
- Set `NEXTAUTH_URL` and `APP_URL` to your prod domain. Generate a fresh `NEXTAUTH_SECRET`.

## API surface (implemented)

```
# v0.1
POST  /api/auth/register
GET   /api/auth/[...nextauth]   (login/logout via NextAuth)
GET   /api/user/profile
PUT   /api/user/profile
GET   /api/fitness/profile
POST  /api/fitness/profile
PUT   /api/fitness/profile
GET   /api/challenges
POST  /api/challenges/join
GET   /api/challenges/my-challenge
POST  /api/challenges/daily-log
GET   /api/trainers
POST  /api/trainers/apply
GET   /api/trainers/[id]
GET   /api/trainers/dashboard
GET   /api/trainers/earnings
POST  /api/trainers/earnings    (request payout)
POST  /api/bookings/create
GET   /api/bookings/my-bookings
POST  /api/payments/create-order
POST  /api/payments/verify
GET   /api/payments/history
GET   /api/admin/dashboard
GET   /api/admin/trainers/pending
PUT   /api/admin/trainers/[id]/approve
PUT   /api/admin/trainers/[id]/reject

# v0.2 — Progress Tracker
POST  /api/progress/log         body measurement entry
GET   /api/progress/history     last N days of measurements
GET   /api/progress/summary     overview cards + score + heatmap
POST  /api/progress/photo       add photo (URL only for now)
GET   /api/progress/photos      gallery
POST  /api/progress/analyze     heuristic analysis (Claude API stub)
POST  /api/workouts/log         workout + exercises (auto-PR detection)
GET   /api/workouts/history
GET   /api/workouts/progress    progressive overload per exercise
GET   /api/workouts/prs
GET   /api/workouts/volume      weekly volume per muscle group
```

## Security notes

- Passwords hashed with bcrypt cost 10.
- Razorpay signature verified server-side with `crypto.timingSafeEqual` against HMAC-SHA256.
- Frontend never trusted for payment status — `/payments/verify` is the single source.
- All write APIs run zod validation on inputs.
- Role gating happens both in middleware (page protection) and in each API handler (`requireRole`).
- Atomic transaction on payment verify (`prisma.$transaction`) — either all writes succeed or none.

## Layout

```
src/
  app/
    api/                # all API routes
    components/Nav.tsx
    page.tsx            # landing
    login/, signup/
    challenges/         # list + [slug] detail with JoinButton
    trainers/           # marketplace + [id] detail with HireButton
    client/dashboard/, client/fitness-profile/
    trainer/dashboard/, trainer/apply/
    admin/dashboard/
    layout.tsx, providers.tsx, globals.css
  lib/
    prisma.ts           # singleton client
    auth.ts             # NextAuth config
    rbac.ts             # requireRole helper
    razorpay.ts         # SDK + signature verify + 70/30 split
    fitness.ts          # BMR / TDEE / macros math
  types/next-auth.d.ts  # session+JWT type augmentation
  middleware.ts         # role-based route gating
prisma/
  schema.prisma
  seed.ts
```
