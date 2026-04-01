/**
 * Alias for Stripe Dashboard / docs that expect `/api/stripe/webhook`.
 * Canonical handler: `app/api/webhook/stripe/route.ts`
 */
import { POST as webhookPost } from '@/app/api/webhook/stripe/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = webhookPost;
