/** Values stored in `profiles.profile_type` and auth metadata. */
export const PROFILE_TYPES = [
  {
    value: 'player',
    label: 'Football Player / Athlete',
    helper:
      "You'll get access to career advisory content, contract guidance, dual-career resources, and athlete transition planning materials.",
  },
  {
    value: 'club',
    label: 'Football Club / Organisation',
    helper:
      'Your portal will feature club management frameworks, governance tools, TMS guides, and Balkans market intelligence for clubs.',
  },
  {
    value: 'investor',
    label: 'Investor / Private Equity',
    helper:
      "You'll access investment advisory content, Balkans deal intelligence, club valuation frameworks, and buy-side resources.",
  },
  {
    value: 'agent',
    label: 'Licensed Football Agent',
    helper:
      'Your dashboard will prioritise FIFA Agent exam prep, TMS tutorials, regulatory updates, and transfer market insights.',
  },
  {
    value: 'executive',
    label: 'Sports Executive / Director',
    helper:
      "You'll unlock executive education content, leadership frameworks, governance guides, and strategic advisory resources.",
  },
  {
    value: 'lawyer',
    label: 'Sports Lawyer / Legal Professional',
    helper:
      'Access legal advisory content, CAS and FIFA dispute case studies, regulatory analysis, and contract frameworks.',
  },
  {
    value: 'coach',
    label: 'Coach / Technical Staff',
    helper:
      'Your portal will include technical and management content, career transition resources, and professional development materials.',
  },
  {
    value: 'student',
    label: 'Student / Aspiring Professional',
    helper:
      "You'll access foundational learning materials, exam prep courses, and career-entry resources for sports professionals.",
  },
  {
    value: 'other',
    label: 'Other',
    helper:
      "You'll get full access to the Mentoria knowledge base. You can personalise your dashboard after registration.",
  },
] as const;

export type ProfileTypeValue = (typeof PROFILE_TYPES)[number]['value'];

/** Stored in `materials.target_audience` — who may access a premium row (when `is_premium`). */
export const MATERIAL_TARGET_AUDIENCES = [
  { value: 'all' as const, label: 'All subscription types' },
  ...PROFILE_TYPES.map((p) => ({ value: p.value, label: p.label })),
] as const;

export function getProfileHelper(value: string): string {
  const row = PROFILE_TYPES.find((p) => p.value === value);
  return row?.helper ?? '';
}

export type SignupAccessType = 'subscription' | 'one_time';

/** Stored in `profiles.signup_plan_key` */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    key: 'subscription_monthly',
    label: 'Monthly Plan',
    priceLine: '€49 / month',
    blurb: 'Full access to the Mentoria members portal. Billed monthly — maximum flexibility.',
  },
  annual: {
    key: 'subscription_annual',
    label: 'Annual Plan',
    badge: 'Best Value — Save 20%',
    priceLine: '€39 / month · billed annually',
    blurb:
      'Everything in Monthly, billed as €468/year. Save €120 compared to monthly billing.',
  },
} as const;

export const ONE_TIME_PRODUCTS = [
  {
    key: 'onetime_fifa_agent_exam',
    title: 'FIFA Agent Exam Prep',
    description: 'Full prep course: regulations, FFMS, TMS & mock exams',
    price: '€199',
  },
  {
    key: 'onetime_club_investment',
    title: 'Club Investment Masterclass',
    description: 'Buy-side due diligence & Balkans market entry framework',
    price: '€249',
  },
  {
    key: 'onetime_contract_law',
    title: 'Contract Law Fundamentals',
    description: 'Player contracts, image rights & regulatory compliance',
    price: '€149',
  },
  {
    key: 'onetime_athlete_transition',
    title: 'Athlete Career Transition',
    description: 'Post-sport planning, branding & executive readiness',
    price: '€179',
  },
  {
    key: 'onetime_advisory_session',
    title: '1-on-1 Advisory Session',
    description: '60-minute expert consultation — any topic, any vertical',
    price: '€299',
  },
] as const;

export function resolveSignupPlanKey(
  access: SignupAccessType,
  subscriptionInterval: 'monthly' | 'annual',
  oneTimeKey: string | null
): string {
  if (access === 'subscription') {
    return subscriptionInterval === 'annual'
      ? SUBSCRIPTION_PLANS.annual.key
      : SUBSCRIPTION_PLANS.monthly.key;
  }
  return oneTimeKey ?? 'onetime_unknown';
}
