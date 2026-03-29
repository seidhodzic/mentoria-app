'use client';

import { useEffect } from 'react';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: 'var(--teal)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 440,
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '40px 36px',
          border: '1px solid rgba(247, 188, 21, 0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            fontFamily: "'Saira', sans-serif",
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#F7BC15',
            marginBottom: 12,
          }}
        >
          Mentoria
        </div>
        <h1
          style={{
            fontFamily: "'Saira Condensed', sans-serif",
            fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
            fontWeight: 900,
            letterSpacing: '0.02em',
            lineHeight: 1,
            color: 'var(--teal)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          Something went wrong
        </h1>
        <p style={{ fontFamily: "'Saira', sans-serif", color: 'rgba(25,53,62,0.65)', fontSize: '1rem', fontWeight: 300, marginBottom: 28, lineHeight: 1.75 }}>
          We couldn&apos;t complete this request. You can try again — if the problem continues, contact support.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
