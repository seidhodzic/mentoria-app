-- Dedupe Stripe webhook deliveries: same event id (evt_…) must not apply business logic twice.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Stripe event ids already applied to the database; prevents duplicate processing on webhook retries.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Intentionally no GRANT to anon/authenticated; only service_role (webhooks) bypasses RLS.
