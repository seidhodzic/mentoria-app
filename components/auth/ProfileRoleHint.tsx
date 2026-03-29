import type { ProfileTypeValue } from '@/lib/auth/register-options';
import type { ReactNode } from 'react';

/** Role copy from marketing `login.html` `#hint-*` blocks (with `<strong>` emphasis). */
export default function ProfileRoleHint({ profileType }: { profileType: string }) {
  if (!profileType) return null;

  const body: Record<ProfileTypeValue, ReactNode> = {
    player: (
      <>
        You&apos;ll get access to <strong className="font-bold text-teal">career advisory content</strong>,
        contract guidance, dual-career resources, and athlete transition planning materials.
      </>
    ),
    club: (
      <>
        Your portal will feature <strong className="font-bold text-teal">club management frameworks</strong>,
        governance tools, TMS guides, and Balkans market intelligence for clubs.
      </>
    ),
    investor: (
      <>
        You&apos;ll access <strong className="font-bold text-teal">investment advisory content</strong>,
        Balkans deal intelligence, club valuation frameworks, and buy-side resources.
      </>
    ),
    agent: (
      <>
        Your dashboard will prioritise <strong className="font-bold text-teal">FIFA Agent exam prep</strong>,
        TMS tutorials, regulatory updates, and transfer market insights.
      </>
    ),
    executive: (
      <>
        You&apos;ll unlock <strong className="font-bold text-teal">executive education content</strong>,
        leadership frameworks, governance guides, and strategic advisory resources.
      </>
    ),
    lawyer: (
      <>
        Access <strong className="font-bold text-teal">legal advisory content</strong>, CAS and FIFA dispute
        case studies, regulatory analysis, and contract frameworks.
      </>
    ),
    coach: (
      <>
        Your portal will include <strong className="font-bold text-teal">technical and management content</strong>,
        career transition resources, and professional development materials.
      </>
    ),
    student: (
      <>
        You&apos;ll access <strong className="font-bold text-teal">foundational learning materials</strong>, exam
        prep courses, and career-entry resources for sports professionals.
      </>
    ),
    other: (
      <>
        You&apos;ll get <strong className="font-bold text-teal">full access</strong> to the Mentoria knowledge
        base. You can personalise your dashboard after registration.
      </>
    ),
  };

  const node = body[profileType as ProfileTypeValue];
  if (!node) return null;

  return (
    <div className="mt-2 rounded-[0_2px_2px_0] border-l-2 border-gold bg-[rgba(247,188,21,0.08)] px-3 py-2.5 font-sans text-[0.74rem] font-light leading-[1.5] text-[rgba(25,53,62,0.65)]">
      {node}
    </div>
  );
}
