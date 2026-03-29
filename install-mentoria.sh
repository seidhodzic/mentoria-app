#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Writing Mentoria Phase 1 files..."

# ── middleware.ts ──
cat > "$BASE/middleware.ts" << 'EOF'
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'user';
  const status = profile?.status ?? 'active';

  if (status === 'suspended') {
    return NextResponse.redirect(new URL('/login?error=suspended', request.url));
  }
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/mentor') && role !== 'mentor' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/mentor/:path*', '/user/:path*'],
};
EOF

# ── lib/supabase-server.ts ──
cat > "$BASE/lib/supabase-server.ts" << 'EOF'
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch {} },
      },
    }
  );
}
EOF

# ── lib/supabase-browser.ts ──
cat > "$BASE/lib/supabase-browser.ts" << 'EOF'
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
EOF

# ── lib/types.ts ──
cat > "$BASE/lib/types.ts" << 'EOF'
export type UserRole   = 'user' | 'mentor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  title: string;
  description: string | null;
  visibility: 'all' | 'mentors' | 'users' | 'admins';
  owner_id: string | null;
  created_at: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'inactive';
  current_period_end: string | null;
  created_at: string;
};
EOF

# ── lib/role.ts ──
cat > "$BASE/lib/role.ts" << 'EOF'
import type { UserRole } from './types';

export function normalizeRole(value: string | null | undefined): UserRole {
  if (value === 'admin' || value === 'mentor') return value;
  return 'user';
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':  return '/admin';
    case 'mentor': return '/mentor';
    default:       return '/user';
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':  return 'Administrator';
    case 'mentor': return 'Mentor';
    default:       return 'Member';
  }
}
EOF

# ── lib/env.ts ──
cat > "$BASE/lib/env.ts" << 'EOF'
export const env = {
  supabaseUrl:            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl:                process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  serviceRoleKey:         process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};
EOF

echo "✓ lib/ files written"

# ── app/globals.css ──
cat > "$BASE/app/globals.css" << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&family=Saira+Condensed:wght@400;600;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#F7BC15;--gold-dark:#d9a410;--gold-pale:rgba(247,188,21,0.08);--gold-border:rgba(247,188,21,0.2);
  --teal:#19353E;--teal-mid:#1e4552;--teal-light:#2a5c6e;--teal-faint:rgba(25,53,62,0.06);
  --light:#EFEFEF;--white:#ffffff;--text-muted:#7a9aa5;--footer-bg:#0d2229;
  --danger:#e53e3e;--success:#38a169;--radius:3px;
  --shadow-sm:0 2px 8px rgba(25,53,62,0.08);--shadow-md:0 8px 32px rgba(25,53,62,0.12);
  --transition:all 0.2s ease;
}
html{scroll-behavior:smooth}
body{font-family:'Saira',sans-serif;background:var(--light);color:var(--teal);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:'Saira Condensed',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:0.02em;line-height:1;color:var(--teal)}
h1{font-size:clamp(1.8rem,3vw,2.8rem)}h2{font-size:clamp(1.4rem,2.5vw,2rem)}h3{font-size:1.1rem}
p{color:rgba(25,53,62,0.7);font-weight:300;line-height:1.75}
.label{font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:8px}
.label::before{content:'';display:block;width:24px;height:2px;background:var(--gold);flex-shrink:0}
.site-header{position:fixed;top:0;left:0;right:0;z-index:100;height:72px;background:rgba(25,53,62,0.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(247,188,21,0.15);display:flex;align-items:center;padding:0 5%}
.site-header .nav{display:flex;align-items:center;justify-content:space-between;width:100%}
.brand{font-family:'Saira Condensed',sans-serif;font-size:1.55rem;font-weight:700;letter-spacing:0.12em;color:var(--white);text-transform:uppercase;text-decoration:none}
.site-header nav{display:flex;align-items:center;gap:24px}
.site-header nav a{font-size:0.78rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);text-decoration:none;transition:var(--transition)}
.site-header nav a:hover{color:var(--gold)}
.dash-header{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;background:var(--teal);border-bottom:1px solid rgba(247,188,21,0.15);display:flex;align-items:center;padding:0 24px;gap:24px}
.dash-header .dash-brand{font-family:'Saira Condensed',sans-serif;font-size:1.3rem;font-weight:700;letter-spacing:0.12em;color:var(--white);text-transform:uppercase;text-decoration:none;flex-shrink:0}
.dash-header .dash-brand span{color:var(--gold)}
.dash-nav{display:flex;align-items:center;gap:4px;flex:1;overflow-x:auto}
.dash-nav a{font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.55);text-decoration:none;padding:6px 12px;border-radius:var(--radius);transition:var(--transition);white-space:nowrap}
.dash-nav a:hover{color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.06)}
.dash-nav a.active{color:var(--gold);background:rgba(247,188,21,0.1)}
.dash-header-right{display:flex;align-items:center;gap:12px;margin-left:auto;flex-shrink:0}
.dash-user-pill{display:flex;align-items:center;gap:8px;padding:5px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:100px}
.dash-user-pill .role-badge{font-size:0.55rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;background:var(--gold);color:var(--teal);padding:2px 6px;border-radius:2px}
.dash-user-pill .name{font-size:0.72rem;font-weight:600;color:rgba(255,255,255,0.8);letter-spacing:0.04em}
.container{max-width:1280px;margin:0 auto;padding:0 5%}
main{padding-top:72px}
.dash-layout{display:flex;min-height:100vh;padding-top:64px}
.dash-content{flex:1;padding:36px 32px;max-width:1280px;margin:0 auto;width:100%}
.page-header{margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(25,53,62,0.08)}
.page-header .eyebrow{font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.page-header .eyebrow::before{content:'';width:20px;height:2px;background:var(--gold)}
.page-header p{font-size:0.88rem;margin-top:6px;max-width:520px}
.card{background:var(--white);border-radius:var(--radius);border:1px solid rgba(25,53,62,0.07);padding:24px;transition:var(--transition)}
.card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px}
.stat-card{background:var(--white);border-radius:var(--radius);border:1px solid rgba(25,53,62,0.07);padding:20px 24px;position:relative;overflow:hidden}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,var(--gold),var(--gold-dark))}
.stat-card .stat-label{font-size:0.62rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(25,53,62,0.45);margin-bottom:8px}
.stat-card .stat-value{font-family:'Saira Condensed',sans-serif;font-size:2rem;font-weight:900;color:var(--teal);line-height:1}
.stat-card .stat-sub{font-size:0.72rem;color:rgba(25,53,62,0.4);margin-top:4px;font-weight:400}
.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.action-card{background:var(--white);border-radius:var(--radius);border:1px solid rgba(25,53,62,0.07);padding:24px;cursor:pointer;transition:var(--transition);text-decoration:none;display:block}
.action-card:hover{border-color:var(--gold);box-shadow:0 8px 32px rgba(247,188,21,0.1);transform:translateY(-2px)}
.action-card .icon-wrap{width:40px;height:40px;background:var(--teal);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.action-card h3{margin-bottom:6px;color:var(--teal)}
.action-card p{font-size:0.82rem}
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:16px}
.section-header h2{font-size:1.1rem}
.table-wrap{background:var(--white);border-radius:var(--radius);border:1px solid rgba(25,53,62,0.07);overflow:hidden}
table{width:100%;border-collapse:collapse}
thead{background:rgba(25,53,62,0.03)}
th{font-size:0.62rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(25,53,62,0.45);padding:12px 16px;text-align:left;border-bottom:1px solid rgba(25,53,62,0.07)}
td{padding:12px 16px;font-size:0.85rem;border-bottom:1px solid rgba(25,53,62,0.05);color:var(--teal)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(25,53,62,0.02)}
.badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:2px;font-size:0.58rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase}
.badge-admin{background:var(--teal);color:var(--white)}
.badge-mentor{background:var(--gold);color:var(--teal)}
.badge-user{background:rgba(25,53,62,0.1);color:var(--teal)}
.badge-active{background:rgba(56,161,105,0.12);color:#276749}
.badge-pending{background:rgba(247,188,21,0.15);color:#92600a}
.badge-suspended{background:rgba(229,62,62,0.12);color:#c53030}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border:none;border-radius:var(--radius);font-family:'Saira',sans-serif;font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:var(--transition);white-space:nowrap}
.btn-primary{background:var(--gold);color:var(--teal)}
.btn-primary:hover{background:var(--gold-dark);transform:translateY(-1px)}
.btn-teal{background:var(--teal);color:var(--white)}
.btn-teal:hover{background:var(--teal-mid);transform:translateY(-1px)}
.btn-outline{background:transparent;color:var(--teal);border:1.5px solid rgba(25,53,62,0.2)}
.btn-outline:hover{border-color:var(--teal)}
.btn-danger{background:var(--danger);color:var(--white)}
.btn-sm{padding:6px 14px;font-size:0.68rem}
.btn:disabled{opacity:0.5;cursor:not-allowed;transform:none!important}
.form-group{margin-bottom:16px}
label{display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(25,53,62,0.6);margin-bottom:6px}
input,select,textarea{width:100%;background:var(--light);border:1.5px solid transparent;border-radius:var(--radius);padding:11px 14px;font-family:'Saira',sans-serif;font-size:0.9rem;color:var(--teal);outline:none;transition:var(--transition);-webkit-appearance:none;appearance:none}
input::placeholder,textarea::placeholder{color:rgba(25,53,62,0.3)}
input:focus,select:focus,textarea:focus{border-color:var(--gold);background:var(--white);box-shadow:0 0 0 3px rgba(247,188,21,0.1)}
.auth-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;background:var(--teal);position:relative;overflow:hidden}
.auth-shell::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 30% 50%,rgba(247,188,21,0.07) 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 80% 20%,rgba(42,92,110,0.5) 0%,transparent 60%);pointer-events:none}
.auth-card{width:100%;max-width:420px;background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.35);position:relative;z-index:1;animation:authIn 0.5s cubic-bezier(0.4,0,0.2,1) both}
@keyframes authIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.auth-card-bar{height:3px;background:linear-gradient(to right,var(--gold),var(--gold-dark),transparent)}
.auth-card-body{padding:36px 36px 32px}
.auth-card h1{font-size:1.6rem;margin-bottom:4px;text-transform:uppercase}
.auth-card .auth-sub{font-size:0.8rem;color:rgba(25,53,62,0.45);font-weight:300;margin-bottom:28px}
.auth-card .form-group{margin-bottom:14px}
.auth-actions{display:flex;align-items:center;justify-content:space-between;margin:4px 0 18px;font-size:0.72rem}
.auth-actions a{color:var(--gold-dark);font-weight:600;text-decoration:none}
.auth-card .btn{width:100%;justify-content:center;padding:13px;margin-top:4px}
.auth-error{background:rgba(229,62,62,0.08);border:1px solid rgba(229,62,62,0.2);border-radius:var(--radius);padding:10px 14px;font-size:0.78rem;color:var(--danger);margin-top:12px}
.auth-success{background:rgba(56,161,105,0.08);border:1px solid rgba(56,161,105,0.2);border-radius:var(--radius);padding:10px 14px;font-size:0.78rem;color:var(--success);margin-top:12px}
.auth-footer{text-align:center;font-size:0.72rem;color:rgba(25,53,62,0.4);margin-top:20px}
.auth-footer a{color:var(--gold-dark);font-weight:700;text-decoration:none}
.sign-out-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:var(--radius);font-family:'Saira',sans-serif;font-size:0.68rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);cursor:pointer;transition:var(--transition)}
.sign-out-btn:hover{border-color:rgba(229,62,62,0.5);color:#fc8181}
.empty-state{text-align:center;padding:60px 24px;color:rgba(25,53,62,0.35)}
.alert{padding:12px 16px;border-radius:var(--radius);font-size:0.82rem;margin-bottom:20px;display:flex;align-items:flex-start;gap:10px}
.alert-warning{background:rgba(247,188,21,0.1);border-left:3px solid var(--gold);color:rgba(25,53,62,0.8)}
.alert-info{background:rgba(25,53,62,0.06);border-left:3px solid var(--teal);color:var(--teal)}
@media(max-width:768px){.dash-content{padding:24px 16px}.stats-grid{grid-template-columns:1fr 1fr}.cards-grid{grid-template-columns:1fr}.dash-nav{display:none}.auth-card-body{padding:28px 24px 24px}}
@media(max-width:480px){.stats-grid{grid-template-columns:1fr}}
CSSEOF

echo "✓ globals.css written"

# ── app/layout.tsx ──
cat > "$BASE/app/layout.tsx" << 'EOF'
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentoria — Members Platform',
  description: 'Mentoria advisory platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# ── app/page.tsx ──
cat > "$BASE/app/page.tsx" << 'EOF'
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
EOF

echo "✓ app/ root files written"

# ── app/login/page.tsx ──
cat > "$BASE/app/login/page.tsx" << 'EOF'
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
export default function LoginPage() {
  return <div className="auth-shell"><Suspense><AuthForm mode="login" /></Suspense></div>;
}
EOF

# ── app/register/page.tsx ──
cat > "$BASE/app/register/page.tsx" << 'EOF'
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
export default function RegisterPage() {
  return <div className="auth-shell"><Suspense><AuthForm mode="register" /></Suspense></div>;
}
EOF

# ── app/dashboard/page.tsx ──
cat > "$BASE/app/dashboard/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';

export default async function DashboardRouterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = normalizeRole(profile?.role ?? user.user_metadata?.role);
  redirect(getDashboardPath(role));
}
EOF

echo "✓ auth + dashboard pages written"

# ── components/SignOutButton.tsx ──
cat > "$BASE/components/SignOutButton.tsx" << 'EOF'
'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }
  return (
    <button onClick={handleSignOut} className="sign-out-btn">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 15l5-5-5-5M18 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
      </svg>
      Sign Out
    </button>
  );
}
EOF

# ── components/DashboardShell.tsx ──
cat > "$BASE/components/DashboardShell.tsx" << 'EOF'
import Link from 'next/link';
import SignOutButton from './SignOutButton';
type NavItem = { label: string; href: string };
type Stat = { label: string; value: string; sub?: string };
interface Props {
  title: string; eyebrow: string; subtitle?: string;
  userName?: string; userRole?: string;
  navItems: NavItem[]; stats?: Stat[];
  children: React.ReactNode; activeNav?: string;
}
export default function DashboardShell({ title, eyebrow, subtitle, userName, userRole, navItems, stats, children, activeNav }: Props) {
  return (
    <div className="dash-layout">
      <header className="dash-header">
        <Link href="/dashboard" className="dash-brand">Mentor<span>ia</span></Link>
        <nav className="dash-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={activeNav === item.href ? 'active' : ''}>{item.label}</Link>
          ))}
        </nav>
        <div className="dash-header-right">
          {userName && (
            <div className="dash-user-pill">
              {userRole && (
                <span className="role-badge" style={{
                  background: userRole==='admin'?'var(--teal)':userRole==='mentor'?'var(--gold)':'rgba(25,53,62,0.15)',
                  color: userRole==='mentor'?'var(--teal)':'var(--white)',
                }}>
                  {userRole}
                </span>
              )}
              <span className="name">{userName}</span>
            </div>
          )}
          <SignOutButton />
        </div>
      </header>
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {stats && stats.length > 0 && (
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
EOF

echo "✓ components/ written"

# ── components/AuthForm.tsx ──
cat > "$BASE/components/AuthForm.tsx" << 'EOF'
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import type { UserRole } from '@/lib/types';
type Mode = 'login' | 'register' | 'forgot';
export default function AuthForm({ mode: initialMode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')||'').trim();
    const password = String(fd.get('password')||'').trim();
    try {
      const supabase = createClient();
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage('Password reset email sent. Check your inbox.'); return;
      }
      if (mode === 'register') {
        const fullName = String(fd.get('full_name')||'').trim();
        const profile_type = String(fd.get('profile_type')||'');
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role: 'user' }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email, full_name: fullName, role: 'user', status: 'active', updated_at: new Date().toISOString(),
          });
          fetch('/api/notify-admin', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, fullName, role:'user', profile_type }) }).catch(()=>{});
        }
        setMessage('Registration successful! Check your email to confirm your account.'); return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', data.user.id).single();
      if (profile?.status === 'suspended') { await supabase.auth.signOut(); throw new Error('Your account has been suspended. Contact support.'); }
      const role = normalizeRole(profile?.role ?? data.user.user_metadata?.role);
      router.push(getDashboardPath(role)); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-bar" />
      <div className="auth-card-body">
        {mode==='login' && <><div className="label" style={{marginBottom:12}}>Member Access</div><h1>Sign In</h1><p className="auth-sub">Access your Mentoria dashboard</p></>}
        {mode==='register' && <><div className="label" style={{marginBottom:12}}>New Membership</div><h1>Join Mentoria</h1><p className="auth-sub">Create your members account</p></>}
        {mode==='forgot' && <><div className="label" style={{marginBottom:12}}>Password Reset</div><h1>Reset Password</h1><p className="auth-sub">We'll send a reset link to your email</p></>}
        <form onSubmit={handleSubmit}>
          {mode==='register' && (
            <>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" name="full_name" placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label htmlFor="profile_type">I am a...</label>
                <select id="profile_type" name="profile_type">
                  <option value="">Select your profile</option>
                  <option value="player">Football Player / Athlete</option>
                  <option value="club">Football Club / Organisation</option>
                  <option value="investor">Investor / Private Equity</option>
                  <option value="agent">Licensed Football Agent</option>
                  <option value="executive">Sports Executive / Director</option>
                  <option value="lawyer">Sports Lawyer / Legal Professional</option>
                  <option value="coach">Coach / Technical Staff</option>
                  <option value="student">Student / Aspiring Professional</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="name@example.com" required autoComplete="email" />
          </div>
          {mode!=='forgot' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder={mode==='register'?'Create a password (min 8 chars)':'••••••••'} minLength={8} required autoComplete={mode==='login'?'current-password':'new-password'} />
            </div>
          )}
          {mode==='login' && (
            <div className="auth-actions">
              <span style={{fontSize:'0.74rem',color:'rgba(25,53,62,0.5)'}}>
                <input type="checkbox" name="remember" style={{width:'auto',marginRight:6}} />Remember me
              </span>
              <button type="button" onClick={()=>{setMode('forgot');setError(null);setMessage(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gold-dark)',fontSize:'0.72rem',fontWeight:600,fontFamily:'inherit'}}>
                Forgot password?
              </button>
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading?'Please wait...':mode==='login'?'Sign In':mode==='register'?'Join Mentoria':'Send Reset Link'}
          </button>
        </form>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        <div className="auth-footer">
          {mode==='login' && <>Not a member? <Link href="/register">Join Mentoria →</Link></>}
          {mode==='register' && <>Already a member? <Link href="/login">Sign in →</Link></>}
          {mode==='forgot' && <button type="button" onClick={()=>{setMode('login');setError(null);setMessage(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gold-dark)',fontSize:'0.72rem',fontWeight:700,fontFamily:'inherit'}}>← Back to Sign In</button>}
        </div>
      </div>
    </div>
  );
}
EOF

echo "✓ AuthForm written"

# ── app/admin/page.tsx ──
cat > "$BASE/app/admin/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import DashboardShell from '@/components/DashboardShell';
const ADMIN_NAV = [
  { label:'Overview', href:'/admin' },
  { label:'Users', href:'/admin/users' },
  { label:'Materials', href:'/admin/materials' },
  { label:'Quizzes', href:'/admin/quizzes' },
  { label:'Subscriptions', href:'/admin/subscriptions' },
];
export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role,full_name,status').eq('id',user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const [
    { count: totalUsers },
    { count: pendingUsers },
    { count: totalMaterials },
    { count: totalQuizzes },
  ] = await Promise.all([
    supabase.from('profiles').select('*',{count:'exact',head:true}),
    supabase.from('profiles').select('*',{count:'exact',head:true}).eq('status','pending'),
    supabase.from('materials').select('*',{count:'exact',head:true}),
    supabase.from('quizzes').select('*',{count:'exact',head:true}),
  ]);
  const { data: recentUsers } = await supabase.from('profiles').select('id,email,full_name,role,status,created_at').order('created_at',{ascending:false}).limit(5);
  return (
    <DashboardShell title="Admin Dashboard" eyebrow="Platform Management"
      subtitle="Manage users, content, subscriptions and platform operations."
      userName={profile?.full_name??user.email??''} userRole="admin"
      navItems={ADMIN_NAV} activeNav="/admin"
      stats={[
        {label:'Total Members',value:String(totalUsers??0),sub:'registered accounts'},
        {label:'Pending Approval',value:String(pendingUsers??0),sub:'awaiting activation'},
        {label:'Materials',value:String(totalMaterials??0),sub:'uploaded resources'},
        {label:'Quizzes',value:String(totalQuizzes??0),sub:'active quizzes'},
      ]}>
      <div className="section-header" style={{marginBottom:16}}><h2>Quick Actions</h2></div>
      <div className="cards-grid" style={{marginBottom:36}}>
        <Link href="/admin/users" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
          <h3>User Management</h3><p>Approve registrations, assign roles, manage account status.</p>
        </Link>
        <Link href="/admin/materials" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg></div>
          <h3>Content Control</h3><p>Upload learning materials, modules and resources.</p>
        </Link>
        <Link href="/admin/quizzes" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 3-2.5 4"/><circle cx="12" cy="17" r=".5" fill="#F7BC15"/></svg></div>
          <h3>Quiz Builder</h3><p>Create and manage quizzes assigned to courses.</p>
        </Link>
        <Link href="/admin/subscriptions" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
          <h3>Billing Monitor</h3><p>Track subscriptions, payments and plan changes.</p>
        </Link>
      </div>
      <div className="section-header"><h2>Recent Registrations</h2><Link href="/admin/users" className="btn btn-outline btn-sm">View All</Link></div>
      <div className="table-wrap">
        {recentUsers && recentUsers.length > 0 ? (
          <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>{recentUsers.map((u)=>(
            <tr key={u.id}>
              <td>{u.full_name??'—'}</td><td>{u.email}</td>
              <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
              <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
              <td style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody></table>
        ) : (
          <div className="empty-state"><h3>No users yet</h3><p>New registrations will appear here.</p></div>
        )}
      </div>
    </DashboardShell>
  );
}
EOF

# ── app/mentor/page.tsx ──
cat > "$BASE/app/mentor/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import DashboardShell from '@/components/DashboardShell';
const MENTOR_NAV = [
  {label:'Overview',href:'/mentor'},
  {label:'Members',href:'/mentor/members'},
  {label:'Sessions',href:'/mentor/sessions'},
  {label:'Materials',href:'/mentor/materials'},
];
export default async function MentorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role,full_name,status').eq('id',user.id).single();
  if (normalizeRole(profile?.role) !== 'mentor' && normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  const { count: totalMaterials } = await supabase.from('materials').select('*',{count:'exact',head:true});
  return (
    <DashboardShell title="Mentor Dashboard" eyebrow="Mentor Portal"
      subtitle="Manage your mentees, sessions and learning materials."
      userName={profile?.full_name??user.email??''} userRole="mentor"
      navItems={MENTOR_NAV} activeNav="/mentor"
      stats={[
        {label:'Assigned Members',value:'—',sub:'coming in Phase 2'},
        {label:'Upcoming Sessions',value:'—',sub:'coming in Phase 2'},
        {label:'Published Materials',value:String(totalMaterials??0),sub:'available resources'},
      ]}>
      <div className="alert alert-info" style={{marginBottom:28}}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{flexShrink:0,marginTop:2}}><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 13v.5"/></svg>
        Member assignment and session booking will be available in the next phase.
      </div>
      <div className="cards-grid">
        <Link href="/mentor/members" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M2 20c0-3.3 3.1-6 7-6"/><circle cx="17" cy="14" r="3"/><path d="M14 20c0-1.7 1.3-3 3-3s3 1.3 3 3"/></svg></div>
          <h3>Mentee Overview</h3><p>Review member progress, notes and next actions.</p>
        </Link>
        <Link href="/mentor/sessions" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <h3>Sessions</h3><p>Schedule and manage mentoring sessions with Google Meet.</p>
        </Link>
        <Link href="/mentor/materials" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <h3>Materials</h3><p>Upload and manage learning resources for your members.</p>
        </Link>
      </div>
    </DashboardShell>
  );
}
EOF

# ── app/user/page.tsx ──
cat > "$BASE/app/user/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
import DashboardShell from '@/components/DashboardShell';
const USER_NAV = [
  {label:'Overview',href:'/user'},
  {label:'Courses',href:'/user/courses'},
  {label:'Quizzes',href:'/user/quizzes'},
  {label:'Materials',href:'/user/materials'},
  {label:'Sessions',href:'/user/sessions'},
];
export default async function UserPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role,full_name,status,email').eq('id',user.id).single();
  if (!profile) redirect('/login');
  if (normalizeRole(profile.role)==='admin') redirect('/admin');
  if (normalizeRole(profile.role)==='mentor') redirect('/mentor');
  const { data: materials } = await supabase.from('materials').select('id,title,description').limit(4);
  return (
    <DashboardShell title={`Welcome, ${profile.full_name?.split(' ')[0]??'Member'}`} eyebrow="Members Dashboard"
      subtitle="Access your courses, quizzes, materials and mentor sessions."
      userName={profile.full_name??profile.email??''} userRole="user"
      navItems={USER_NAV} activeNav="/user"
      stats={[
        {label:'Courses',value:'—',sub:'coming in Phase 3'},
        {label:'Quizzes Completed',value:'—',sub:'coming in Phase 4'},
        {label:'Materials',value:String(materials?.length??0),sub:'available to download'},
        {label:'Sessions Booked',value:'—',sub:'coming in Phase 6'},
      ]}>
      {profile.status==='pending' && (
        <div className="alert alert-warning" style={{marginBottom:28}}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{flexShrink:0,marginTop:2}}><circle cx="10" cy="10" r="7"/><path d="M10 7v3M10 13v.5"/></svg>
          Your account is pending activation. You'll get full access once confirmed.
        </div>
      )}
      <div className="section-header" style={{marginBottom:16}}><h2>Platform Features</h2></div>
      <div className="cards-grid" style={{marginBottom:36}}>
        <Link href="/user/courses" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M22 10H2M22 10V20a2 2 0 01-2 2H4a2 2 0 01-2-2V10M22 10L12 3 2 10"/></svg></div>
          <h3>Courses</h3><p>Access premium learning courses and track your progress.</p>
        </Link>
        <Link href="/user/quizzes" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 3-2.5 4"/><circle cx="12" cy="17" r=".5" fill="#F7BC15"/></svg></div>
          <h3>Quizzes</h3><p>Test your knowledge with expert-designed quizzes.</p>
        </Link>
        <Link href="/user/materials" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
          <h3>Materials</h3><p>Download premium templates, guides and resources.</p>
        </Link>
        <Link href="/user/sessions" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
          <h3>Mentor Sessions</h3><p>Book 1-on-1 sessions with your assigned mentor.</p>
        </Link>
      </div>
      {materials && materials.length > 0 && (
        <>
          <div className="section-header"><h2>Available Materials</h2><Link href="/user/materials" className="btn btn-outline btn-sm">View All</Link></div>
          <div className="table-wrap">
            <table><thead><tr><th>Title</th><th>Description</th><th></th></tr></thead>
            <tbody>{materials.map((m)=>(
              <tr key={m.id}>
                <td style={{fontWeight:600}}>{m.title}</td>
                <td style={{color:'var(--text-muted)',fontSize:'0.82rem'}}>{m.description??'—'}</td>
                <td><Link href="/user/materials" className="btn btn-outline btn-sm">View</Link></td>
              </tr>
            ))}</tbody></table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
EOF

# ── app/api/notify-admin/route.ts ──
cat > "$BASE/app/api/notify-admin/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { email, fullName, role, profile_type } = await req.json();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) { console.warn('ADMIN_NOTIFICATION_EMAIL not set'); return NextResponse.json({ ok:true, skipped:true }); }
    console.log(`New registration: ${fullName} (${email}) — ${role} / ${profile_type}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notify-admin error:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
EOF

echo "✓ All dashboard pages and API written"
echo ""
echo "================================================"
echo "  ✅ Mentoria Phase 1 — all files installed!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Open: http://localhost:3000/login"
echo "  3. Sign in with seid.hodzic@gmail.com"
echo "  4. You should land on the Admin Dashboard"
echo ""
