import { z } from 'zod';
import { sceneConfigSchema, validScene } from './scenarios';
export const partIds = [
  'belly',
  'teeth',
  'hands',
  'eyes',
  'ears',
  'head',
  'feet',
  'body',
] as const;
export type PartId = (typeof partIds)[number];
export const parts: Record<
  PartId,
  {
    label: string;
    hint: string;
    buddy: string;
    task: string;
    steps: string[];
    color: string;
    position: [number, number];
  }
> = {
  belly: {
    label: '小肚子',
    hint: '吃饭与如厕',
    buddy: '慢慢团子',
    task: '照顾小肚子',
    steps: [
      '和家长一起好好吃饭。',
      '有便意时告诉大人，安心上厕所。',
      '身体不舒服时及时告诉大人。',
    ],
    color: '#f1bd79',
    position: [50, 59],
  },
  teeth: {
    label: '小牙齿',
    hint: '认真刷牙',
    buddy: '泡泡团子',
    task: '给牙齿洗个澡',
    steps: [
      '请家长准备适合你的牙刷。',
      '和家长一起认真刷牙。',
      '刷完收好牙刷，看看小笑脸。',
    ],
    color: '#b0cbdc',
    position: [50, 34],
  },
  hands: {
    label: '小手',
    hint: '洗手小能手',
    buddy: '点点团子',
    task: '给小手搓泡泡',
    steps: [
      '吃饭前，和家长一起洗手。',
      '手心、手背、指缝都照顾到。',
      '冲洗后把小手擦干。',
    ],
    color: '#e2b4c7',
    position: [22, 64],
  },
  eyes: {
    label: '小眼睛',
    hint: '休息一下',
    buddy: '眨眨团子',
    task: '让眼睛歇一歇',
    steps: [
      '放下屏幕，看看远处。',
      '和家长找找窗外的绿色。',
      '眼睛不舒服时告诉大人。',
    ],
    color: '#bdc7ee',
    position: [50, 28],
  },
  ears: {
    label: '小耳朵',
    hint: '轻声听世界',
    buddy: '听听团子',
    task: '听听身边的声音',
    steps: [
      '请家长把声音调到舒服的大小。',
      '一起听听风声或鸟叫。',
      '不要把小东西塞进耳朵。',
    ],
    color: '#efd48d',
    position: [69, 27],
  },
  head: {
    label: '小脑袋',
    hint: '按时休息',
    buddy: '呼呼团子',
    task: '准备一个好觉',
    steps: [
      '和家长约好休息时间。',
      '睡前把玩具放回家。',
      '关掉屏幕，听一个小故事。',
    ],
    color: '#bddec8',
    position: [50, 13],
  },
  feet: {
    label: '小脚丫',
    hint: '穿鞋去活动',
    buddy: '跳跳团子',
    task: '带小脚去散步',
    steps: [
      '穿上合脚的鞋子。',
      '和家长找一个安全的地方。',
      '一起散步，累了就休息。',
    ],
    color: '#e4c2a0',
    position: [50, 91],
  },
  body: {
    label: '全身',
    hint: '一起动一动',
    buddy: '圆圆团子',
    task: '全身伸个懒腰',
    steps: [
      '和家长找一块安全的空地。',
      '轻轻伸伸手，动动小脚。',
      '任何不舒服都停下来告诉大人。',
    ],
    color: '#acd9d6',
    position: [78, 69],
  },
};
export type Phase =
  'ready' | 'scanning' | 'mission' | 'practice' | 'reviewing' | 'award';
export type Game = {
  part: PartId;
  phase: Phase;
  progress: number;
  picked: number[];
  confirmed: boolean;
};
export const initialGame: Game = {
  part: 'belly',
  phase: 'ready',
  progress: 0,
  picked: [],
  confirmed: false,
};
export type Action =
  | { type: 'select'; part: PartId }
  | { type: 'start' }
  | { type: 'tick'; progress: number }
  | { type: 'practice' }
  | { type: 'pick'; star: number }
  | { type: 'confirm'; value: boolean }
  | { type: 'review' }
  | { type: 'reset' };
export function reducer(state: Game, action: Action): Game {
  switch (action.type) {
    case 'select':
      return state.phase === 'ready' || state.phase === 'award'
        ? { ...initialGame, part: action.part }
        : state;
    case 'start':
      return state.phase === 'ready'
        ? { ...state, phase: 'scanning', progress: 0 }
        : state;
    case 'tick': {
      if (state.phase !== 'scanning' && state.phase !== 'reviewing') {
        return state;
      }
      const progress = Math.min(1, Math.max(state.progress, action.progress));
      return {
        ...state,
        progress,
        phase:
          progress === 1
            ? state.phase === 'scanning'
              ? 'mission'
              : 'award'
            : state.phase,
      };
    }
    case 'practice':
      return state.phase === 'mission'
        ? { ...state, phase: 'practice' }
        : state;
    case 'pick':
      return state.phase === 'practice' &&
        [0, 1, 2].includes(action.star) &&
        !state.picked.includes(action.star)
        ? { ...state, picked: [...state.picked, action.star] }
        : state;
    case 'confirm':
      return state.phase === 'practice'
        ? { ...state, confirmed: action.value }
        : state;
    case 'review':
      return state.phase === 'practice' &&
        state.picked.length === 3 &&
        state.confirmed
        ? { ...state, phase: 'reviewing', progress: 0 }
        : state;
    case 'reset':
      return { ...initialGame, part: state.part };
  }
}
export const KEY = 'fungame:little-doctor:v1';
export const storeSchema = z
  .object({
    schemaVersion: z.literal(1),
    sound: z.boolean(),
    voice: z.boolean().default(true),
    scenarios: z.partialRecord(z.enum(partIds), sceneConfigSchema).default({}),
    records: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          part: z.enum(partIds),
        }),
      )
      .max(720),
  })
  .superRefine((store, ctx) => {
    for (const part of partIds) {
      const config = store.scenarios[part];
      if (config && !validScene(part, config.scene)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenarios', part, 'scene'],
          message: '该场景不属于此部位',
        });
      }
    }
  });
export type Store = z.infer<typeof storeSchema>;
export const emptyStore: Store = {
  schemaVersion: 1,
  sound: false,
  voice: true,
  scenarios: {},
  records: [],
};
export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function recordAward(store: Store, part: PartId, date: string): Store {
  if (store.records.some((r) => r.date === date && r.part === part)) {
    return store;
  }
  const records = [...store.records, { date, part }];
  const dates = [...new Set(records.map((r) => r.date))].sort().slice(-90);
  return { ...store, records: records.filter((r) => dates.includes(r.date)) };
}
export function todayParts(store: Store, date: string): PartId[] {
  return [
    ...new Set(store.records.filter((r) => r.date === date).map((r) => r.part)),
  ];
}
