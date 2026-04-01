import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getStripe } from '@/lib/payments/stripe-provider';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_SUCCESS_PATH = '/dashboard?success=true';
const DEFAULT_CANCEL_PATH = '/pricing?canceled=true';

function absoluteUrl(base: string, pathOrUrl: string): string {
  const b = base.replace(/\/$/, '');
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  if (!pathOrUrl.startsWith('/')) {
    return `${b}/${pathOrUrl}`;
  }
  return `${b}${pathOrUrl}`;
}

/**
 * Authenticated Stripe Checkout Session creation (subscription or one-time payment).
 * Creates a Stripe Customer when missing and stores `stripe_customer_id` on `profiles`.
 */
export async function handleStripeCheckoutPost(req: NextRequest): Promise<NextResponse> {
  try {
    if (!env.stripeSecretKey) {
      return NextResponse.json(
        { error: 'Payments are not configured (missing STRIPE_SECRET_KEY).' },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      priceId?: unknown;
      mode?: unknown;
      successUrl?: unknown;
      cancelUrl?: unknown;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const priceId = typeof body.priceId === 'string' ? body.priceId.trim() : '';
    if (!priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'A valid Stripe Price ID is required (must start with price_)' },
        { status: 400 }
      );
    }

    const mode = body.mode === 'payment' ? 'payment' : 'subscription';
    const base = env.siteUrl.replace(/\/$/, '');

    const successRaw =
      typeof body.successUrl === 'string' && body.successUrl.length > 0
        ? body.successUrl
        : DEFAULT_SUCCESS_PATH;
    const cancelRaw =
      typeof body.cancelUrl === 'string' && body.cancelUrl.length > 0
        ? body.cancelUrl
        : DEFAULT_CANCEL_PATH;

    const success_url = absoluteUrl(base, successRaw);
    const cancel_url = absoluteUrl(base, cancelRaw);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('stripe checkout: profile missing', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const stripe = getStripe();
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email ?? undefined,
        metadata: {
          userId: user.id,
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      const { error: saveErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      if (saveErr) {
        console.error('stripe checkout: failed to save stripe_customer_id', saveErr);
        return NextResponse.json({ error: 'Could not save Stripe customer' }, { status: 500 });
      }
    }

    const metadata = { userId: user.id, supabase_user_id: user.id };

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata,
      ...(mode === 'subscription'
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('handleStripeCheckoutPost:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
