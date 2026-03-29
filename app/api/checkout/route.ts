import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/payments/stripe-provider';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceId, mode, successUrl, cancelUrl } = await req.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', session.user.id)
      .single();

    // Always include userId in metadata regardless of mode
    const metadata = { userId: session.user.id };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: mode ?? 'subscription',
      payment_method_types: ['card'],
      customer_email: profile?.email ?? session.user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${siteUrl}/user?success=1`,
      cancel_url: cancelUrl ?? `${siteUrl}/user?cancelled=1`,
      metadata,
      // For subscriptions, also attach metadata to the subscription object itself
      // so it's available in subscription webhook events
      ...(mode !== 'payment' ? { subscription_data: { metadata } } : {}),
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
