import { describe, expect, it } from 'vitest';
import { dateRange, localDate } from '../src/lib/analytics';
import { pageNumber } from '../src/lib/pagination';

describe('analytics filters', () => {
  it('uses the Ulaanbaatar day and a 30-day default window', () => {
    const now = new Date('2026-01-01T17:00:00Z');
    expect(localDate(now)).toBe('2026-01-02');
    expect(dateRange({}, now)).toEqual({ from: '2025-12-04', to: '2026-01-02' });
  });
  it.each([
    { from: '2026-02-30', to: '2026-03-01' },
    { from: '2026-01-02', to: '2026-01-01' },
    { from: '2025-01-01', to: '2026-01-02' },
    { from: 'invalid', to: '2026-01-02' },
  ])('rejects invalid interval %j', params => expect(() => dateRange(params)).toThrow());
  it('supports leap days and one-day ranges', () => {
    expect(dateRange({ from: '2028-02-29', to: '2028-02-29' })).toEqual({ from: '2028-02-29', to: '2028-02-29' });
  });
});

it('bounds pagination offsets and rejects ambiguous or malformed input', () => {
  for (const value of [undefined, ['2'], '0', '-1', '1.5', 'Infinity', '100001', '1e2']) expect(pageNumber(value)).toBe(1);
  expect(pageNumber('5')).toBe(5);
});
