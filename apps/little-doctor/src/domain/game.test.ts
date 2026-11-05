import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialGame,
  emptyStore,
  recordAward,
  todayParts,
  storeSchema,
  partIds,
} from './game';
describe('story scanner', () => {
  it('completes scan, mission and review without a medical score', () => {
    let s = reducer(initialGame, { type: 'start' });
    s = reducer(s, { type: 'tick', progress: 1 });
    expect(s.phase).toBe('mission');
    s = reducer(s, { type: 'practice' });
    for (const star of [0, 1, 2]) {
      s = reducer(s, { type: 'pick', star });
    }
    expect(reducer(s, { type: 'review' }).phase).toBe('practice');
    s = reducer(s, { type: 'confirm', value: true });
    s = reducer(s, { type: 'review' });
    expect(s.phase).toBe('reviewing');
    expect(reducer(s, { type: 'tick', progress: 1 }).phase).toBe('award');
  });
  it('guards transitions and duplicate stars', () => {
    expect(reducer(initialGame, { type: 'review' })).toEqual(initialGame);
    let s = reducer(initialGame, { type: 'start' });
    expect(reducer(s, { type: 'select', part: 'teeth' }).part).toBe('belly');
    s = reducer(s, { type: 'tick', progress: 0.5 });
    expect(reducer(s, { type: 'tick', progress: 0.2 }).progress).toBe(0.5);
    expect(reducer(s, { type: 'reset' }).phase).toBe('ready');
    s = { ...initialGame, phase: 'practice' };
    s = reducer(s, { type: 'pick', star: 0 });
    expect(reducer(s, { type: 'pick', star: 0 }).picked).toEqual([0]);
    expect(reducer(s, { type: 'pick', star: 7 }).picked).toEqual([0]);
  });
  it('deduplicates daily awards and isolates dates', () => {
    let s = recordAward(emptyStore, 'teeth', '2026-11-05');
    s = recordAward(s, 'teeth', '2026-11-05');
    expect(s.records).toHaveLength(1);
    s = recordAward(s, 'teeth', '2026-11-06');
    expect(s.records).toHaveLength(2);
    expect(todayParts(s, '2026-11-05')).toEqual(['teeth']);
  });
  it('validates records and covers all eight parts', () => {
    expect(
      storeSchema.safeParse({
        ...emptyStore,
        records: [{ date: 'bad', part: 'unknown' }],
      }).success,
    ).toBe(false);
    expect(partIds).toHaveLength(8);
  });
});
