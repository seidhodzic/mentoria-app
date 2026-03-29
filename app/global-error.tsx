'use client';

/**
 * Required for App Router: catches errors in the root `app/layout.tsx`.
 * Must define its own `<html>` / `<body>` (it replaces the root layout when active).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#19353E',
          fontFamily: "'Saira', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 420 }}>
          <p style={{ color: '#F7BC15', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Mentoria
          </p>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '16px 0' }}>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            {process.env.NODE_ENV === 'development' ? error.message : 'Please try again.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#F7BC15',
              color: '#19353E',
              border: 'none',
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
