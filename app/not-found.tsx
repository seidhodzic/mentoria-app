import Link from 'next/link';

export default function NotFound() {
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
            color: 'var(--teal)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontFamily: "'Saira', sans-serif",
            color: 'rgba(25,53,62,0.65)',
            fontSize: '1rem',
            fontWeight: 300,
            marginBottom: 28,
            lineHeight: 1.75,
          }}
        >
          That URL doesn&apos;t exist or was moved.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
