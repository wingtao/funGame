import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';
export const moneyText = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, '请输入最多两位小数的金额')
  .refine(
    (v) => Number(v) > 0 && Number(v) <= 100000000,
    '金额须大于 0 且不超过一亿元',
  );
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '时间无效');
const date = z.string().refine((v) => {
  try {
    Temporal.PlainDate.from(v);
    return /^\d{4}-\d{2}-\d{2}$/.test(v);
  } catch {
    return false;
  }
}, '日期无效');
export const goalSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1, '请填写名称').max(20),
  amount: moneyText,
});
export const configSchema = z
  .object({
    mode: z.enum(['monthly', 'hourly']),
    monthly: z.string().max(100),
    hourly: z.string().max(100),
    basis: z.enum(['net', 'gross']),
    timeZone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat('zh-CN', { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, '时区无效'),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, '至少选择一个工作日'),
    start: time,
    end: time,
    lunchEnabled: z.boolean(),
    lunchStart: time,
    lunchEnd: time,
    paidLunch: z.boolean(),
    overrides: z.record(date, z.boolean()),
    denominators: z.record(
      z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      z.number().int().min(1).max(31),
    ),
    goals: z.array(goalSchema).max(5),
  })
  .superRefine((v, c) => {
    const salary = moneyText.safeParse(
      v.mode === 'monthly' ? v.monthly : v.hourly,
    );
    if (!salary.success) {
      c.addIssue({
        code: 'custom',
        path: [v.mode === 'monthly' ? 'monthly' : 'hourly'],
        message: '请输入大于 0 的金额，最多两位小数且不超过一亿元',
      });
    }
    if (v.start >= v.end) {
      c.addIssue({
        code: 'custom',
        path: ['end'],
        message: '下班须晚于上班，不支持跨夜班',
      });
    }
    if (
      v.lunchEnabled &&
      (v.lunchStart < v.start ||
        v.lunchEnd > v.end ||
        v.lunchStart >= v.lunchEnd)
    ) {
      c.addIssue({
        code: 'custom',
        path: ['lunchEnd'],
        message: '午休须完整位于班次内，结束晚于开始',
      });
    }
    if (
      v.lunchEnabled &&
      !v.paidLunch &&
      v.lunchStart === v.start &&
      v.lunchEnd === v.end
    ) {
      c.addIssue({
        code: 'custom',
        path: ['lunchEnd'],
        message: '至少保留一段计薪时间',
      });
    }
    if (new Set(v.goals.map((g) => g.id)).size !== v.goals.length) {
      c.addIssue({ code: 'custom', path: ['goals'], message: '目标 ID 重复' });
    }
  });
export type Config = z.infer<typeof configSchema>;
export type Goal = z.infer<typeof goalSchema>;
export const KEY = 'fungame:daily-earnings:v1';
export const storeSchema = z.object({
  schemaVersion: z.literal(1),
  config: configSchema.nullable(),
  hidden: z.boolean(),
  celebrated: z.object({ date: z.string(), ids: z.array(z.string()) }),
  updatedAt: z.number(),
});
export type Store = z.infer<typeof storeSchema>;
export const EMPTY: Store = {
  schemaVersion: 1,
  config: null,
  hidden: true,
  celebrated: { date: '', ids: [] },
  updatedAt: 0,
};
export function defaultConfig(): Config {
  return {
    mode: 'monthly',
    monthly: '10000',
    hourly: '50',
    basis: 'net',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekdays: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    lunchEnabled: true,
    lunchStart: '12:00',
    lunchEnd: '13:00',
    paidLunch: false,
    overrides: {},
    denominators: {},
    goals: [
      { id: 'coffee', name: '一杯咖啡', amount: '18' },
      { id: 'lunch', name: '一顿午饭', amount: '35' },
      { id: 'dinner', name: '今晚加个菜', amount: '80' },
    ],
  };
}
export function cents(v: string): number {
  const [whole, fraction = ''] = v.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function isWorkDate(c: Config, d: Temporal.PlainDate): boolean {
  return c.overrides[d.toString()] ?? c.weekdays.includes(d.dayOfWeek);
}
export function monthWorkdays(c: Config, month: string): number {
  const first = Temporal.PlainDate.from(`${month}-01`);
  let n = 0;
  for (let i = 1; i <= first.daysInMonth; i++) {
    if (isWorkDate(c, first.with({ day: i }))) {
      n++;
    }
  }
  return n;
}
export function monthDates(
  month: string,
): { date: string; day: number; weekday: number }[] {
  const first = Temporal.PlainDate.from(`${month}-01`);
  return Array.from({ length: first.daysInMonth }, (_, i) => {
    const d = first.with({ day: i + 1 });
    return { date: d.toString(), day: i + 1, weekday: d.dayOfWeek };
  });
}
function instantAt(c: Config, d: Temporal.PlainDate, t: string): number {
  return d
    .toPlainDateTime(Temporal.PlainTime.from(t))
    .toZonedDateTime(c.timeZone, { disambiguation: 'reject' })
    .epochMilliseconds;
}
export function intervals(
  c: Config,
  d: Temporal.PlainDate,
): {
  start: number;
  end: number;
  lunchStart: number;
  lunchEnd: number;
  paid: [number, number][];
} {
  const start = instantAt(c, d, c.start),
    end = instantAt(c, d, c.end),
    lunchStart = c.lunchEnabled ? instantAt(c, d, c.lunchStart) : end,
    lunchEnd = c.lunchEnabled ? instantAt(c, d, c.lunchEnd) : end;
  const paid: [number, number][] =
    c.lunchEnabled && !c.paidLunch
      ? [
          [start, lunchStart],
          [lunchEnd, end],
        ]
      : [[start, end]];
  return { start, end, lunchStart, lunchEnd, paid };
}
export type WorkState =
  'before' | 'working' | 'lunch-paid' | 'lunch-unpaid' | 'after' | 'rest';
export type Snapshot = {
  ok: true;
  date: string;
  month: string;
  state: WorkState;
  income: number;
  dailyIncome: number;
  progress: number;
  countdown: number;
  paidMs: number;
  elapsedMs: number;
  denominator: number;
  calendarDays: number;
  next: string;
  reachedIds: string[];
};
export type DayResult = Snapshot | { ok: false; message: string };
export function calculateDay(c: Config, nowMs: number): DayResult {
  try {
    const d = Temporal.Instant.fromEpochMilliseconds(Math.floor(nowMs))
      .toZonedDateTimeISO(c.timeZone)
      .toPlainDate();
    const dateKey = d.toString(),
      month = dateKey.slice(0, 7),
      calendarDays = monthWorkdays(c, month),
      denominator = c.denominators[month] ?? calendarDays;
    if (!isWorkDate(c, d)) {
      let next = '未来 366 天无有效班次，请检查工作安排';
      for (let i = 1; i <= 366; i++) {
        const candidate = d.add({ days: i });
        if (isWorkDate(c, candidate)) {
          try {
            intervals(c, candidate);
            next = `${candidate.toString()} ${c.start}`;
            break;
          } catch {
            continue;
          }
        }
      }
      return {
        ok: true,
        date: dateKey,
        month,
        state: 'rest',
        income: 0,
        dailyIncome: 0,
        progress: 0,
        countdown: 0,
        paidMs: 0,
        elapsedMs: 0,
        denominator,
        calendarDays,
        next,
        reachedIds: [],
      };
    }
    if (c.mode === 'monthly' && denominator === 0) {
      return {
        ok: false,
        message: '本月未安排计薪工作日，请检查日历或计薪天数。',
      };
    }
    const day = intervals(c, d),
      paidMs = day.paid.reduce((sum, [a, b]) => sum + b - a, 0);
    if (paidMs <= 0) {
      return { ok: false, message: '没有可计薪时间，请调整班次与午休。' };
    }
    const elapsedMs = day.paid.reduce(
        (sum, [a, b]) => sum + Math.max(0, Math.min(nowMs, b) - a),
        0,
      ),
      salary = cents(c.mode === 'monthly' ? c.monthly : c.hourly),
      divisor = c.mode === 'monthly' ? denominator * paidMs : 3600000,
      dailyIncome =
        c.mode === 'monthly'
          ? salary / denominator
          : (salary * paidMs) / 3600000,
      income = (salary * elapsedMs) / divisor;
    const state: WorkState =
      nowMs < day.start
        ? 'before'
        : nowMs >= day.end
          ? 'after'
          : c.lunchEnabled && nowMs >= day.lunchStart && nowMs < day.lunchEnd
            ? c.paidLunch
              ? 'lunch-paid'
              : 'lunch-unpaid'
            : 'working';
    const reachedIds = c.goals
      .filter(
        (g) =>
          BigInt(Math.floor(elapsedMs)) * BigInt(salary) >=
          BigInt(cents(g.amount)) * BigInt(divisor),
      )
      .map((g) => g.id);
    return {
      ok: true,
      date: dateKey,
      month,
      state,
      income,
      dailyIncome,
      progress: Math.max(
        0,
        Math.min(1, (nowMs - day.start) / (day.end - day.start)),
      ),
      countdown: Math.max(
        0,
        (state === 'before' ? day.start : day.end) - nowMs,
      ),
      paidMs,
      elapsedMs,
      denominator,
      calendarDays,
      next: '',
      reachedIds,
    };
  } catch {
    return {
      ok: false,
      message:
        '当前日期存在无效或重复的时区时刻（例如夏令时切换），请调整当天上下班或午休时间。',
    };
  }
}
export const STATE_LABEL: Record<WorkState, string> = {
  before: '准备上班',
  working: '正在努力赚钱',
  'lunch-paid': '午休中 · 继续计薪',
  'lunch-unpaid': '午休中 · 暂停计薪',
  after: '今日收工',
  rest: '今天休息',
};
export const STATE_COPY: Record<WorkState, string> = {
  before: '人还没开机，先喝口水。',
  working: '今天的饭钱，正在路上。',
  'lunch-paid': '吃饭中，计数继续。',
  'lunch-unpaid': '先好好吃饭，下午再出发。',
  after: '今日收工，钱包辛苦了。',
  rest: '今天轮到生活上班。',
};
export function formatMoney(c: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(c / 100);
}
export function countdown(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, secs % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}
