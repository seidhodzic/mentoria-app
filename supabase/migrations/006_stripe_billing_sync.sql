-- Stripe billing mirrors on profiles + price id on subscriptions (idempotent)

alter table public.profiles add column if not exists subscription_status text;
alter table public.profiles add column if not exists stripe_price_id text;
alter table public.profiles add column if not exists subscription_current_period_end timestamptz;

comment on column public.profiles.subscription_status is 'Mirrored Stripe subscription status (trialing, active, past_due, cancelled, inactive).';
comment on column public.profiles.stripe_price_id is 'Active Stripe Price ID (price_…) for the current subscription.';
comment on column public.profiles.subscription_current_period_end is 'End of current billing period from Stripe.';

alter table public.subscriptions add column if not exists stripe_price_id text;

comment on column public.subscriptions.stripe_price_id is 'Stripe Price ID (price_…) for this subscription row.';
