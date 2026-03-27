'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import type { UserRole } from '@/lib/types';

type Mode = 'login' | 'register' | 'forgot';

export default function AuthForm({ mode: initialMode }: { mode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '').trim();
    try {
      const supabase = createClient();

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage('Password reset email sent. Check your inbox.');
        return;
      }

      if (mode === 'register') {
        const fullName = String(fd.get('full_name') || '').trim();
        const profile_type = String(fd.get('profile_type') || '');
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName, role: 'user' },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email, full_name: fullName,
            role: 'user', status: 'active',
            updated_at: new Date().toISOString(),
          });
          fetch('/api/notify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, fullName, role: 'user', profile_type }),
          }).catch(() => {});
        }
        setMessage('Registration successful! Check your email to confirm your account.');
        return;
      }

      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

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
      router.push(getDashboardPath(role) as any);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-bar" />
      <div className="auth-card-body">
        {mode === 'login' && (
          <><div className="label" style={{ marginBottom: 12 }}>Member Access</div>
          <h1>Sign In</h1>
          <p className="auth-sub">Access your Mentoria dashboard</p></>
        )}
        {mode === 'register' && (
          <><div className="label" style={{ marginBottom: 12 }}>New Membership</div>
          <h1>Join Mentoria</h1>
          <p className="auth-sub">Create your members account</p></>
        )}
        {mode === 'forgot' && (
          <><div className="label" style={{ marginBottom: 12 }}>Password Reset</div>
          <h1>Reset Password</h1>
          <p className="auth-sub">We'll send a reset link to your email</p></>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" name="full_name" placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label htmlFor="profile_type">I am a...</label>
                <select id="profile_type" name="profile_type">
                  <option value="">Select your profile</option>
                  <option value="player">Football Player / Athlete</option>
                  <option value="club">Football Club / Organisation</option>
                  <option value="investor">Investor / Private Equity</option>
                  <option value="agent">Licensed Football Agent</option>
                  <option value="executive">Sports Executive / Director</option>
                  <option value="lawyer">Sports Lawyer / Legal Professional</option>
                  <option value="coach">Coach / Technical Staff</option>
                  <option value="student">Student / Aspiring Professional</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="name@example.com" required autoComplete="email" />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                placeholder={mode === 'register' ? 'Create a password (min 8 chars)' : '••••••••'}
                minLength={8} required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-actions">
              <span style={{ fontSize: '0.74rem', color: 'rgba(25,53,62,0.5)' }}>
                <input type="checkbox" name="remember" style={{ width: 'auto', marginRight: 6 }} />
                Remember me
              </span>
              <button type="button"
                onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-dark)', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Join Mentoria' : 'Send Reset Link'}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <div className="auth-footer">
          {mode === 'login' && <>Not a member? <Link href="/register">Join Mentoria →</Link></>}
          {mode === 'register' && <>Already a member? <Link href="/login">Sign in →</Link></>}
          {mode === 'forgot' && (
            <button type="button"
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-dark)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit' }}>
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
