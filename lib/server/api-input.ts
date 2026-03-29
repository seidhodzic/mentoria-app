/** Strip control characters and cap length — safe to embed in prompts / emails. */
export function sanitizeText(input: string, maxLen: number): string {
  const trimmed = input.trim().slice(0, maxLen);
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export const LIMITS = {
  message: 500,
  topic: 100,
  shortLabel: 100,
} as const;
