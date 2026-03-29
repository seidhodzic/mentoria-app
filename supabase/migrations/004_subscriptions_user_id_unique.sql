-- Enables Supabase upsert(..., { onConflict: 'user_id' }) from Stripe webhooks
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions (user_id);
