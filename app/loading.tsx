export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'var(--light)',
      }}
    >
      <div className="app-route-spinner" aria-hidden />
      <p
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--teal)',
          opacity: 0.75,
        }}
      >
        Loading
      </p>
    </div>
  );
}
