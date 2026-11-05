import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  calculateDay,
  configSchema,
  defaultConfig,
  monthWorkdays,
} from './earnings';
const config = {
  ...defaultConfig(),
  timeZone: 'Asia/Shanghai',
  denominators: { '2026-11': 20 },
};
const at = (t: string) =>
  Temporal.ZonedDateTime.from(`2026-11-05T${t}[Asia/Shanghai]`)
    .epochMilliseconds;
describe('income intervals', () => {
  it('matches examples across unpaid lunch', () => {
    for (const [t, monthly, hourly] of [
      ['12:00', 18750, 15000],
      ['13:00', 18750, 15000],
      ['18:00', 50000, 40000],
    ] as const) {
      const a = calculateDay(config, at(t)),
        b = calculateDay({ ...config, mode: 'hourly' }, at(t));
      expect(a.ok && a.income).toBe(monthly);
      expect(b.ok && b.income).toBe(hourly);
    }
  });
  it('handles paid lunch, boundaries and rest', () => {
    expect(calculateDay(config, at('08:00'))).toMatchObject({
      income: 0,
      state: 'before',
    });
    expect(
      calculateDay({ ...config, paidLunch: true }, at('12:30')),
    ).toMatchObject({ state: 'lunch-paid' });
    expect(
      calculateDay(
        { ...config, overrides: { '2026-11-05': false } },
        at('12:30'),
      ),
    ).toMatchObject({ state: 'rest' });
  });
  it('uses calendar overrides and per-month denominator', () => {
    expect(monthWorkdays(config, '2026-11')).toBe(21);
    expect(
      monthWorkdays(
        { ...config, overrides: { '2026-11-07': true } },
        '2026-11',
      ),
    ).toBe(22);
    const result = calculateDay(
      config,
      Temporal.ZonedDateTime.from('2026-12-01T18:00[Asia/Shanghai]')
        .epochMilliseconds,
    );
    expect(result.ok && result.denominator).toBe(
      monthWorkdays(config, '2026-12'),
    );
  });
  it('rejects DST gap and ambiguity', () => {
    for (const [date, start, end] of [
      ['2026-03-08', '02:30', '04:00'],
      ['2026-11-01', '01:30', '04:00'],
    ] as const) {
      const c = {
        ...config,
        timeZone: 'America/New_York',
        start,
        end,
        lunchEnabled: false,
        overrides: { [date]: true },
      };
      expect(
        calculateDay(
          c,
          Temporal.ZonedDateTime.from(`${date}T12:00[America/New_York]`)
            .epochMilliseconds,
        ).ok,
      ).toBe(false);
    }
  });
  it('does not round up milestones and handles rollback', () => {
    const c = {
      ...config,
      mode: 'hourly' as const,
      hourly: '1',
      goals: [{ id: 'a', name: 'test', amount: '1' }],
    };
    expect(calculateDay(c, at('09:59:59'))).toMatchObject({ reachedIds: [] });
    expect(calculateDay(c, at('10:00'))).toMatchObject({ reachedIds: ['a'] });
    expect(calculateDay(c, at('09:00'))).toMatchObject({ income: 0 });
  });
  it('validates impossible settings', () => {
    expect(configSchema.safeParse({ ...config, end: '08:00' }).success).toBe(
      false,
    );
    expect(
      configSchema.safeParse({
        ...config,
        lunchStart: '09:00',
        lunchEnd: '18:00',
      }).success,
    ).toBe(false);
    expect(configSchema.safeParse({ ...config, monthly: '' }).success).toBe(
      false,
    );
  });
});
