import Decimal from 'decimal.js';
import { z } from 'zod';
const D = Decimal.clone({ precision: 32, rounding: Decimal.ROUND_HALF_UP });
const nonnegative = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, '请输入非负数，最多两位小数')
  .refine((v) => Number(v) <= 100000000, '不能超过一亿');
const positive = nonnegative.refine((v) => Number(v) > 0, '必须大于 0');
export const fieldSchema = z.object({
  income: positive,
  living: nonnegative,
  debt: nonnegative,
  savings: nonnegative,
  transportBefore: nonnegative,
  transportAfter: nonnegative,
  price: positive,
  fees: nonnegative,
  down: nonnegative,
  months: z.string(),
  apr: z.string(),
  energy: z.enum(['fuel', 'electric']),
  distance: nonnegative,
  consumption: nonnegative,
  unitPrice: nonnegative,
  parking: nonnegative,
  insurance: nonnegative,
  maintenance: nonnegative,
  other: nonnegative,
  years: z.string(),
  resale: nonnegative,
  buffer: z.string(),
});
export const scenarioSchema = fieldSchema.superRefine((v, c) => {
  if (Number(v.down) > Number(v.price)) {
    c.addIssue({ code: 'custom', path: ['down'], message: '首付不能超过车价' });
  }
  if (Number(v.resale) > Number(v.price)) {
    c.addIssue({
      code: 'custom',
      path: ['resale'],
      message: '残值不能超过车价',
    });
  }
  if (Number(v.down) < Number(v.price)) {
    if (
      !/^\d+$/.test(v.months) ||
      Number(v.months) < 1 ||
      Number(v.months) > 84
    ) {
      c.addIssue({
        code: 'custom',
        path: ['months'],
        message: '贷款期限需为 1–84 个月整数',
      });
    }
    if (!/^\d+(\.\d{1,2})?$/.test(v.apr) || Number(v.apr) > 30) {
      c.addIssue({
        code: 'custom',
        path: ['apr'],
        message: '年利率需为 0–30%，最多两位小数',
      });
    }
  }
  for (const [key, max] of [
    ['years', 15],
    ['buffer', 24],
  ] as const) {
    if (!/^\d+$/.test(v[key]) || Number(v[key]) < 1 || Number(v[key]) > max) {
      c.addIssue({
        code: 'custom',
        path: [key],
        message: `请输入 1–${max} 的整数`,
      });
    }
  }
});
export type Scenario = z.infer<typeof scenarioSchema>;
export const DEFAULT: Scenario = {
  income: '12000',
  living: '4500',
  debt: '0',
  savings: '150000',
  transportBefore: '600',
  transportAfter: '100',
  price: '120000',
  fees: '8000',
  down: '60000',
  months: '36',
  apr: '3.5',
  energy: 'fuel',
  distance: '1000',
  consumption: '7',
  unitPrice: '8',
  parking: '300',
  insurance: '4500',
  maintenance: '1500',
  other: '600',
  years: '5',
  resale: '50000',
  buffer: '6',
};
export const questions = [
  {
    id: 'commute',
    title: '每天单程通勤，要多久？',
    copy: '小车：路上的时间，也值得被好好照顾。',
    options: ['15 分钟以内', '16–30 分钟', '31–60 分钟', '超过 60 分钟'],
    weight: 20,
  },
  {
    id: 'transit',
    title: '公共交通对你友好吗？',
    copy: '钱包：能直达的地铁，也是很棒的座驾。',
    options: ['直达且稳定', '一般方便', '换乘多或班次少', '几乎不可用'],
    weight: 20,
  },
  {
    id: 'family',
    title: '你需要经常接送家人吗？',
    copy: '小车：接送的，不只是路程。',
    options: ['没有需求', '每月几次', '每周几次', '几乎每天'],
    weight: 20,
  },
  {
    id: 'travel',
    title: '你有多想来一场自驾？',
    copy: '钱包：周末出逃，也记得带上我。',
    options: ['几乎没有', '每月不到一次', '每月 1–3 次', '每周至少一次'],
    weight: 15,
  },
  {
    id: 'trouble',
    title: '现在的出行，让你困扰吗？',
    copy: '小车：先聊需要，再聊想要。',
    options: ['几乎没有', '偶尔', '每周多次', '几乎每天'],
    weight: 15,
  },
  {
    id: 'extra',
    title: '运东西、夜间出行多吗？',
    copy: '钱包：临时的需要，也算需要。',
    options: ['几乎没有', '每月几次', '每周几次', '几乎每天'],
    weight: 10,
  },
] as const;
export const KEY = 'fungame:car-fit:v1';
export const answersSchema = z
  .array(z.number().int().min(0).max(3).nullable())
  .length(6);
export const rawScenarioSchema = fieldSchema.extend({
  income: z.string().max(100),
  living: z.string().max(100),
  debt: z.string().max(100),
  savings: z.string().max(100),
  transportBefore: z.string().max(100),
  transportAfter: z.string().max(100),
  price: z.string().max(100),
  fees: z.string().max(100),
  down: z.string().max(100),
  months: z.string().max(100),
  apr: z.string().max(100),
  distance: z.string().max(100),
  consumption: z.string().max(100),
  unitPrice: z.string().max(100),
  parking: z.string().max(100),
  insurance: z.string().max(100),
  maintenance: z.string().max(100),
  other: z.string().max(100),
  years: z.string().max(100),
  resale: z.string().max(100),
  buffer: z.string().max(100),
});
export const storeSchema = z.object({
  schemaVersion: z.literal(1),
  ruleVersion: z.literal('v1'),
  answers: answersSchema,
  scenario: rawScenarioSchema,
  comparison: rawScenarioSchema.nullable(),
  step: z.number().int().min(-1).max(9),
  example: z.boolean(),
  updatedAt: z.number(),
});
export type Store = z.infer<typeof storeSchema>;
export const EMPTY: Store = {
  schemaVersion: 1,
  ruleVersion: 'v1',
  answers: [null, null, null, null, null, null],
  scenario: { ...DEFAULT },
  comparison: null,
  step: -1,
  example: true,
  updatedAt: 0,
};
export function demandScore(answers: (number | null)[]): number {
  return Math.round(
    questions.reduce(
      (sum, q, i) => sum + ((answers[i] ?? 0) / 3) * q.weight,
      0,
    ),
  );
}
export function affordability(
  income: number,
  surplus: number,
  savings: number,
  target: number,
): number {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const score = Math.round(
    100 *
      (0.6 * clamp(surplus / income / 0.3) +
        0.4 *
          (target === 0 ? (savings >= 0 ? 1 : 0) : clamp(savings / target))),
  );
  return surplus < 0 || savings < 0 ? Math.min(39, score) : score;
}
export type Result = {
  monthly: number;
  energy: number;
  operating: number;
  upfront: number;
  remaining: number;
  before: number;
  surplus: number;
  afterLoan: number;
  increase: number;
  ownership: number;
  interest: number;
  totalInterest: number;
  balance: number;
  score: number;
  reserveTarget: number;
  principalPaid: number;
};
export function calculate(v: Scenario): Result {
  const money = (s: string) => new D(s).mul(100),
    price = money(v.price),
    down = money(v.down),
    principal = price.minus(down),
    r = new D(principal.isZero() ? 0 : v.apr).div(1200),
    n = principal.isZero() ? 0 : Number(v.months);
  const monthly = principal.isZero()
    ? new D(0)
    : r.isZero()
      ? principal.div(n)
      : principal.mul(r).mul(r.plus(1).pow(n)).div(r.plus(1).pow(n).minus(1));
  let balance = principal,
    heldInterest = new D(0),
    totalInterest = new D(0),
    principalPaid = new D(0);
  const heldMonths = Number(v.years) * 12;
  for (let i = 0; i < n; i++) {
    const interest = balance.mul(r);
    const payment = i === n - 1 ? balance : monthly.minus(interest);
    balance = D.max(0, balance.minus(payment));
    totalInterest = totalInterest.plus(interest);
    if (i < heldMonths) {
      heldInterest = heldInterest.plus(interest);
      principalPaid = principalPaid.plus(payment);
    }
  }
  const outstanding = principal.minus(principalPaid),
    energy = new D(v.distance)
      .div(100)
      .mul(v.consumption)
      .mul(money(v.unitPrice)),
    operating = energy
      .plus(money(v.parking))
      .plus(
        money(v.insurance)
          .plus(money(v.maintenance))
          .plus(money(v.other))
          .div(12),
      );
  const upfront = down.plus(money(v.fees)),
    remaining = money(v.savings).minus(upfront),
    before = money(v.income)
      .minus(money(v.living))
      .minus(money(v.debt))
      .minus(money(v.transportBefore)),
    surplus = money(v.income)
      .minus(money(v.living))
      .minus(money(v.debt))
      .minus(monthly)
      .minus(operating)
      .minus(money(v.transportAfter));
  const reserveTarget = money(v.living)
    .plus(money(v.debt))
    .plus(monthly)
    .plus(operating)
    .plus(money(v.transportAfter))
    .mul(v.buffer);
  return {
    monthly: monthly.toNumber(),
    energy: energy.toNumber(),
    operating: operating.toNumber(),
    upfront: upfront.toNumber(),
    remaining: remaining.toNumber(),
    before: before.toNumber(),
    surplus: surplus.toNumber(),
    afterLoan: surplus.plus(monthly).toNumber(),
    increase: monthly
      .plus(operating)
      .plus(money(v.transportAfter))
      .minus(money(v.transportBefore))
      .toNumber(),
    ownership: price
      .plus(money(v.fees))
      .plus(heldInterest)
      .plus(operating.mul(heldMonths))
      .minus(money(v.resale))
      .toNumber(),
    interest: heldInterest.toNumber(),
    totalInterest: totalInterest.toNumber(),
    balance: outstanding.toNumber(),
    score: affordability(
      money(v.income).toNumber(),
      surplus.toNumber(),
      remaining.toNumber(),
      reserveTarget.toNumber(),
    ),
    reserveTarget: reserveTarget.toNumber(),
    principalPaid: principalPaid.toNumber(),
  };
}
export function persona(answers: (number | null)[]): string {
  return demandScore(answers) >= 70
    ? '刚需通勤型'
    : demandScore(answers) >= 40 && (answers[3] ?? 0) >= 2
      ? '周末出逃型'
      : '从容规划型';
}
export function financialLabel(score: number): string {
  return score < 40
    ? '先调整方案'
    : score < 70
      ? '有压力，留点余地'
      : '当前假设下较从容';
}
export function money(c: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(c / 100);
}
