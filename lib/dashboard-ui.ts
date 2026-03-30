/**
 * Shared dashboard button styles (Admin / Mentor / User).
 * `dash-primary-sleek-btn` is styled in `app/globals.css` for contrast on the dark header bar.
 */

export const DASH_PRIMARY_ACTION_CLASS =
  'inline-flex items-center justify-center gap-2 px-5 py-2 text-xs md:text-sm font-bold tracking-widest uppercase font-saira text-teal-mid border border-teal-mid/30 rounded-md hover:border-gold hover:text-gold hover:bg-gold/5 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none';

/** Use in `DashboardHeader` slot / `SignOutButton` (dark background). */
export const DASH_PRIMARY_ACTION_HEADER_CLASS = `${DASH_PRIMARY_ACTION_CLASS} dash-primary-sleek-btn`;

/** Row actions on light table backgrounds (Lessons, Publish/Unpublish, etc.). */
export const DASH_TABLE_ACTION_CLASS =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid bg-white border border-gray-200 rounded-md shadow-sm transition-all hover:border-gold hover:shadow-sm disabled:opacity-50';
