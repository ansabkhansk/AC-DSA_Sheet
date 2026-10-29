import { describe, expect, it } from 'vitest';
import { computeStreak, resolveTimezone, shiftDateKey, toDateKey } from '../src/utils/timezone.js';

describe('timezone helpers (C7)', () => {
  it('falls back to Asia/Kolkata for missing or invalid zones', () => {
    expect(resolveTimezone(undefined)).toBe('Asia/Kolkata');
    expect(resolveTimezone('Not/AZone')).toBe('Asia/Kolkata');
    expect(resolveTimezone('America/New_York')).toBe('America/New_York');
  });

  it('formats calendar days in the requested zone', () => {
    // 2026-10-29 22:30 UTC is already 2026-10-30 in Asia/Kolkata (UTC+5:30).
    const instant = new Date('2026-10-29T22:30:00.000Z');
    expect(toDateKey(instant, 'UTC')).toBe('2026-10-29');
    expect(toDateKey(instant, 'Asia/Kolkata')).toBe('2026-10-30');
  });

  it('computes streaks ending today or yesterday', () => {
    const today = toDateKey(new Date('2026-10-30T12:00:00.000Z'), 'UTC');
    const yesterday = shiftDateKey(today, -1);
    const twoDaysAgo = shiftDateKey(today, -2);

    expect(
      computeStreak([today, yesterday, twoDaysAgo], 'UTC', new Date('2026-10-30T12:00:00.000Z')),
    ).toBe(3);
    expect(
      computeStreak([yesterday, twoDaysAgo], 'UTC', new Date('2026-10-30T12:00:00.000Z')),
    ).toBe(2);
    expect(computeStreak([twoDaysAgo], 'UTC', new Date('2026-10-30T12:00:00.000Z'))).toBe(0);
  });
});
