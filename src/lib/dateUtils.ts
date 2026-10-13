/**
 * Patient Zero Date Formatting & Calculation Utilities
 * Enforces standardized 'dd-mm-yyyy' formatting across all UI surfaces
 * while maintaining ISO 'yyyy-mm-dd' internally for monotonic key ordering.
 */

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

let activeTimeZone = DEFAULT_TIMEZONE;

export function setActiveTimeZone(tz: string): void {
  if (tz) activeTimeZone = tz;
}

export function getUserTimeZone(): string {
  return activeTimeZone || DEFAULT_TIMEZONE;
}

/**
 * Formats any input (ISO string, Date object, or epoch number) to 'dd-mm-yyyy'.
 * Examples:
 *   "2026-10-09" -> "09-10-2026"
 *   "2026-10-09T07:30:00Z" -> "09-10-2026"
 *   Date(2026, 9, 9) -> "09-10-2026"
 */
export function formatDateDMY(input?: string | number | Date | null, tz?: string): string {
  if (!input) {
    return formatDateDMY(getTodayISO(tz));
  }

  // If already in dd-mm-yyyy format
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Match yyyy-mm-dd pattern
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d}-${m}-${y}`;
    }
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) {
    // Fallback if parsing failed
    return String(input);
  }

  const targetTz = tz || getUserTimeZone();
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: targetTz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value || padZero(d.getDate());
    const month = parts.find(p => p.type === 'month')?.value || padZero(d.getMonth() + 1);
    const year = parts.find(p => p.type === 'year')?.value || d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    const day = padZero(d.getDate());
    const month = padZero(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

/**
 * Formats date and time to 'dd-mm-yyyy, hh:mm AM/PM' in the active timezone
 */
export function formatDateTimeDMY(input?: string | number | Date | null, tz?: string): string {
  if (!input) return formatDateTimeDMY(new Date(), tz);

  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  if (!d || isNaN(d.getTime())) {
    if (typeof input === 'string') return formatDateDMY(input, tz);
    return String(input);
  }

  const targetTz = tz || getUserTimeZone();
  try {
    const datePart = formatDateDMY(d, targetTz);
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
    return `${datePart}, ${timeStr}`;
  } catch {
    const datePart = formatDateDMY(d, targetTz);
    let hours = d.getHours();
    const minutes = padZero(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursFormatted = padZero(hours);
    return `${datePart}, ${hoursFormatted}:${minutes} ${ampm}`;
  }
}

/**
 * Returns today's date formatted as ISO 'yyyy-mm-dd' in the active timezone (Asia/Kolkata).
 * In India, this accurately reflects 11/10/2026 ('2026-10-11').
 */
export function getTodayISO(tz?: string): string {
  const targetTz = tz || getUserTimeZone();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: targetTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
  }
}

/**
 * Returns today's date formatted as 'dd-mm-yyyy'
 */
export function getTodayDMY(tz?: string): string {
  return formatDateDMY(getTodayISO(tz), tz);
}

/**
 * Computes calendar days difference between two ISO dates (date2 - date1)
 */
export function getDaysDiff(isoDate1: string, isoDate2: string): number {
  const [y1, m1, d1] = isoDate1.split("-").map(Number);
  const [y2, m2, d2] = isoDate2.split("-").map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  const diffTime = dt2.getTime() - dt1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns Monday of the current week formatted as ISO 'yyyy-mm-dd' in the active timezone
 */
export function getCurrentMondayISO(tz?: string): string {
  const today = getTodayISO(tz);
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const diff = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
  dt.setDate(dt.getDate() - diff);
  return `${dt.getFullYear()}-${padZero(dt.getMonth() + 1)}-${padZero(dt.getDate())}`;
}

/**
 * Returns the ISO 'yyyy-mm-dd' date for N days ago in the active timezone
 */
export function getDaysAgoISO(days: number, tz?: string): string {
  const today = getTodayISO(tz);
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - days);
  return `${dt.getFullYear()}-${padZero(dt.getMonth() + 1)}-${padZero(dt.getDate())}`;
}

/**
 * Generates an array of intermediate ISO dates between start (exclusive) and end (exclusive)
 * e.g. start: "2026-10-08", end: "2026-10-10" -> ["2026-10-09"]
 */
export function getIntermediateISODates(startIso: string, endIso: string): string[] {
  const result: string[] = [];
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  current.setDate(current.getDate() + 1);

  while (current.getTime() < end.getTime()) {
    result.push(`${current.getFullYear()}-${padZero(current.getMonth() + 1)}-${padZero(current.getDate())}`);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

