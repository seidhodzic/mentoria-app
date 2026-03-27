import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand">Mentoria</Link>
          <nav>
            <Link href="/login">Member Login</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </nav>
        </div>
      </header>
      <main style={{minHeight:'100vh',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:24,textAlign:'center',padding:'0 20px'}}>
        <div style={{color:'var(--gold)',fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase'}}>Members Platform</div>
        <h1 style={{color:'#fff',fontSize:'clamp(2.5rem,6vw,5rem)',lineHeight:0.95}}>Mentoria</h1>
        <p style={{color:'rgba(255,255,255,0.55)',maxWidth:480,fontWeight:300,fontSize:'1rem'}}>
          A premium advisory platform for sports, investment and education professionals.
        </p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          <Link href="/login" className="btn btn-primary">Sign In</Link>
          <Link href="/register" className="btn btn-outline" style={{color:'#fff',borderColor:'rgba(255,255,255,0.3)'}}>Create Account</Link>
        </div>
      </main>
    </>
  );
}
