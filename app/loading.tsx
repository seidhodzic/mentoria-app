export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-light">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal/10 border-t-gold" />
      <p className="font-saira text-xs font-bold uppercase tracking-widest text-gold">Loading</p>
    </div>
  );
}
