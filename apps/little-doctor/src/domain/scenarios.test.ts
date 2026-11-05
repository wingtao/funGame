import { describe, it, expect } from 'vitest';
import {
  selectedScene,
  defaultScene,
  sceneConfigSchema,
  habitScenes,
} from './scenarios';
import { storeSchema, emptyStore, recordAward, partIds } from './game';
describe('parent habit scenarios', () => {
  it('loads old v1 records without losing stickers', () => {
    const old = {
      schemaVersion: 1,
      sound: false,
      records: [{ date: '2026-11-05', part: 'teeth' }],
    };
    const parsed = storeSchema.parse(old);
    expect(parsed.scenarios).toEqual({});
    expect(parsed.records).toEqual(old.records);
  });
  it('resolves a parent-selected scene independently for each part', () => {
    const config = { ...defaultScene, scene: 'sweets', snack: '棒棒糖' };
    expect(selectedScene('teeth', config)?.buddy).toBe('甜甜糖虫');
    expect(selectedScene('eyes', config)).toBeUndefined();
    expect(
      storeSchema.safeParse({ ...emptyStore, scenarios: { eyes: config } })
        .success,
    ).toBe(false);
  });
  it('persists custom plans through awarding and validates limits', () => {
    const plan = {
      scene: 'custom',
      snack: '薯片',
      note: '先吃正餐，再按约定吃零食。',
    };
    const store = storeSchema.parse({
      ...emptyStore,
      scenarios: { belly: plan },
    });
    expect(recordAward(store, 'belly', '2026-11-05').scenarios.belly).toEqual(
      plan,
    );
    expect(
      sceneConfigSchema.safeParse({ ...plan, snack: '长'.repeat(41) }).success,
    ).toBe(false);
    expect(
      sceneConfigSchema.safeParse({ ...plan, note: '长'.repeat(81) }).success,
    ).toBe(false);
  });
  it('keeps exactly three tasks for every scenario and a default for every part', () => {
    for (const id of partIds) {
      expect(
        storeSchema.safeParse({
          ...emptyStore,
          scenarios: { [id]: defaultScene },
        }).success,
      ).toBe(true);
      for (const scene of habitScenes[id] ?? []) {
        expect(scene.steps).toHaveLength(3);
        expect(selectedScene(id, { ...defaultScene, scene: scene.id })).toEqual(
          scene,
        );
      }
    }
  });
});
