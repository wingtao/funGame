import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  calculate,
  money,
  fieldSchema,
  scenarioSchema,
} from '../domain/calculator';
import type { Scenario } from '../domain/calculator';
export const householdFields = [
  'income',
  'living',
  'debt',
  'savings',
  'transportBefore',
  'transportAfter',
] as const;
const descriptions: Partial<Record<keyof Scenario, string>> = {
  living: '不含交通费和其他贷款，避免重复计算。',
  transportAfter: '例如保留的地铁、打车等费用。',
  fees: '不含成交价里已包含的费用。',
  resale: '这是你的假设，不是二手车报价预测。',
  buffer: '希望购车后留下几个月的支出缓冲。',
};
export function BudgetForm({
  initial,
  section,
  onDraft,
  onNext,
  onBack,
  comparison = false,
}: {
  initial: Scenario;
  section: 'household' | 'vehicle' | 'all';
  onDraft: (value: Scenario) => void;
  onNext: (value: Scenario) => void;
  onBack: () => void;
  comparison?: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<Scenario>({ defaultValues: initial });
  const liveValues = useWatch({ control });
  const liveResult = comparison ? scenarioSchema.safeParse(liveValues) : null;
  const energy = useWatch({ control, name: 'energy' }),
    down = useWatch({ control, name: 'down' }),
    price = useWatch({ control, name: 'price' });
  function submit(v: Scenario) {
    clearErrors();
    const parsed = scenarioSchema.safeParse(v);
    if (!parsed.success) {
      const issues = parsed.error.issues.filter(
        (issue) =>
          section !== 'household' ||
          householdFields.some((key) => key === issue.path[0]),
      );
      for (const key of Object.keys(fieldSchema.shape) as (keyof Scenario)[]) {
        const issue = issues.find((item) => item.path[0] === key);
        if (issue) {
          setError(key, { message: issue.message });
        }
      }
      const first = (Object.keys(fieldSchema.shape) as (keyof Scenario)[]).find(
        (key) => issues.some((i) => i.path[0] === key),
      );
      if (first) {
        setFocus(first);
        return;
      }
    }
    onNext(v);
  }
  function field(
    name: Exclude<keyof Scenario, 'energy'>,
    label: string,
    unit = '元',
  ) {
    return (
      <div className="field" key={name}>
        <label htmlFor={`budget-${name}`}>
          {label}
          <small>{unit}</small>
        </label>
        <input
          id={`budget-${name}`}
          {...register(name)}
          inputMode="decimal"
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {(name === 'price' || name === 'down') && (
          <input
            type="range"
            aria-label={name === 'price' ? '调整车价' : '调整首付'}
            min="0"
            max={
              name === 'down'
                ? Math.max(0, Number(price) || 0)
                : Math.min(100000000, Math.max(500000, Number(price) || 0))
            }
            step="1000"
            value={name === 'price' ? Number(price) || 0 : Number(down) || 0}
            onChange={(e) => {
              setValue(name, e.target.value);
              onDraft(getValues());
            }}
          />
        )}
        {errors[name] && (
          <small id={`${name}-error`} className="field-error">
            {errors[name]?.message}
          </small>
        )}
        {descriptions[name] && (
          <small className="field-help">{descriptions[name]}</small>
        )}
      </div>
    );
  }
  return (
    <form
      noValidate
      onChange={() => onDraft(getValues())}
      onSubmit={(event) => {
        handleSubmit(submit)(event).catch(() => undefined);
      }}
    >
      {(section === 'household' || section === 'all') && (
        <>
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h3>先看看你的生活账本</h3>
              <p>按实际承担车费的同一家庭口径填写。</p>
            </div>
          </div>
          <div className="form-grid">
            {field('income', '每月到手收入')}
            {field('living', '每月必要生活支出')}
            {field('debt', '其他贷款月供')}
            {field('savings', '可用于购车的存款')}
            {field('transportBefore', '买车前每月交通费')}
            {field('transportAfter', '买车后保留交通费')}
          </div>
        </>
      )}
      {(section === 'vehicle' || section === 'all') && (
        <>
          <div className="form-section-title">
            <span>02</span>
            <div>
              <h3>给心动的车，填个预算</h3>
              <p>示例费用可修改，不代表实际报价。</p>
            </div>
          </div>
          <div className="form-grid">
            {field('price', '车辆成交价')}
            {field('fees', '额外一次性购车费用')}
            {field('down', '首付金额')}
            {field('years', '预计持有时间', '年')}
            {field('resale', '持有期末预计残值')}
            {field('buffer', '希望留下的缓冲', '个月')}
          </div>
          {Number(down) < Number(price) && (
            <div className="loan-box">
              <h4>贷款安排 · 等额本息</h4>
              <div className="form-grid">
                {field('months', '贷款期限', '个月')}
                {field('apr', '贷款年利率', '%')}
              </div>
            </div>
          )}
          <div className="form-section-title">
            <span>03</span>
            <div>
              <h3>把养车的小账也算上</h3>
              <p>年费用自动折算到月。</p>
            </div>
          </div>
          <label className="field">
            <span>能源类型</span>
            <select {...register('energy')}>
              <option value="fuel">燃油车</option>
              <option value="electric">纯电车</option>
            </select>
          </label>
          <div className="form-grid">
            {field('distance', '每月预计行驶', '公里')}
            {field(
              'consumption',
              energy === 'fuel' ? '百公里油耗' : '百公里电耗',
              energy === 'fuel' ? '升' : 'kWh',
            )}
            {field(
              'unitPrice',
              energy === 'fuel' ? '每升油价' : '每度电价',
              '元',
            )}
            {field('parking', '每月停车费')}
            {field('insurance', '每年保险费')}
            {field('maintenance', '每年保养费')}
            {field('other', '每年其他固定费用')}
          </div>
        </>
      )}
      {comparison && (
        <div className="live-preview" role="status">
          {liveResult?.success
            ? (() => {
                const result = calculate(liveResult.data);
                return (
                  <>
                    B 方案即时估算：月供 {money(result.monthly)} · 月结余{' '}
                    {money(result.surplus)} · 经济承受力 {result.score} 分
                  </>
                );
              })()
            : '请补全有效输入，才会更新 B 方案即时估算。上次提交的方案保持不变。'}
        </div>
      )}
      <div className="form-actions">
        <button className="secondary" type="button" onClick={onBack}>
          <ArrowLeft size={17} />
          返回
        </button>
        <button className="primary" type="submit">
          {comparison
            ? '更新 B 方案'
            : section === 'household'
              ? '继续，看看车的预算'
              : '生成我的体检报告'}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}
