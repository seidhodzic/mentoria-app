import AuthSiteHeader from '@/components/auth/AuthSiteHeader';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * Deep navy (#19353E) portal frame: radial gold glows, gold triangle accent, fixed nav offset.
 */
export default function AuthPortalShell({ children }: Props) {
  return (
    <div className="relative min-h-screen bg-[#19353E]">
      <AuthSiteHeader />
      <div className="pointer-events-none absolute inset-0 top-[72px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 70% at 70% 50%, rgba(247,188,21,0.08) 0%, transparent 70%),
              radial-gradient(ellipse 40% 60% at 10% 80%, rgba(247,188,21,0.05) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 z-0 h-[160px] w-[320px] bg-mentoria-gold opacity-95 max-lg:h-[100px] max-lg:w-[200px]"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
        />
      </div>
      <div className="relative z-[1] grid min-h-screen grid-cols-1 pt-[72px] lg:min-h-screen lg:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
