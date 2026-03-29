import Stripe from 'stripe';
import { env } from '@/lib/env';

let stripe: Stripe | null = null;

/** Server-only Stripe client. Requires `STRIPE_SECRET_KEY`. */
export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripe) {
    stripe = new Stripe(env.stripeSecretKey);
  }
  return stripe;
}
