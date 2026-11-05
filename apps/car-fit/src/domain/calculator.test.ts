import { describe, it, expect } from 'vitest';
import {
  calculate,
  DEFAULT,
  affordability,
  demandScore,
  scenarioSchema,
} from './calculator';
describe('car calculator', () => {
  it('matches zero-interest PRD example', () => {
    const r = calculate({
      ...DEFAULT,
      price: '100000',
      down: '40000',
      fees: '5000',
      months: '60',
      apr: '0',
      distance: '0',
      parking: '800',
      insurance: '0',
      maintenance: '0',
      other: '0',
    });
    expect(r.monthly).toBe(100000);
    expect(r.upfront).toBe(4500000);
    expect(r.operating).toBe(80000);
    expect(r.totalInterest).toBe(0);
    expect(r.principalPaid).toBe(6000000);
  });
  it('full cash has no interest or required loan parameters', () => {
    const v = { ...DEFAULT, down: DEFAULT.price, months: '', apr: '' };
    expect(scenarioSchema.safeParse(v).success).toBe(true);
    expect(calculate(v)).toMatchObject({ monthly: 0, interest: 0, balance: 0 });
  });
  it('early sale includes held interest only and exposes remaining balance', () => {
    const short = calculate({ ...DEFAULT, years: '1', months: '84' }),
      long = calculate({ ...DEFAULT, years: '10', months: '84' });
    expect(short.interest).toBeLessThan(short.totalInterest);
    expect(short.balance).toBeGreaterThan(0);
    expect(long.balance).toBeCloseTo(0, 5);
    expect(long.principalPaid).toBeCloseTo(6000000, 5);
    expect(short.balance + short.principalPaid).toBeCloseTo(6000000, 5);
  });
  it('does not double count principal in ownership', () => {
    const v = {
      ...DEFAULT,
      price: '100000',
      down: '40000',
      apr: '0',
      years: '1',
      fees: '0',
      resale: '50000',
      distance: '0',
      parking: '0',
      insurance: '0',
      maintenance: '0',
      other: '0',
    };
    expect(calculate(v).ownership).toBe(5000000);
  });
  it('bounds scores and caps cash deficits', () => {
    expect(demandScore([3, 3, 3, 3, 3, 3])).toBe(100);
    expect(demandScore([0, 0, 0, 0, 0, 0])).toBe(0);
    expect(affordability(100, 30, 100, 100)).toBe(100);
    expect(affordability(100, -1, 100, 100)).toBeLessThanOrEqual(39);
    expect(affordability(100, 50, -1, 100)).toBe(39);
  });
  it('validates ranges and cross-field errors', () => {
    for (const patch of [
      { income: '' },
      { down: '99999999' },
      { resale: '99999999' },
      { months: '0' },
      { apr: '31' },
      { price: '-1' },
    ]) {
      expect(scenarioSchema.safeParse({ ...DEFAULT, ...patch }).success).toBe(
        false,
      );
    }
  });
});
