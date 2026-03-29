'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-teal px-5 text-center">
      <p className="font-saira text-xs font-bold uppercase tracking-widest text-gold">Something went wrong</p>
      <h1 className="font-saira-condensed text-5xl font-black uppercase tracking-wide text-white">Error</h1>
      <p className="max-w-sm font-saira text-sm leading-relaxed text-white/50">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-gold px-7 py-3 font-saira text-xs font-bold uppercase tracking-widest text-teal transition-all hover:bg-gold-dark"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="rounded-sm border border-white/20 px-7 py-3 font-saira text-xs font-bold uppercase tracking-widest text-white/60 transition-all hover:border-gold hover:text-gold"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
