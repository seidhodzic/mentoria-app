'use client';

import { handleCheckout, notifyAdminOfSignup } from '@/app/auth/actions';
import PlanModal from '@/components/auth/PlanModal';
import ProfileRoleHint from '@/components/auth/ProfileRoleHint';
import {
  ONE_TIME_PRODUCTS,
  PROFILE_TYPES,
  type SignupAccessType,
  resolveSignupPlanKey,
} from '@/lib/auth/register-options';
import { createClient } from '@/lib/supabase-browser';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function fieldClass(extra = '') {
  return `w-full rounded-[2px] border-[1.5px] border-transparent bg-white px-3.5 py-[11px] font-sans text-[0.9rem] font-normal text-mentoria-teal outline-none transition-all placeholder:text-[rgba(25,53,62,0.28)] focus:border-mentoria-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(247,188,21,0.14)] ${extra}`;
}

function labelClass() {
  return 'mb-1.5 block font-sans text-[0.65rem] font-bold uppercase tracking-[0.14em] text-mentoria-teal opacity-[0.55]';
}

export default function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const isRegister = pathname === '/register';

  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [profileType, setProfileType] = useState<string>('');
  const [accessType, setAccessType] = useState<SignupAccessType>('subscription');
  const [subscriptionInterval, setSubscriptionInterval] = useState<'monthly' | 'annual'>('annual');
  const [oneTimeKey, setOneTimeKey] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<'monthly' | 'annual'>('annual');

  const selectedPlanLabel = useMemo(() => {
    return subscriptionInterval === 'annual'
      ? 'Annual — €39/mo'
      : 'Monthly — €49/mo';
  }, [subscriptionInterval]);

  useEffect(() => {
    if (accessType === 'one_time' && !oneTimeKey) {
      setOneTimeKey(ONE_TIME_PRODUCTS[0]?.key ?? null);
    }
  }, [accessType, oneTimeKey]);

  useEffect(() => {
    if (planModalOpen) {
      setModalPlan(subscriptionInterval);
    }
  }, [planModalOpen, subscriptionInterval]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '').trim();
    const supabase = createClient();

    try {
      if (forgotMode && !isRegister) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setMessage('Password reset email sent. Check your inbox.');
        return;
      }

      if (isRegister) {
        const firstName = String(fd.get('first_name') || '').trim();
        const lastName = String(fd.get('last_name') || '').trim();
        const passwordConfirm = String(fd.get('password_confirm') || '').trim();

        if (!profileType) {
          throw new Error('Please select your profile type.');
        }
        if (password !== passwordConfirm) {
          throw new Error('Passwords do not match.');
        }
        if (accessType === 'one_time' && !oneTimeKey) {
          throw new Error('Please select a one-time service.');
        }

        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const signup_plan_key = resolveSignupPlanKey(
          accessType,
          subscriptionInterval,
          oneTimeKey
        );

        const { data, error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName || email,
              first_name: firstName,
              last_name: lastName,
              role: 'user',
              profile_type: profileType,
              signup_access_type: accessType,
              signup_plan_key,
            },
          },
        });
        if (signErr) throw signErr;

        if (data.user) {
          notifyAdminOfSignup({
            userId: data.user.id,
            email,
            fullName: fullName || email,
            profile_type: profileType,
            signup_access_type: accessType,
            signup_plan_key,
            clientSecret: process.env.NEXT_PUBLIC_SIGNUP_NOTIFY_TOKEN ?? '',
          }).catch(() => {});
        }

        if (accessType === 'subscription' && data.user) {
          setRedirectingToPayment(true);
          const checkout = await handleCheckout({
            userId: data.user.id,
            email,
            planKey:
              subscriptionInterval === 'annual' ? 'subscription_annual' : 'subscription_monthly',
            clientSecret: process.env.NEXT_PUBLIC_SIGNUP_NOTIFY_TOKEN ?? '',
          });
          if (checkout.error) {
            setRedirectingToPayment(false);
            throw new Error(checkout.error);
          }
          if (checkout.url) {
            window.location.href = checkout.url;
            return;
          }
          setRedirectingToPayment(false);
        }

        setMessage('Registration successful! Check your email to confirm your account.');
        return;
      }

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Your account has been suspended. Contact support.');
      }

      const role = normalizeRole(profile?.role ?? data.user.user_metadata?.role);
      router.push(getDashboardPath(role) as '/');
      router.refresh();
    } catch (err) {
      setRedirectingToPayment(false);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  /** Hover/press motion aligned with AI assistant FAB (scale + brightness + gold glow). */
  const tabInteractive =
    'transition-all duration-300 ease-out hover:scale-[1.05] hover:brightness-[1.06] hover:shadow-[0_4px_24px_rgba(247,188,21,0.45)] active:scale-[0.98] active:brightness-95';
  const tabActive =
    `flex-1 rounded-md bg-mentoria-gold py-[9px] text-center font-sans text-[0.78rem] font-bold uppercase tracking-[0.1em] text-mentoria-teal ${tabInteractive}`;
  const tabIdleSignIn =
    `flex-1 rounded-md border-2 border-mentoria-gold bg-transparent py-[9px] text-center font-sans text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-mentoria-teal hover:bg-mentoria-gold hover:text-[#19353E] ${tabInteractive}`;
  const tabIdleJoin =
    `flex-1 rounded-md border-2 border-mentoria-gold bg-transparent py-[9px] text-center font-sans text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-mentoria-teal hover:bg-mentoria-gold hover:text-[#19353E] ${tabInteractive}`;

  return (
    <div className="mx-auto w-full max-w-[460px] px-1 sm:px-0">
      <div className="overflow-hidden rounded-[3px] border-b-4 border-b-[rgba(0,0,0,0.15)] bg-[#EFEFEF] shadow-[0_20px_50px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.1)]">
        <div className="h-[3px] bg-gradient-to-r from-mentoria-gold via-mentoria-gold-dark to-transparent" />
        <div className="px-[38px] pb-8 pt-7 max-sm:px-6 max-sm:pb-6 max-sm:pt-6">
          {/* Tabs live inside the card (marketing `login.html`) — avoids duplicate nav floating on navy */}
          {!forgotMode && !isRegister && (
            <div className="mb-6 flex gap-1.5">
              <Link href="/login" className={tabActive}>
                Sign In
              </Link>
              <Link href="/register" className={tabIdleJoin}>
                Join Mentoria
              </Link>
            </div>
          )}
          {!forgotMode && isRegister && (
            <div className="mb-6 flex gap-1.5">
              <Link href="/login" className={tabIdleSignIn}>
                Sign In
              </Link>
              <Link href="/register" className={tabActive}>
                Join Mentoria
              </Link>
            </div>
          )}

          {!isRegister && !forgotMode && (
            <>
              <p className="mb-2 flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.22em] text-mentoria-gold">
                <span className="h-0.5 w-[18px] bg-mentoria-gold" aria-hidden />
                Member Access
              </p>
              <h2 className="font-condensed text-[1.6rem] font-black uppercase leading-none tracking-[0.02em] text-mentoria-teal">
                Sign In
              </h2>
              <p className="mt-2 font-sans text-[0.8rem] font-light leading-[1.75] text-[rgba(25,53,62,0.55)]">
                Welcome back to your Mentoria dashboard.
              </p>
            </>
          )}

          {!isRegister && forgotMode && (
            <>
              <p className="mb-2 flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.22em] text-mentoria-gold">
                <span className="h-0.5 w-[18px] bg-mentoria-gold" aria-hidden />
                Password Reset
              </p>
              <h2 className="font-condensed text-[1.6rem] font-black uppercase leading-none tracking-[0.02em] text-mentoria-teal">
                Reset Password
              </h2>
              <p className="mt-2 font-sans text-[0.8rem] font-light leading-[1.75] text-[rgba(25,53,62,0.55)]">
                We&apos;ll email you a secure link to choose a new password.
              </p>
            </>
          )}

          {isRegister && (
            <>
              <p className="mb-2 flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.22em] text-mentoria-gold">
                <span className="h-0.5 w-[18px] bg-mentoria-gold" aria-hidden />
                New Membership
              </p>
              <h2 className="font-condensed text-[1.6rem] font-black uppercase leading-none tracking-[0.02em] text-mentoria-teal">
                Join Mentoria
              </h2>
              <p className="mt-2 font-sans text-[0.8rem] font-light leading-[1.75] text-[rgba(25,53,62,0.55)]">
                Create your account and choose how you want to access the platform.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-[14px]">
            {isRegister && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className={labelClass()}>
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    required
                    autoComplete="given-name"
                    className={fieldClass()}
                    placeholder="First"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className={labelClass()}>
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    required
                    autoComplete="family-name"
                    className={fieldClass()}
                    placeholder="Last"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass()}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={fieldClass()}
                placeholder="your@email.com"
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label htmlFor="profile_type" className={labelClass()}>
                    I am a...
                  </label>
                  <div className="relative">
                    <select
                      id="profile_type"
                      name="profile_type"
                      required
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      className={`${fieldClass()} cursor-pointer appearance-none bg-white pr-10`}
                    >
                      <option value="">Select your profile</option>
                      {PROFILE_TYPES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[rgba(25,53,62,0.4)]"
                      aria-hidden
                    />
                  </div>
                  <ProfileRoleHint profileType={profileType} />
                </div>

                <div>
                  <p className={labelClass()}>Access Type</p>
                  <div className="grid grid-cols-2 overflow-hidden rounded-[2px] border-[1.5px] border-[rgba(25,53,62,0.15)]">
                    <button
                      type="button"
                      onClick={() => setAccessType('subscription')}
                      className={`flex flex-col items-center px-2.5 py-3 text-center transition-all ${
                        accessType === 'subscription' ? 'bg-mentoria-teal' : 'bg-white'
                      }`}
                    >
                      <span
                        className={`mb-0.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] ${
                          accessType === 'subscription'
                            ? 'text-mentoria-gold'
                            : 'text-[rgba(25,53,62,0.6)]'
                        }`}
                      >
                        Subscription
                      </span>
                      <span
                        className={`text-[0.62rem] font-normal ${
                          accessType === 'subscription'
                            ? 'text-[rgba(255,255,255,0.5)]'
                            : 'text-[rgba(25,53,62,0.35)]'
                        }`}
                      >
                        Full platform access
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccessType('one_time')}
                      className={`flex flex-col items-center px-2.5 py-3 text-center transition-all ${
                        accessType === 'one_time' ? 'bg-mentoria-teal' : 'bg-white'
                      }`}
                    >
                      <span
                        className={`mb-0.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] ${
                          accessType === 'one_time'
                            ? 'text-mentoria-gold'
                            : 'text-[rgba(25,53,62,0.6)]'
                        }`}
                      >
                        One-Time Service
                      </span>
                      <span
                        className={`text-[0.62rem] font-normal ${
                          accessType === 'one_time'
                            ? 'text-[rgba(255,255,255,0.5)]'
                            : 'text-[rgba(25,53,62,0.35)]'
                        }`}
                      >
                        Single course or session
                      </span>
                    </button>
                  </div>
                </div>

                {accessType === 'subscription' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 rounded-[0_2px_2px_0] border-l-[3px] border-mentoria-gold bg-[rgba(247,188,21,0.08)] px-3.5 py-2.5 font-sans text-[0.76rem] font-normal leading-normal text-[rgba(25,53,62,0.65)]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        width={16}
                        height={16}
                        fill="none"
                        className="mt-0.5 shrink-0 text-mentoria-gold"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M10 2L12.5 7.5L18 8L14 12L15.5 18L10 15L4.5 18L6 12L2 8L7.5 7.5Z" />
                      </svg>
                      <span>
                        <strong className="font-bold text-mentoria-teal">Unlock full platform access</strong> — premium
                        membership, cancel anytime.
                      </span>
                    </div>
                    <div>
                      <span className={labelClass()}>Membership Plan</span>
                      <button
                        type="button"
                        onClick={() => setPlanModalOpen(true)}
                        className="flex w-full items-center justify-between rounded-[2px] border-[1.5px] border-[rgba(25,53,62,0.15)] bg-white px-4 py-3 text-left font-sans text-[0.75rem] font-bold uppercase tracking-[0.1em] text-mentoria-teal transition-colors hover:border-mentoria-gold hover:bg-[rgba(247,188,21,0.06)]"
                      >
                        <span>
                          Selected:{' '}
                          <span className="text-mentoria-gold-dark">{selectedPlanLabel}</span>
                        </span>
                        <svg
                          viewBox="0 0 16 16"
                          width={14}
                          height={14}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          className="shrink-0 text-mentoria-teal"
                          aria-hidden
                        >
                          <path d="M3 6L8 11L13 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {accessType === 'one_time' && (
                  <div className="flex flex-col gap-1.5">
                    {ONE_TIME_PRODUCTS.map((p) => (
                      <div key={p.key}>
                        <input
                          type="radio"
                          name="one_time_product"
                          id={`svc-${p.key}`}
                          className="sr-only"
                          checked={oneTimeKey === p.key}
                          onChange={() => setOneTimeKey(p.key)}
                        />
                        <label
                          htmlFor={`svc-${p.key}`}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-[2px] border-[1.5px] px-3.5 py-3 transition-colors ${
                            oneTimeKey === p.key
                              ? 'border-mentoria-gold bg-[rgba(247,188,21,0.07)]'
                              : 'border-[rgba(25,53,62,0.1)] bg-white hover:border-[rgba(25,53,62,0.25)]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-sans text-[0.75rem] font-bold uppercase tracking-[0.04em] ${
                                oneTimeKey === p.key ? 'text-mentoria-gold-dark' : 'text-mentoria-teal'
                              }`}
                            >
                              {p.title}
                            </div>
                            <div className="mt-0.5 font-sans text-[0.7rem] font-light leading-snug text-[rgba(25,53,62,0.5)]">
                              {p.description}
                            </div>
                          </div>
                          <div
                            className={`shrink-0 font-condensed text-[1.1rem] font-black whitespace-nowrap ${
                              oneTimeKey === p.key ? 'text-mentoria-gold-dark' : 'text-mentoria-teal'
                            }`}
                          >
                            {p.price}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!forgotMode && (
              <div>
                <label htmlFor="password" className={labelClass()}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className={fieldClass()}
                  placeholder={isRegister ? 'Create a password' : '••••••••'}
                />
              </div>
            )}

            {isRegister && (
              <div>
                <label htmlFor="password_confirm" className={labelClass()}>
                  Confirm Password
                </label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={fieldClass()}
                  placeholder="Repeat password"
                />
              </div>
            )}

            {!isRegister && !forgotMode && (
              <div className="mb-1 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 font-sans text-[0.74rem] font-medium text-[rgba(25,53,62,0.5)]">
                  <input type="checkbox" name="remember" className="h-3.5 w-3.5 accent-mentoria-teal" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="border-none bg-transparent font-sans text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mentoria-gold transition-colors hover:text-[#19353E]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || redirectingToPayment}
              className="mt-1 w-full rounded-md border-none bg-mentoria-gold py-[13px] font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em] text-[#19353E] shadow-[0_2px_12px_rgba(247,188,21,0.25)] transition-all duration-300 ease-out hover:scale-[1.05] hover:brightness-[1.06] hover:shadow-[0_6px_28px_rgba(247,188,21,0.5)] active:scale-[0.98] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:shadow-none disabled:active:scale-100"
            >
              {redirectingToPayment && isRegister
                ? 'Redirecting to secure payment…'
                : loading
                  ? 'Please wait…'
                  : forgotMode
                    ? 'Send reset link'
                    : isRegister
                      ? accessType === 'one_time'
                        ? 'Purchase Service'
                        : 'Join Mentoria'
                      : 'Sign In'}
            </button>

            {!isRegister && !forgotMode && (
              <>
                <div className="relative my-4 flex items-center gap-2.5">
                  <span className="h-px flex-1 bg-[rgba(25,53,62,0.09)]" />
                  <span className="whitespace-nowrap font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[rgba(25,53,62,0.28)]">
                    or continue with
                  </span>
                  <span className="h-px flex-1 bg-[rgba(25,53,62,0.09)]" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Google', 'Apple', 'LinkedIn'] as const).map((name) => (
                    <button
                      key={name}
                      type="button"
                      disabled
                      title="Coming soon"
                      className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-[2px] border-[1.5px] border-[rgba(25,53,62,0.1)] bg-mentoria-light py-2 font-sans text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[rgba(25,53,62,0.35)]"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </form>

          {error && (
            <div className="mt-5 rounded-[2px] border border-[rgba(229,62,62,0.25)] bg-[rgba(229,62,62,0.08)] px-3.5 py-2.5 font-sans text-[0.82rem] text-[#e53e3e]">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-5 rounded-[2px] border border-[rgba(56,161,105,0.25)] bg-[rgba(56,161,105,0.08)] px-3.5 py-2.5 font-sans text-[0.82rem] text-[#276749]">
              {message}
            </div>
          )}

          <div className="mt-4 text-center font-sans text-[0.72rem] font-normal leading-relaxed text-[rgba(25,53,62,0.38)]">
            {!isRegister && !forgotMode && (
              <>
                Not a member?{' '}
                <Link
                  href="/register"
                  className="font-bold text-mentoria-gold underline-offset-2 transition-colors hover:text-[#19353E] hover:underline"
                >
                  Join Mentoria →
                </Link>
              </>
            )}
            {isRegister && (
              <>
                Already a member?{' '}
                <Link
                  href="/login"
                  className="font-bold text-mentoria-gold underline-offset-2 transition-colors hover:text-[#19353E] hover:underline"
                >
                  Sign in →
                </Link>
                <span className="mt-4 block text-[0.65rem]">
                  By joining you agree to our Terms &amp; Privacy Policy.
                </span>
              </>
            )}
            {!isRegister && forgotMode && (
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError(null);
                  setMessage(null);
                }}
                className="border-none bg-transparent font-sans text-[0.72rem] font-bold text-mentoria-gold hover:text-[#19353E] hover:underline"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <PlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        selected={modalPlan}
        onSelect={setModalPlan}
        onConfirm={() => {
          setSubscriptionInterval(modalPlan);
          setPlanModalOpen(false);
        }}
      />
    </div>
  );
}
