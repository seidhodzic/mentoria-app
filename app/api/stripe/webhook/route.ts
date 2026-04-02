/**
 * Backward-compatible alias: some dashboards and docs use `/api/stripe/webhook`.
 *
 * **Configure only one URL in Stripe** (Dashboard → Developers → Webhooks) to avoid duplicate
 * deliveries and confusing signing secrets. Recommended:
 * `https://<your-domain>/api/webhook/stripe`
 *
 * This route re-exports the same `POST` handler as `app/api/webhook/stripe/route.ts`.
 * Do not implement different logic here.
 */
import { POST as webhookPost } from '@/app/api/webhook/stripe/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = webhookPost;
