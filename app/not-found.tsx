import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-teal px-5 text-center">
      <p className="font-saira text-xs font-bold uppercase tracking-widest text-gold">404</p>
      <h1 className="font-saira-condensed text-6xl font-black uppercase tracking-wide text-white">
        Page Not Found
      </h1>
      <p className="max-w-sm font-saira text-sm leading-relaxed text-white/50">
        The page you are looking for does not exist or you do not have permission to access it.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-sm bg-gold px-7 py-3 font-saira text-xs font-bold uppercase tracking-widest text-teal transition-all hover:bg-gold-dark"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
