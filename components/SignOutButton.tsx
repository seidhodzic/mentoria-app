'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }
  return (
    <button onClick={handleSignOut} className="sign-out-btn">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 15l5-5-5-5M18 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
      </svg>
      Sign Out
    </button>
  );
}
