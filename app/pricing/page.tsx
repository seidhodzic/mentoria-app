import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Public pricing entry + Stripe cancel URL target.
 * Logged-in members are sent to `/user/upgrade` with the same query string (plans & checkout).
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const q = new URLSearchParams();
    const canceled = searchParams.canceled;
    const locked = searchParams.locked;
    const success = searchParams.success;
    if (typeof canceled === 'string') q.set('canceled', canceled);
    if (typeof locked === 'string') q.set('locked', locked);
    if (typeof success === 'string') q.set('success', success);
    redirect(`/user/upgrade${q.toString() ? `?${q}` : ''}`);
  }

  return (
    <div className="min-h-screen bg-teal px-4 py-24 text-center text-light">
      <h1 className="font-condensed text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
        Pricing
      </h1>
      <p className="mx-auto mt-4 max-w-md font-sans text-base font-light text-white/75">
        Sign in to your Mentoria account to choose a subscription or one-time product.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="rounded-sm bg-gold px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-teal transition hover:bg-gold-dark"
        >
          Sign in
        </Link>
        <Link href="/register" className="font-sans text-sm font-semibold text-gold underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
