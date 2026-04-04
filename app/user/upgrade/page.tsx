import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
import UpgradeClient from './UpgradeClient';

export const dynamic = 'force-dynamic';

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr) {
    redirect('/user');
  }
  if (!profile) {
    redirect('/user');
  }

  const { data: subRows } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const sub = subRows?.[0];
  const latestSub = sub?.status ?? null;
  const latestPlan = sub?.plan ?? null;
  const hasPremium = memberHasPremiumAccess(profile, latestSub, latestPlan);

  const lockedRaw = firstParam(searchParams.locked);
  const lockedParam = lockedRaw === '1' || lockedRaw === 'true';
  const canceled = firstParam(searchParams.canceled) === 'true';
  const success = firstParam(searchParams.success) === 'true';

  /** Drop stale `locked` after payment so the callout does not persist on the upgrade hub. */
  if (hasPremium && lockedParam) {
    const q = new URLSearchParams();
    if (canceled) q.set('canceled', 'true');
    if (success) q.set('success', 'true');
    redirect(`/user/upgrade${q.toString() ? `?${q.toString()}` : ''}`);
  }

  const showLockedCallout = lockedParam && !hasPremium;

  return (
    <UpgradeClient
      showLockedCallout={showLockedCallout}
      showSuccessCallout={success}
      showCanceledCallout={canceled}
    />
  );
}
