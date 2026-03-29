import MentoriaNavLogo from '@/components/auth/MentoriaNavLogo';
import { marketingHref } from '@/lib/marketing-url';
import { Mail } from 'lucide-react';

/** Shared desktop nav buttons: Mentoria Gold (#F7BC15) + deep navy text on solid / hover. */
const navBtnBase =
  'inline-flex items-center justify-center rounded-md border-2 border-[#F7BC15] px-6 py-2.5 font-condensed text-[0.72rem] font-bold uppercase tracking-[0.14em] no-underline transition-all duration-300';

export default function AuthSiteHeader() {
  const contactHref = marketingHref('index.html#contact');
  const homeHref = marketingHref('index.html');

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] flex h-[72px] w-full items-center justify-between gap-4 border-b border-[rgba(247,188,21,0.15)] bg-[#19353E] px-[5%] backdrop-blur-[12px]">
      <div className="min-w-0 pr-2">
        <MentoriaNavLogo logoClassName="h-6 w-auto max-h-6" />
      </div>

      <nav
        className="flex shrink-0 items-center justify-end gap-2 sm:gap-3"
        aria-label="Site"
      >
        <a
          href={homeHref}
          className={`${navBtnBase} hidden bg-transparent text-[#F7BC15] hover:bg-[#F7BC15] hover:text-[#19353E] md:inline-flex`}
        >
          HOMEPAGE
        </a>
        <a
          href={contactHref}
          className={`${navBtnBase} hidden bg-[#F7BC15] text-[#19353E] hover:scale-[1.02] hover:brightness-105 md:inline-flex`}
        >
          CONTACT
        </a>
        <a
          href={contactHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#F7BC15] bg-[#F7BC15] text-[#19353E] no-underline transition-all duration-300 hover:scale-[1.02] hover:brightness-105 md:hidden"
          aria-label="Contact"
        >
          <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </a>
      </nav>
    </header>
  );
}
