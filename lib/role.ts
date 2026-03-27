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
