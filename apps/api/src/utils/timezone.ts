import { DEFAULT_TIMEZONE } from '@dsa/shared';

export function resolveTimezone(headerValue: unknown): string {
  if (typeof headerValue !== 'string' || headerValue.trim().length === 0) {
    return DEFAULT_TIMEZONE;
  }

  const candidate = headerValue.trim();

  try {
    // Throws RangeError for unknown IANA zones.
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Calendar day key `YYYY-MM-DD` in the given IANA timezone (C7). */
export function toDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  return utc.toISOString().slice(0, 10);
}

/**
 * Streak of consecutive local calendar days with activity, ending on today
 * or yesterday (if today has none yet).
 */
export function computeStreak(
  dateKeys: Iterable<string>,
  timeZone: string,
  now = new Date(),
): number {
  const unique = new Set(dateKeys);
  if (unique.size === 0) {
    return 0;
  }

  const today = toDateKey(now, timeZone);
  const yesterday = shiftDateKey(today, -1);

  let cursor = unique.has(today) ? today : unique.has(yesterday) ? yesterday : null;
  if (!cursor) {
    return 0;
  }

  let streak = 0;
  while (unique.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}
