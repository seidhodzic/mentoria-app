'use client';

import type { CheckoutPlanKey } from '@/lib/payments/checkout-plan-keys';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  /** From server: only true when URL had `locked=1` and user still lacks premium (avoids stale query after payment). */
  showLockedCallout: boolean;
  showSuccessCallout: boolean;
  showCanceledCallout: boolean;
};

export default function UpgradeClient({
  showLockedCallout,
  showSuccessCallout,
  showCanceledCallout,
}: Props) {
  const [loadingKey, setLoadingKey] = useState<CheckoutPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planKey: CheckoutPlanKey) {
    setError(null);
    setLoadingKey(planKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          successUrl: '/user?success=true',
          cancelUrl: '/user/upgrade?canceled=true',
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Checkout failed');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError('No checkout URL returned');
    } catch {
      setError('Network error');
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-teal pb-16 pt-24 text-light">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          href="/user"
          className="mb-8 inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-gold hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {showSuccessCallout && (
          <div
            className="mb-10 rounded-sm border-2 border-green-400/60 bg-teal-mid/90 px-5 py-4 shadow-md"
            role="status"
          >
            <p className="font-condensed text-xl font-bold uppercase tracking-wide text-white">
              Payment successful
            </p>
            <p className="mt-2 max-w-2xl font-sans text-sm font-light text-white/85">
              Your subscription is processing. If premium areas still show as locked, wait a few seconds for webhooks to
              sync, then refresh.
            </p>
          </div>
        )}

        {showCanceledCallout && (
          <div
            className="mb-10 rounded-sm border border-white/20 bg-teal-mid/80 px-5 py-4 shadow-md"
            role="status"
          >
            <p className="font-condensed text-lg font-bold uppercase tracking-wide text-gold">Checkout canceled</p>
            <p className="mt-2 font-sans text-sm font-light text-white/80">
              No charges were made. You can choose a plan again whenever you are ready.
            </p>
          </div>
        )}

        {showLockedCallout && (
          <div
            className="mb-10 rounded-sm border-2 border-gold bg-teal-mid px-5 py-4 shadow-md"
            role="status"
          >
            <p className="font-condensed text-xl font-bold uppercase tracking-wide text-gold">
              Premium Access Required
            </p>
            <p className="mt-2 max-w-2xl font-sans text-sm font-light text-white/85">
              Upgrade to unlock full courses, quizzes, materials, and sessions. Choose a subscription or a
              one-time product below.
            </p>
          </div>
        )}

        <header className="mb-10 text-center">
          <h1 className="font-condensed text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
            Upgrade &amp; pricing
          </h1>
          <p className="mt-3 font-sans text-base font-light text-white/75">
            Subscriptions for ongoing access, or one-time purchases for targeted programs.
          </p>
        </header>

        {error && (
          <p className="mb-6 rounded-sm border border-red-400/50 bg-red-950/40 px-4 py-3 text-center text-sm text-red-100">
            {error}
          </p>
        )}

        <section className="mb-12">
          <h2 className="mb-6 font-condensed text-xl font-bold uppercase tracking-wide text-gold">
            Membership
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-sm border border-gold/25 bg-teal-mid/90 p-6 shadow-md">
              <h3 className="font-condensed text-2xl font-bold uppercase text-white">Monthly</h3>
              <p className="mt-2 font-condensed text-3xl font-black text-gold">€49 / month</p>
              <p className="mt-4 flex-1 font-sans text-sm font-light leading-relaxed text-white/80">
                Full platform access, cancel anytime
              </p>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => startCheckout('monthly')}
                className="mt-6 rounded-sm bg-gold px-4 py-3 font-sans text-sm font-bold uppercase tracking-wider text-teal transition hover:bg-gold-dark disabled:opacity-50"
              >
                {loadingKey === 'monthly' ? 'Redirecting…' : 'Subscribe monthly'}
              </button>
            </div>

            <div className="relative flex flex-col rounded-sm border-2 border-gold bg-[#0d2229]/50 p-6 shadow-md">
              <span className="absolute right-4 top-4 rounded-sm bg-gold px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-teal">
                Best Value — Save 20%
              </span>
              <h3 className="font-condensed text-2xl font-bold uppercase text-white">Annual</h3>
              <p className="mt-2 font-condensed text-3xl font-black text-gold">€39 / month</p>
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-white/60">
                billed annually
              </p>
              <p className="mt-4 flex-1 font-sans text-sm font-light leading-relaxed text-white/80">
                Full platform access for a year at the best rate.
              </p>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => startCheckout('annual')}
                className="mt-6 rounded-sm bg-gold px-4 py-3 font-sans text-sm font-bold uppercase tracking-wider text-teal transition hover:bg-gold-dark disabled:opacity-50"
              >
                {loadingKey === 'annual' ? 'Redirecting…' : 'Subscribe annually'}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 font-condensed text-xl font-bold uppercase tracking-wide text-gold">
            One-time services
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-sm border border-white/10 bg-teal-mid/80 p-5">
              <h3 className="font-condensed text-lg font-bold uppercase text-white">FIFA Agent Exam Prep</h3>
              <p className="mt-2 font-condensed text-2xl font-black text-gold">€199</p>
              <p className="mt-3 flex-1 font-sans text-sm font-light text-white/75">
                Complete prep course with AI quiz generator
              </p>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => startCheckout('fifa_exam')}
                className="mt-4 rounded-sm bg-gold px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-teal hover:bg-gold-dark disabled:opacity-50"
              >
                {loadingKey === 'fifa_exam' ? 'Redirecting…' : 'Buy now'}
              </button>
            </div>

            <div className="flex flex-col rounded-sm border border-white/10 bg-teal-mid/80 p-5">
              <h3 className="font-condensed text-lg font-bold uppercase text-white">
                Club Investment Masterclass
              </h3>
              <p className="mt-2 font-condensed text-2xl font-black text-gold">€249</p>
              <p className="mt-3 flex-1 font-sans text-sm font-light text-white/75">
                Buy-side due diligence &amp; Balkans market framework
              </p>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => startCheckout('investment_masterclass')}
                className="mt-4 rounded-sm bg-gold px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-teal hover:bg-gold-dark disabled:opacity-50"
              >
                {loadingKey === 'investment_masterclass' ? 'Redirecting…' : 'Buy now'}
              </button>
            </div>

            <div className="flex flex-col rounded-sm border border-white/10 bg-teal-mid/80 p-5">
              <h3 className="font-condensed text-lg font-bold uppercase text-white">1-on-1 Advisory Session</h3>
              <p className="mt-2 font-condensed text-2xl font-black text-gold">€299</p>
              <p className="mt-3 flex-1 font-sans text-sm font-light text-white/75">
                60-minute expert consultation
              </p>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => startCheckout('advisory_session')}
                className="mt-4 rounded-sm bg-gold px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-teal hover:bg-gold-dark disabled:opacity-50"
              >
                {loadingKey === 'advisory_session' ? 'Redirecting…' : 'Book & pay'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
