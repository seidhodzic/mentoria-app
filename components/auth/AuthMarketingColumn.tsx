function IconBook() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={20}
      height={20}
      fill="none"
      className="text-gold"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 8C18 6 8 6 6 8L6 34C8 32 18 32 22 34C26 32 36 32 38 34L38 8C36 6 26 6 22 8Z" />
      <line x1="22" y1="8" x2="22" y2="34" />
      <line x1="10" y1="15" x2="20" y2="15" />
      <line x1="10" y1="21" x2="20" y2="21" />
      <line x1="10" y1="27" x2="20" y2="27" />
      <line x1="24" y1="15" x2="34" y2="15" />
      <line x1="24" y1="21" x2="34" y2="21" />
      <line x1="24" y1="27" x2="34" y2="27" />
    </svg>
  );
}

function IconQuiz() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={20}
      height={20}
      fill="none"
      className="text-gold"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="22" cy="22" r="14" />
      <path d="M16 22L20 26L28 18" />
    </svg>
  );
}

function IconMaterials() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={20}
      height={20}
      fill="none"
      className="text-gold"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="8" y="8" width="28" height="28" rx="2" />
      <line x1="8" y1="18" x2="36" y2="18" />
      <line x1="22" y1="8" x2="22" y2="36" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 44"
      width={20}
      height={20}
      fill="none"
      className="text-gold"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 6L26 16L38 16L28 24L32 34L22 28L12 34L16 24L6 16L18 16Z" />
    </svg>
  );
}

const FEATURES = [
  {
    title: 'Exclusive Knowledge Database',
    body: 'Curated research, analysis and premium editorial content',
    Icon: IconBook,
  },
  {
    title: 'Expert-Designed Quizzes',
    body: 'Track progress through structured professional learning paths',
    Icon: IconQuiz,
  },
  {
    title: 'Premium Learning Materials',
    body: 'Downloadable guides, frameworks and subscriber resources',
    Icon: IconMaterials,
  },
  {
    title: 'Subscriber-Only Insights',
    body: "Unlock guidance from Mentoria's advisory network",
    Icon: IconStar,
  },
] as const;

function TrustLock() {
  return (
    <svg viewBox="0 0 20 20" width={13} height={13} fill="none" className="shrink-0 text-[#EFEFEF]" aria-hidden>
      <rect x="3" y="9" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6C6.5 4.34 7.84 3 9.5 3H10.5C12.16 3 13.5 4.34 13.5 6V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrustShield() {
  return (
    <svg viewBox="0 0 20 20" width={13} height={13} fill="none" className="shrink-0 text-[#EFEFEF]" aria-hidden>
      <path d="M10 2L17 5L17 10C17 14 13.5 17 10 18C6.5 17 3 14 3 10L3 5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrustInfo() {
  return (
    <svg viewBox="0 0 20 20" width={13} height={13} fill="none" className="shrink-0 text-[#EFEFEF]" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 7V11M10 13V13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const TRUST = [
  { label: 'Secure Login', Icon: TrustLock },
  { label: 'Protected Access', Icon: TrustShield },
  { label: 'Cancel Anytime', Icon: TrustInfo },
] as const;

/** Left column — copy & SVGs from marketing `login.html` `.brand-panel`. */
export default function AuthMarketingColumn() {
  return (
    <div className="relative z-[1] flex flex-col justify-center px-[6%] py-12 pb-20 pt-12 lg:min-h-[calc(100vh-72px)] lg:py-20">
      <div>
        <p className="mb-5 flex items-center gap-2.5 font-sans text-[0.72rem] font-bold uppercase tracking-[0.22em] text-gold">
          <span className="h-0.5 w-8 bg-gold" aria-hidden />
          Members Portal
        </p>
        <h1 className="font-condensed text-[clamp(2.6rem,4vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-white">
          Access the
          <br />
          <span className="text-gold">Mentoria</span>
          <br />
          Members
          <br />
          Portal
        </h1>
        <p className="mb-11 mt-5 max-w-[400px] font-sans text-[0.9rem] font-light leading-[1.75] text-light">
          Unlock exclusive knowledge, premium materials, expert-designed quizzes, and curated subscriber-only insights
          through your Mentoria membership.
        </p>

        <ul className="list-none">
          {FEATURES.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="group flex items-start gap-4 border-b border-[rgba(255,255,255,0.06)] py-4 transition-[padding] first:pt-0 last:border-b-0 hover:pl-1"
            >
              <div className="flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[3px] border border-[rgba(247,188,21,0.2)] bg-[rgba(247,188,21,0.08)]">
                <Icon />
              </div>
              <div className="min-w-0">
                <strong className="mb-0.5 block font-sans text-[0.8rem] font-bold uppercase tracking-[0.05em] text-white">
                  {title}
                </strong>
                <span className="font-sans text-[0.78rem] font-light leading-normal text-light">
                  {body}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[rgba(255,255,255,0.08)] pt-7">
        {TRUST.map(({ label, Icon }, idx) => (
          <div key={label} className="flex items-center gap-4">
            {idx > 0 ? <span className="h-3 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" aria-hidden /> : null}
            <div className="flex items-center gap-1.5 font-sans text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-light/70">
              <Icon />
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
