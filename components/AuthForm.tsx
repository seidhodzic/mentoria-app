'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import type { UserRole } from '@/lib/types';

type Mode = 'login' | 'register';

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();

      if (mode === 'register') {
        const fullName = String(formData.get('full_name') || '').trim();
        const role = normalizeRole(String(formData.get('role') || 'user')) as UserRole;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, role })
        });

        setMessage('Registration successful. Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data } = await supabase.auth.getUser();
        const role = normalizeRole((data.user?.user_metadata.role as string | undefined) ?? 'user');
        router.push(getDashboardPath(role));
        router.refresh();
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Something went wrong.';
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{mode === 'login' ? 'Member Login' : 'Create your account'}</h1>
      <p className="small">
        {mode === 'login'
          ? 'Access your Mentoria dashboard.'
          : 'Register a user, mentor, or admin seed account for the MVP.'}
      </p>
      <form onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await handleSubmit(form); }}>
        {mode === 'register' && (
          <>
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" placeholder="Seid Hodžić" required />

            <label htmlFor="role">Account type</label>
            <select id="role" name="role" defaultValue="user">
              <option value="user">User</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </>
        )}

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="name@example.com" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} required />

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      {error ? <p className="small" style={{ color: 'crimson' }}>{error}</p> : null}
      {message ? <p className="small" style={{ color: 'green' }}>{message}</p> : null}

      <p className="small">
        {mode === 'login' ? (
          <>No account yet? <Link href="/register">Create one</Link></>
        ) : (
          <>Already registered? <Link href="/login">Go to login</Link></>
        )}
      </p>
    </div>
  );
}
