'use client';

import { SUBSCRIPTION_PLANS } from '@/lib/auth/register-options';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  selected: 'monthly' | 'annual';
  onSelect: (plan: 'monthly' | 'annual') => void;
  onConfirm: () => void;
};

export default function PlanModal({ open, onClose, selected, onSelect, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(13,34,41,0.7)] p-5 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-[3px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
        <div className="h-[3px] bg-gradient-to-r from-gold via-gold-dark to-transparent" />
        <div className="px-7 pb-6 pt-7">
          <h2 id="plan-modal-title" className="font-condensed text-[clamp(1.4rem,2.5vw,2rem)] font-black uppercase tracking-[0.02em] leading-none text-teal">
            Choose Your Plan
          </h2>
          <p className="mb-5 mt-1.5 font-sans text-[0.88rem] font-light leading-[1.8] text-[rgba(25,53,62,0.5)]">
            Premium membership with full access. Cancel anytime — no long-term commitment. Exclusive VIP offers may be
            applied at checkout when you have a code.
          </p>

          <button
            type="button"
            onClick={() => onSelect('monthly')}
            className={`mb-2.5 w-full border-[1.5px] p-4 text-left transition-colors ${
              selected === 'monthly'
                ? 'border-gold bg-[rgba(247,188,21,0.05)]'
                : 'border-[rgba(25,53,62,0.1)] hover:border-teal'
            } rounded-[2px]`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-sans text-[0.85rem] font-bold uppercase tracking-[0.14em] text-teal">
                Monthly Plan
              </span>
            </div>
            <div className="font-condensed text-[1.6rem] font-black leading-none text-teal">
              €49 <sub className="align-middle font-sans text-[0.65rem] font-normal text-[rgba(25,53,62,0.4)]">/ month</sub>
            </div>
            <p className="mb-2 mt-2 font-sans text-[0.88rem] font-light leading-[1.8] text-[rgba(25,53,62,0.55)]">
              {SUBSCRIPTION_PLANS.monthly.blurb}
            </p>
            <ul className="mt-2.5 flex list-none flex-col gap-1.5">
              {[
                'Full knowledge database access',
                'All quizzes and learning materials',
                'Subscriber-only insights & content',
                'Cancel or pause anytime',
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 font-sans text-[0.72rem] text-[rgba(25,53,62,0.55)]"
                >
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 bg-[length:14px_14px] bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Ccircle cx='8' cy='8' r='7' stroke='%23F7BC15' stroke-width='1.4'/%3E%3Cpath d='M5 8L7 10L11 6' stroke='%23F7BC15' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    }}
                  />
                  {t}
                </li>
              ))}
            </ul>
          </button>

          <button
            type="button"
            onClick={() => onSelect('annual')}
            className={`mb-0 w-full border-[1.5px] p-4 text-left transition-colors ${
              selected === 'annual'
                ? 'border-gold bg-[rgba(247,188,21,0.05)]'
                : 'border-[rgba(25,53,62,0.1)] hover:border-teal'
            } rounded-[2px]`}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-sans text-[0.85rem] font-bold uppercase tracking-[0.14em] text-teal">
                Annual Plan
              </span>
              <span className="rounded-[2px] bg-gold px-1.5 py-0.5 font-sans text-[0.64rem] font-bold uppercase tracking-[0.1em] text-teal">
                Best Value — Save 20%
              </span>
            </div>
            <div className="font-condensed text-[1.6rem] font-black leading-none text-teal">
              €39{' '}
              <sub className="align-middle font-sans text-[0.65rem] font-normal text-[rgba(25,53,62,0.4)]">
                / month · billed annually
              </sub>
            </div>
            <p className="mb-2 mt-2 font-sans text-[0.88rem] font-light leading-[1.8] text-[rgba(25,53,62,0.55)]">
              {SUBSCRIPTION_PLANS.annual.blurb}
            </p>
            <ul className="mt-2.5 flex list-none flex-col gap-1.5">
              {[
                'Full knowledge database access',
                'All quizzes and learning materials',
                'Subscriber-only insights & content',
                'Priority advisory content updates',
                '20% saving vs monthly plan',
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 font-sans text-[0.72rem] text-[rgba(25,53,62,0.55)]"
                >
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 bg-[length:14px_14px] bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Ccircle cx='8' cy='8' r='7' stroke='%23F7BC15' stroke-width='1.4'/%3E%3Cpath d='M5 8L7 10L11 6' stroke='%23F7BC15' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    }}
                  />
                  {t}
                </li>
              ))}
            </ul>
          </button>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[2px] border-[1.5px] border-[rgba(25,53,62,0.12)] bg-light px-4 py-3 font-sans text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[rgba(25,53,62,0.5)] transition-colors hover:border-teal hover:text-teal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-md border-none bg-gold py-3 font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em] text-teal transition-all duration-300 hover:scale-[1.01] hover:brightness-105"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
