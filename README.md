# Mentoria — Members Platform

A premium advisory SaaS platform for sports, investment and education professionals in the Balkans region.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database/Auth:** Supabase
- **Payments:** Stripe
- **Email:** Resend
- **AI:** Anthropic Claude API
- **Deployment:** Vercel
- **Styling:** Tailwind CSS + Custom CSS (Saira font)

## Local Setup

```bash
git clone https://github.com/seidhodzic/mentoria-app
cd mentoria-app
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL |
| `ANTHROPIC_API_KEY` | Claude API key for AI features |
| `RESEND_API_KEY` | Resend API key for emails |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Supabase Setup

1. Create a new Supabase project
2. Run migrations in order in SQL Editor (include `003_*` / `005_*` if present in your repo for admin helper and rate-limit storage):
   - `supabase/migrations/001_add_profile_fields.sql`
   - `supabase/migrations/002_sessions.sql`
   - `supabase/migrations/003_admin_helper.sql`
   - `supabase/migrations/004_subscriptions_user_id_unique.sql`
   - `supabase/migrations/005_rate_limit_buckets.sql`
3. Or run the full schema: `supabase/schema.sql`

## Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Add price IDs to `.env.local`
3. Set up webhook endpoint: `https://your-domain.com/api/webhook/stripe`
4. Add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Vercel Deployment

1. Push to GitHub
2. Import project at vercel.com
3. Add all environment variables from `.env.example` in the Vercel Dashboard UI
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL (e.g. `https://mentoria-app.vercel.app`)
5. Deploy

## User Roles

| Role | Access |
|---|---|
| `admin` | Full platform access + admin dashboard |
| `mentor` | Mentor dashboard, session management |
| `user` | Member dashboard, premium content (requires active subscription) |

## Features

- ✅ Authentication (login, register, password reset)
- ✅ Role-based dashboards (admin, mentor, user)
- ✅ Materials library with file uploads
- ✅ Course builder with lesson player and progress tracking
- ✅ AI-powered FIFA Agent Exam quiz generator (Claude API)
- ✅ AI assistant with streaming responses
- ✅ Mentor session booking with Google Meet
- ✅ Branded email notifications (Resend)
- ✅ Stripe subscription payments with webhook sync
- ✅ Premium content gating by subscription status

## Project Structure

```
app/          — Next.js App Router pages and API routes
components/   — Shared UI components
features/     — Feature components (courses, sessions, quizzes, materials)
lib/          — Utilities, Supabase clients, Stripe, emails
supabase/     — Database migrations and schema
types/        — TypeScript type definitions
```
