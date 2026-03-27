# Mentoria MVP

This is a production-oriented starter for the Mentoria platform with:
- Next.js App Router
- Supabase-ready authentication and Postgres schema
- role-based dashboards for admin, mentor, and user
- registration notification stub for internal emails
- a clean foundation for Stripe subscriptions and content modules

## What is included
- `/` landing page
- `/register` registration form with role selection
- `/login` login form
- `/dashboard` role router
- `/admin`, `/mentor`, `/user` dashboard scaffolds
- `supabase/schema.sql` with profiles, subscriptions, materials, quizzes, trigger, and RLS policies
- `.env.example` for required environment variables

## Important
This scaffold is ready to build on, but it will not be fully functional until you:
1. create a Supabase project
2. paste your environment variables into `.env.local`
3. run `supabase/schema.sql` in the Supabase SQL editor
4. deploy to Vercel or run locally
5. replace the email notification stub with a real provider like Resend, Postmark, or SendGrid
6. connect Stripe if you want paid subscriptions

## Local setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Recommended next build steps
1. Connect real Supabase credentials
2. Add protected server-side role checks everywhere you need them
3. Add Stripe subscription checkout and webhook sync
4. Add admin tables for users, materials, quizzes, and mentor approvals
5. Add file uploads using Supabase Storage
6. Add email templates and transactional emails

## Suggested deployment architecture
- Marketing site: GitHub Pages or Vercel
- App: Vercel
- Database/Auth/Storage: Supabase
- Billing: Stripe
- Email: Resend or Postmark

