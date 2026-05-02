// ═══════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Shared Engine Utilities
// Single source of truth for date helpers, keyword search, amount parsing.
// Import from both stages-0-to-4.ts and stages-5-to-9.ts
// ═══════════════════════════════════════════════════════════════════════════

/** Add calendar days to an ISO-date string, returns new ISO-date string. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Add calendar months to an ISO-date string. */
export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

/** Add calendar years to an ISO-date string. */
export function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

/** Days between two ISO-date strings (positive if deadline in future). */
export function daysBetween(startStr: string, endStr: string): number {
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return NaN;
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/** Convert Bangla (Bengali) digits to Latin digits. */
export function toLatinDigits(s: string): string {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  return s.replace(/[০-৯]/g, (ch) => String(bengaliDigits.indexOf(ch)));
}

/** Parse a numeric amount from string or number (supports Bengali digits and Tk notation). */
export function parseAmount(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const latin = toLatinDigits(String(val));
  const cleaned = latin.replace(/[,৳\s]/g, '').trim();
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Lower-case keyword search in a string. */
export function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Clamp win probability to safe [5, 95] range.
 * Call after each adjustment during win probability calculation.
 */
export function clampProbability(v: number): number {
  return Math.min(95, Math.max(5, v));
}
