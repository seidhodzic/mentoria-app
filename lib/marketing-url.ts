/** Base URL for the static marketing site (GitHub Pages or custom domain). */
export function getMarketingBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ??
    'https://seidhodzic.github.io/mentoria-website'
  );
}

/** e.g. `index.html`, `index.html#services` */
export function marketingHref(path: string): string {
  const base = getMarketingBaseUrl();
  if (path.startsWith('#')) return `${base}/index.html${path}`;
  if (path.startsWith('index.html')) return `${base}/${path}`;
  return `${base}/${path}`;
}
