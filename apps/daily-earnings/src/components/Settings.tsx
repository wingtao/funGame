import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Temporal } from '@js-temporal/polyfill';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { configSchema, monthDates, monthWorkdays } from '../domain/earnings';
import type { Config } from '../domain/earnings';
import { Modal } from './Modal';
export function Settings({
  initial,
  externalRevision,
  onSave,
  onClose,
  onReset,
}: {
  initial: Config;
  externalRevision: number;
  onSave: (config: Config) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const {
    register,
    reset: resetForm,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<Config>({
    defaultValues: initial,
    resolver: zodResolver(configSchema),
  });
  const mode = useWatch({ control, name: 'mode' }),
    weekdays = useWatch({ control, name: 'weekdays' }),
    lunch = useWatch({ control, name: 'lunchEnabled' }),
    overrides = useWatch({ control, name: 'overrides' }),
    denominators = useWatch({ control, name: 'denominators' }),
    timeZone = useWatch({ control, name: 'timeZone' });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'goals',
    keyName: 'fieldKey',
  });
  const [month, setMonth] = useState(() =>
    Temporal.Now.plainDateISO(initial.timeZone).toString().slice(0, 7),
  );
  const [reset, setReset] = useState(false);
  const [baseRevision, setBaseRevision] = useState(externalRevision);
  const conflict = baseRevision !== externalRevision;
  const shift = (n: number) =>
    setMonth(
      Temporal.PlainDate.from(`${month}-01`)
        .add({ months: n })
        .toString()
        .slice(0, 7),
    );
  const textField = (
    name:
      | 'monthly'
      | 'hourly'
      | 'timeZone'
      | 'start'
      | 'end'
      | 'lunchStart'
      | 'lunchEnd',
    label: string,
    type = 'text',
  ) => (
    <label className="field" key={name}>
      {label}
      <input
        type={type}
        inputMode={
          name === 'monthly' || name === 'hourly' ? 'decimal' : undefined
        }
        {...register(name)}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && (
        <small className="field-error">{errors[name]?.message}</small>
      )}
    </label>
  );
  return (
    <Modal title="设置我的打工日常" onClose={onClose}>
      {conflict && (
        <div className="notice" role="alert">
          <p>另一个标签页更新了设置，请选择如何处理当前草稿。</p>
          <div className="button-row">
            <button
              className="secondary"
              type="button"
              onClick={() => {
                resetForm(initial);
                setBaseRevision(externalRevision);
              }}
            >
              丢弃草稿并载入更新
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setBaseRevision(externalRevision)}
            >
              确认使用我的草稿覆盖
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={(event) => {
          handleSubmit((value) => {
            if (!conflict) {
              onSave(value);
            }
          })(event).catch(() => undefined);
        }}
        noValidate
      >
        <p className="muted">
          只保存在当前浏览器。修改后会按新规则重算今日，清理浏览器数据会丢失设置。
        </p>
        <section className="settings-section">
          <h3>01 / 工资怎么计算</h3>
          <div className="segmented">
            <label>
              <input type="radio" value="monthly" {...register('mode')} />
              按月薪
            </label>
            <label>
              <input type="radio" value="hourly" {...register('mode')} />
              按时薪
            </label>
          </div>
          {mode === 'monthly'
            ? textField('monthly', '月薪 / 元')
            : textField('hourly', '时薪 / 元')}
          <label className="field">
            薪资口径
            <select {...register('basis')}>
              <option value="net">到手金额（推荐）</option>
              <option value="gross">税前金额（不换算税费）</option>
            </select>
          </label>
        </section>
        <section className="settings-section">
          <h3>02 / 你的工作安排</h3>
          {textField('timeZone', '工作时区（IANA 名称）')}
          <p className="muted">
            例如
            Asia/Shanghai、Asia/Tokyo、America/New_York。设备时区变化不会自动修改这里。
          </p>
          <div className="weekday-picker" role="group" aria-label="每周工作日">
            {['一', '二', '三', '四', '五', '六', '日'].map((label, i) => (
              <button
                type="button"
                key={label}
                aria-pressed={weekdays.includes(i + 1)}
                className={weekdays.includes(i + 1) ? 'selected' : ''}
                onClick={() =>
                  setValue(
                    'weekdays',
                    weekdays.includes(i + 1)
                      ? weekdays.filter((d) => d !== i + 1)
                      : [...weekdays, i + 1],
                    { shouldValidate: true },
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
          {errors.weekdays && (
            <p className="field-error">{errors.weekdays.message}</p>
          )}
          <div className="form-grid">
            {textField('start', '上班时间', 'time')}
            {textField('end', '下班时间', 'time')}
          </div>
          <label className="check">
            <input type="checkbox" {...register('lunchEnabled')} />
            有午休时间
          </label>
          {lunch && (
            <>
              <div className="form-grid">
                {textField('lunchStart', '午休开始', 'time')}
                {textField('lunchEnd', '午休结束', 'time')}
              </div>
              <label className="check">
                <input type="checkbox" {...register('paidLunch')} />
                午休也计薪
              </label>
            </>
          )}
        </section>
        <section className="settings-section">
          <h3>03 / 调休和计薪日历</h3>
          <div className="calendar-heading">
            <button
              type="button"
              className="icon-button"
              aria-label="上个月"
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>{month}</strong>
            <button
              type="button"
              className="icon-button"
              aria-label="下个月"
              onClick={() => shift(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="muted">
            点击日期切换工作 / 休息。带小点的日期为手动调整，不自动导入节假日。
          </p>
          <div className="calendar">
            {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
              <span className="calendar-label" key={w}>
                {w}
              </span>
            ))}
            {Array.from(
              { length: (monthDates(month)[0]?.weekday ?? 1) - 1 },
              (_, i) => (
                <span key={`blank-${i}`} />
              ),
            )}
            {monthDates(month).map((d) => {
              const work = overrides[d.date] ?? weekdays.includes(d.weekday);
              return (
                <button
                  type="button"
                  key={d.date}
                  className={`${work ? 'workday' : ''} ${overrides[d.date] !== undefined ? 'overridden' : ''}`}
                  aria-label={`${d.date} ${work ? '工作' : '休息'}`}
                  aria-pressed={work}
                  onClick={() =>
                    setValue('overrides', {
                      ...getValues('overrides'),
                      [d.date]: !work,
                    })
                  }
                >
                  {d.day}
                </button>
              );
            })}
          </div>
          <p className="muted">
            日历工作日：{monthWorkdays({ ...getValues(), timeZone }, month)} 天
          </p>
          <label className="field">
            本月计薪日数（留空按日历）
            <input
              type="number"
              min="1"
              max="31"
              value={denominators[month] ?? ''}
              onChange={(e) => {
                const next = { ...getValues('denominators') };
                if (e.target.value === '') {
                  delete next[month];
                } else {
                  next[month] = Number(e.target.value);
                }
                setValue('denominators', next, { shouldValidate: true });
              }}
            />
          </label>
          {errors.denominators && (
            <p className="field-error">计薪日数须为 1–31 的整数</p>
          )}
          {denominators[month] !== undefined &&
            denominators[month] !== monthWorkdays(getValues(), month) && (
              <p className="notice">
                手动天数与日历不同，仅改变月薪换算分母，不改变哪些天上班。
              </p>
            )}
        </section>
        <section className="settings-section">
          <h3>04 / 给今天定点小目标</h3>
          <p className="muted">
            可跳过。每个目标都按今日累计收入判断，不会扣掉你的钱。
          </p>
          {fields.map((goal, index) => (
            <div className="goal-edit" key={goal.fieldKey}>
              <label className="field">
                目标名称
                <input
                  {...register(`goals.${index}.name`)}
                  maxLength={20}
                  aria-label={`目标 ${index + 1} 名称`}
                />
                {errors.goals?.[index]?.name && (
                  <small className="field-error">
                    {errors.goals[index]?.name?.message}
                  </small>
                )}
              </label>
              <label className="field">
                金额 / 元
                <input
                  {...register(`goals.${index}.amount`)}
                  inputMode="decimal"
                  aria-label={`目标 ${index + 1} 金额`}
                />
                {errors.goals?.[index]?.amount && (
                  <small className="field-error">
                    {errors.goals[index]?.amount?.message}
                  </small>
                )}
              </label>
              <button
                type="button"
                className="icon-button"
                aria-label={`删除目标 ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {fields.length < 5 && (
            <button
              type="button"
              className="secondary"
              onClick={() =>
                append({ id: crypto.randomUUID(), name: '', amount: '30' })
              }
            >
              <Plus size={16} />
              添加一个目标
            </button>
          )}
        </section>
        <div className="button-row">
          <button className="primary" type="submit" disabled={conflict}>
            保存，开始我的今天
          </button>
          <button className="secondary" type="button" onClick={onClose}>
            取消
          </button>
        </div>
        <button
          className="text-button danger"
          type="button"
          onClick={() => setReset(true)}
        >
          清除我的全部本机数据
        </button>
        {reset && (
          <div className="notice" role="alert">
            <p>清除后将无法恢复，只影响今日已赚。</p>
            <button type="button" className="secondary" onClick={onReset}>
              确认清除
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setReset(false)}
            >
              保留数据
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
