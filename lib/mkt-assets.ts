export const MKT_ASSET_BASE = (
  process.env.NEXT_PUBLIC_MENTORIA_MARKETING_ASSET_BASE ??
  'https://seidhodzic.github.io/mentoria-website'
).replace(/\/$/, '');

export function mktAsset(relativePath: string): string {
  return `${MKT_ASSET_BASE}/${relativePath.replace(/^\//, '')}`;
}

export function mktAbsolutizeHtmlAssets(html: string): string {
  return html.replace(/src="assets\//g, `src="${MKT_ASSET_BASE}/assets/`);
}
