import type { NextRequest } from 'next/server';
import { handleStripeCheckoutPost } from '@/lib/payments/stripe-checkout-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleStripeCheckoutPost(req);
}
