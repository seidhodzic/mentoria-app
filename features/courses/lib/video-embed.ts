/**
 * Normalizes common YouTube URLs to `https://www.youtube.com/embed/VIDEO_ID` for iframes.
 * Other URLs are returned unchanged (e.g. Vimeo, or direct embed links).
 */
export function toYouTubeEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const u = new URL(withProtocol);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (id) return appendStart(`https://www.youtube.com/embed/${id}`, u);
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${u.pathname}${u.search}`;
      }

      const v = u.searchParams.get('v');
      if (v) {
        return appendStart(`https://www.youtube.com/embed/${v}`, u);
      }

      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`;
      }

      const live = u.pathname.match(/^\/live\/([^/?]+)/);
      if (live?.[1]) {
        return `https://www.youtube.com/embed/${live[1]}`;
      }
    }
  } catch {
    // legacy heuristics below
  }

  const vMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (/youtube\.com\/watch/i.test(trimmed) && vMatch?.[1]) {
    return `https://www.youtube.com/embed/${vMatch[1]}`;
  }

  const shortMatch = trimmed.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return trimmed;
}

function appendStart(embedBase: string, original: URL): string {
  const t = original.searchParams.get('t') ?? original.searchParams.get('start');
  if (!t) return embedBase;
  const sec = /^\d+$/.test(t) ? parseInt(t, 10) : null;
  if (sec == null || Number.isNaN(sec)) return embedBase;
  return `${embedBase}?start=${sec}`;
}
