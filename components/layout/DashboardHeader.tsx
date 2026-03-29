'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AIAssistant from '@/components/AIAssistant';
import MentoriaLogo from '@/components/MentoriaLogo';
import SignOutButton from '@/components/SignOutButton';

export type DashNavItem = { label: string; href: string };

export default function DashboardHeader({
  navItems,
  activeNav,
  userName,
  userRole,
  children,
}: {
  navItems: DashNavItem[];
  activeNav?: string;
  userName?: string;
  userRole?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => activeNav === href || pathname === href;

  /** Never link the logo to `/dashboard` (redirect-only route); use the area “home” from primary nav. */
  const overviewHref = navItems[0]?.href ?? '/user';
  const brandHomeHref = overviewHref.startsWith('/admin')
    ? '/admin'
    : overviewHref.startsWith('/mentor')
      ? '/mentor'
      : '/user';

  const right =
    children ??
    (userName ? (
      <>
        <div className="dash-user-pill">
          {userRole && <span className="role-badge">{userRole}</span>}
          <span className="name">{userName}</span>
        </div>
        <SignOutButton />
      </>
    ) : null);

  return (
    <>
      <header className="dash-header">
        <div className="dash-header-inner">
          <Link
            href={brandHomeHref as any}
            prefetch={false}
            className="dash-brand dash-brand-logo inline-flex shrink-0 items-center no-underline"
          >
            <MentoriaLogo priority className="h-9 w-auto max-h-[40px] min-w-[120px] object-contain object-left" />
          </Link>
          <nav className="dash-nav dash-nav-desktop min-w-0" aria-label="Main">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={isActive(item.href) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="dash-header-right">
            <button
              type="button"
              className="dash-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <span className="dash-menu-btn-bar" aria-hidden />
              <span className="dash-menu-btn-bar" aria-hidden />
              <span className="dash-menu-btn-bar" aria-hidden />
            </button>
            {right}
          </div>
        </div>
      </header>

      {open && (
        <>
          <div
            className="dash-nav-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="dash-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="dash-nav-panel-header">
              <span className="dash-nav-panel-title">Menu</span>
              <button
                type="button"
                className="dash-nav-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="dash-nav-panel-links" aria-label="Mobile">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={isActive(item.href) ? 'active' : ''}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      <AIAssistant userName={userName} userRole={userRole} />
    </>
  );
}
