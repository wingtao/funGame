import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Wallet,
  Check,
  RefreshCw,
  Share2,
  Scale,
  CarFront,
  ChevronDown,
} from 'lucide-react';
import {
  KEY,
  EMPTY,
  storeSchema,
  questions,
  scenarioSchema,
  calculate,
  demandScore,
  persona,
  financialLabel,
  money,
} from './domain/calculator';
import type { Store, Scenario, Result } from './domain/calculator';
import { readLocal, saveLocal, clearLocal } from './platform/storage';
import { createShareImage } from './platform/share';
import { Companions } from './components/Companions';
import { BudgetForm } from './components/BudgetForm';
import { Modal } from './components/Modal';
import { ShareDialog } from './components/ShareDialog';
function Score({
  label,
  value,
  copy,
}: {
  label: string;
  value: number;
  copy: string;
}) {
  return (
    <div className="score-box">
      <div>
        <span>{label}</span>
        <strong>
          {value}
          <small>/100</small>
        </strong>
      </div>
      <progress value={value} max={100} aria-label={label} />
      <p>{copy}</p>
    </div>
  );
}
function Bill({ result, scenario }: { result: Result; scenario: Scenario }) {
  const items = [
    ['月供', result.monthly],
    ['能源费', result.energy],
    ['停车费', Number(scenario.parking) * 100],
    [
      '保险 / 保养 / 其他折月',
      result.operating - result.energy - Number(scenario.parking) * 100,
    ],
  ] as const;
  const total = result.monthly + result.operating;
  return (
    <section className="bill">
      <div className="bill-header">
        <span>每月车辆现金支出</span>
        <strong>{money(total)}</strong>
        <small>贷款存续期间估算 · 不含保留的其他交通费</small>
      </div>
      {items.map(([label, value], i) => (
        <div className="bill-item" key={label}>
          <div>
            <i className={`color-${i}`} />
            <span>{label}</span>
            <strong>{money(value)}</strong>
          </div>
          <div className="bill-bar">
            <span
              className={`color-${i}`}
              style={{
                width: `${total > 0 ? (Math.max(0, value) / total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
      <div className="receipt-row">
        <span>相较原交通月增支</span>
        <strong>
          {result.increase >= 0 ? '+' : ''}
          {money(result.increase)}
        </strong>
      </div>
    </section>
  );
}
export default function App() {
  const [loaded] = useState(() => readLocal(KEY, storeSchema, EMPTY));
  const [store, setStore] = useState(loaded.value);
  const [notice, setNotice] = useState(loaded.message);
  const [rules, setRules] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [external, setExternal] = useState(false);
  const [editB, setEditB] = useState(false);
  const valid = scenarioSchema.safeParse(store.scenario);
  const complete = store.answers.every((a) => a !== null);
  const result = valid.success && complete ? calculate(valid.data) : null;
  const step =
    store.step >= 8 && !result
      ? complete
        ? 6
        : store.answers.findIndex((a) => a === null)
      : store.step;
  function commit(next: Store) {
    const value = { ...next, updatedAt: Date.now() };
    setStore(value);
    setNotice(saveLocal(KEY, value));
  }
  function go(next: number) {
    commit({ ...store, step: next });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function update(value: Scenario) {
    commit({ ...store, scenario: value, example: false });
  }
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === KEY) {
        setExternal(true);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('#step-title');
    heading?.focus();
  }, [step]);
  function clear() {
    const error = clearLocal(KEY);
    setStore(EMPTY);
    setNotice(error);
    setConfirm(false);
    setEditB(false);
  }
  function share() {
    setBusy(true);
    createShareImage({
      title: persona(store.answers),
      subtitle: '我的买车需求体检报告',
      theme: 'car',
      lines: [
        `用车需求 ${demandScore(store.answers)} / 100`,
        '先了解生活需要，再找到舒服的方案。',
        '想买与买得起，都值得好好聊聊。',
      ],
      footer: '买车前，先算算 / FUN GAME',
    })
      .then(setBlob)
      .catch(() => setNotice('图片生成失败，请重试。'))
      .finally(() => setBusy(false));
  }
  const current = step >= 0 && step < 6 ? questions[step] : undefined;
  const comparison = store.comparison
    ? scenarioSchema.safeParse(store.comparison)
    : null;
  const b = comparison?.success ? calculate(comparison.data) : null;
  return (
    <div className="car-app">
      <header className="site-header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go(-1);
          }}
        >
          <span className="brand-icon">
            <CarFront size={25} />
          </span>
          <div>买车前，先算算</div>
        </a>
        <button className="text-button" onClick={() => setRules(true)}>
          怎么算的？ <ArrowUpRight size={15} />
        </button>
      </header>
      {notice && (
        <div role="status" className="notice">
          {notice}
          <button className="text-button" onClick={() => setNotice('')}>
            知道了
          </button>
        </div>
      )}
      {external && (
        <div className="notice">
          另一个标签页更新了记录。载入会替换这里尚未保存的编辑。
          <button
            className="secondary"
            onClick={() => {
              const next = readLocal(KEY, storeSchema, EMPTY);
              setStore(next.value);
              setNotice(next.message);
              setExternal(false);
            }}
          >
            载入更新
          </button>
          <button className="text-button" onClick={() => setExternal(false)}>
            继续编辑此版本
          </button>
        </div>
      )}
      {step === -1 ? (
        <main className="landing">
          <div className="hero-copy">
            <h1>
              车车很心动，
              <br />
              钱包准备好了吗<span>？</span>
            </h1>
            <p>3 分钟了解用车需求和购车成本。</p>
            <div className="button-row">
              <button
                className="primary"
                onClick={() =>
                  go(
                    store.answers.some((a) => a !== null)
                      ? Math.max(
                          0,
                          store.answers.findIndex((a) => a === null) === -1
                            ? 6
                            : store.answers.findIndex((a) => a === null),
                        )
                      : 0,
                  )
                }
              >
                {store.answers.some((a) => a !== null)
                  ? '继续上次的体检'
                  : '带上钱包，出发'}
                <ArrowRight size={19} />
              </button>
              {complete && valid.success && (
                <button className="secondary" onClick={() => go(8)}>
                  查看我的报告
                </button>
              )}
            </div>
            <div className="trust-note">
              <ShieldCheck size={15} />
              不注册 · 不上传财务数据 · 结果仅供参考
            </div>
          </div>
          <div className="hero-art">
            <Companions />
          </div>
          <div className="feature-strip">
            <article>
              <span>01</span>
              <MapPin size={25} />
              <div>
                <h3>用车需求</h3>
                <p>通勤、接送、周末出逃</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <Wallet size={25} />
              <div>
                <h3>购车负担</h3>
                <p>月供、养车、生活缓冲</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <Scale size={25} />
              <div>
                <h3>方案对比</h3>
                <p>比较两份购车预算</p>
              </div>
            </article>
          </div>
        </main>
      ) : (
        <main className={`flow-main ${step >= 8 ? 'wide' : ''}`}>
          <div className="flow-heading">
            <span className="eyebrow">
              {step < 6
                ? '第一站 / 你的出行生活'
                : step < 8
                  ? '第二站 / 钱包小账本'
                  : '终点站 / 一份属于你的报告'}
            </span>
            <span className="step-number">
              {step < 6
                ? `${step + 1} / 6`
                : step < 8
                  ? '预算与方案'
                  : 'CHECKUP COMPLETE'}
            </span>
          </div>
          {step < 8 && (
            <div className="route-progress">
              <span
                style={{ width: `${Math.min(100, ((step + 1) / 8) * 100)}%` }}
              >
                <CarFront size={20} />
              </span>
            </div>
          )}
          {current ? (
            <section className="question-card">
              <span className="question-index">
                QUESTION {String(step + 1).padStart(2, '0')}
              </span>
              <h1 id="step-title" tabIndex={-1}>
                {current.title}
              </h1>

              <div className="options">
                {current.options.map((option, index) => (
                  <button
                    key={option}
                    className={
                      store.answers[step] === index
                        ? 'option selected'
                        : 'option'
                    }
                    aria-pressed={store.answers[step] === index}
                    onClick={() => {
                      const answers = [...store.answers];
                      answers[step] = index;
                      commit({ ...store, answers });
                    }}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    <span className="option-check">
                      {store.answers[step] === index ? (
                        <Check size={18} />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
              <div className="form-actions">
                <button className="text-button" onClick={() => go(step - 1)}>
                  <ArrowLeft size={17} />
                  上一步
                </button>
                <button
                  className="primary"
                  disabled={store.answers[step] === null}
                  onClick={() => go(step + 1)}
                >
                  下一站
                  <ArrowRight size={17} />
                </button>
              </div>
              <Companions compact />
            </section>
          ) : step === 6 || step === 7 ? (
            <section className="budget-card">
              <h1 id="step-title" tabIndex={-1}>
                {step === 6 ? '钱包，来聊聊你的日常' : '把心动变成一个具体方案'}
              </h1>
              <p className="muted">
                {store.example
                  ? '当前费用为可修改的示例估算，请换成自己的数据。'
                  : '初始金额为示例，请逐项确认或修改。财务信息只保存在本机。'}
              </p>
              <BudgetForm
                key={step}
                initial={store.scenario}
                section={step === 6 ? 'household' : 'vehicle'}
                onDraft={update}
                onBack={() => go(step - 1)}
                onNext={(value) =>
                  commit({
                    ...store,
                    scenario: value,
                    step: step + 1,
                    example: false,
                  })
                }
              />
            </section>
          ) : result && valid.success ? (
            <>
              <section className="result-hero">
                <div>
                  <span className="result-stamp">
                    <Check size={14} />
                    体检完成 · 规则 v1
                  </span>
                  <h1 id="step-title" tabIndex={-1}>
                    你是「{persona(store.answers)}」
                  </h1>
                  <p>{financialLabel(result.score)}。</p>
                </div>
                <Companions compact />
              </section>
              <div className="scores-grid">
                <Score
                  label="用车需求度"
                  value={demandScore(store.answers)}
                  copy={
                    demandScore(store.answers) >= 70
                      ? '买车可能明显改善你的出行体验。'
                      : demandScore(store.answers) >= 40
                        ? '有一些真实需要，也有一些生活向往。'
                        : '现有出行或许已能满足大部分需要。'
                  }
                />
                <Score
                  label="经济承受力"
                  value={result.score}
                  copy={financialLabel(result.score)}
                />
              </div>
              {(result.remaining < 0 || result.surplus < 0) && (
                <div className="warning" role="status">
                  <strong>车车很心动，钱包想换个方案。</strong>
                  <p>
                    {result.remaining < 0
                      ? `一次性购车支出还差 ${money(-result.remaining)}。`
                      : ''}
                    {result.surplus < 0
                      ? `按当前方案，每月存在 ${money(-result.surplus)} 的收支缺口。`
                      : ''}{' '}
                    可以降低车价、调整首付，先留足生活缓冲。
                  </p>
                </div>
              )}
              <div className="result-grid">
                <Bill result={result} scenario={valid.data} />
                <section className="cashflow">
                  <h2>买车后，还剩多少？</h2>
                  {[
                    ['每月结余', result.surplus],
                    ['还清车贷后月结余', result.afterLoan],
                    ['购车后存款', result.remaining],
                    ['希望留下的缓冲', result.reserveTarget],
                  ].map(([label, value]) => (
                    <div className="cashflow-row" key={String(label)}>
                      <span>{label}</span>
                      <strong>{money(Number(value))}</strong>
                    </div>
                  ))}
                  <p className="muted">
                    现金流项占 60%，存款缓冲项占
                    40%。缺口或赤字出现时，经济分最高 39。
                    <button
                      className="text-button"
                      onClick={() => setRules(true)}
                    >
                      查看评分依据
                    </button>
                  </p>
                </section>
              </div>
              <details className="details-card">
                <summary>
                  展开需求依据与持有总成本 <ChevronDown size={18} />
                </summary>
                <div className="detail-body">
                  <h3>哪些需要最突出？</h3>
                  {questions
                    .map((q, i) => ({ q, answer: store.answers[i] ?? 0 }))
                    .sort(
                      (a, b) => b.answer * b.q.weight - a.answer * a.q.weight,
                    )
                    .slice(0, 2)
                    .map(({ q, answer }) => (
                      <p key={q.id}>
                        {q.title} → {q.options[answer]}，贡献{' '}
                        {((answer / 3) * q.weight).toFixed(1)} 分。
                      </p>
                    ))}
                  <h3>
                    持有 {valid.data.years} 年总成本估算：
                    {money(result.ownership)}
                  </h3>
                  <p>
                    成交价 + 额外购车费 + 持有期内利息 + 持有期养车费 −
                    期末预计残值。残值是用户假设，不是报价。
                  </p>
                  <p>
                    一次性支出 {money(result.upfront)}；持有期内利息{' '}
                    {money(result.interest)}；期末剩余贷款本金{' '}
                    {money(result.balance)}
                    ，假设卖车时按剩余本金结清且无额外费用。
                  </p>
                </div>
              </details>
              <div className="result-actions">
                <div>
                  <h2>对比购车方案</h2>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    commit({
                      ...store,
                      comparison: store.comparison ?? { ...store.scenario },
                      step: 9,
                    });
                    setEditB(true);
                  }}
                >
                  <Scale size={18} />
                  对比另一个方案
                </button>
              </div>
              {step === 9 && b && comparison?.success && (
                <section className="comparison">
                  <h2>A / B 方案对比</h2>
                  <p className="muted">
                    A 为当前基准，B 独立编辑。需求问答保持一致。
                  </p>
                  <div className="comparison-head">
                    <span>账单项目</span>
                    <strong>A · ¥{store.scenario.price}</strong>
                    <strong>B · ¥{comparison.data.price}</strong>
                  </div>
                  {(
                    [
                      ['一次性支出', 'upfront'],
                      ['月供', 'monthly'],
                      ['月养车费', 'operating'],
                      ['每月结余', 'surplus'],
                      ['购车后存款', 'remaining'],
                      ['持有总成本', 'ownership'],
                      ['经济承受力', 'score'],
                    ] as const
                  ).map(([label, key]) => (
                    <div className="comparison-row" key={key}>
                      <span>{label}</span>
                      <strong>
                        {key === 'score'
                          ? `${result[key]} 分`
                          : money(result[key])}
                      </strong>
                      <div>
                        <strong>
                          {key === 'score' ? `${b[key]} 分` : money(b[key])}
                        </strong>
                        <small>
                          较 A {b[key] - result[key] >= 0 ? '+' : ''}
                          {key === 'score'
                            ? `${b[key] - result[key]} 分`
                            : money(b[key] - result[key])}
                        </small>
                      </div>
                    </div>
                  ))}
                  <div className="comparison-assumptions">
                    <p>
                      A：首付 {money(Number(valid.data.down) * 100)}，
                      {valid.data.months || '0'} 期 / {valid.data.apr || '0'}
                      %，持有 {valid.data.years} 年，月行驶{' '}
                      {valid.data.distance} 公里。
                    </p>
                    <p>
                      B：首付 {money(Number(comparison.data.down) * 100)}，
                      {comparison.data.months || '0'} 期 /{' '}
                      {comparison.data.apr || '0'}%，持有{' '}
                      {comparison.data.years} 年，月行驶{' '}
                      {comparison.data.distance} 公里。
                    </p>
                  </div>
                  <button className="secondary" onClick={() => setEditB(true)}>
                    修改 B 方案
                  </button>
                </section>
              )}
              <div className="bottom-actions">
                <button className="secondary" onClick={() => go(6)}>
                  <RefreshCw size={16} />
                  修改我的预算
                </button>
                <button className="secondary" disabled={busy} onClick={share}>
                  <Share2 size={16} />
                  {busy ? '正在生成…' : '分享脱敏结果'}
                </button>
                <button
                  className="text-button danger"
                  onClick={() => setConfirm(true)}
                >
                  清除本机数据
                </button>
              </div>
            </>
          ) : null}
        </main>
      )}
      <footer className="site-footer">
        <span>FUN GAME</span>
        <p>结果仅供预算参考。</p>
      </footer>
      {rules && (
        <Modal title="我们怎么算这笔账？" onClose={() => setRules(false)}>
          <div className="rules-copy">
            <h3>需求分</h3>
            <p>
              六题按 0–3 分加权，权重为 20、20、20、15、15、10，总分
              100。需求强不等于一定节省通勤时间。
            </p>
            <h3>经济承受力</h3>
            <p>
              月结余达到收入 30% 时现金流项满分（占
              60%）；购车后存款达到目标缓冲月数的总月支出时储备项满分（占
              40%）。有现金缺口或月度赤字时最高 39 分。
            </p>
            <h3>月支出与长期成本</h3>
            <p>
              月支出包括月供、能源、停车和年固定费用折月。长期成本只计车价、额外费用、持有期利息和养车费，再减预计残值，不重复加贷款本金或折旧。
            </p>
            <p>
              首版仅支持等额本息、燃油 /
              纯电、人民币。阈值是本产品的建模约定，不是行业标准；结果仅供趣味预算参考。
            </p>
            <p>
              所有计算在本机进行，分享卡默认且仅包含需求分、角色与通用结论，不包含财务数据。清理浏览器或换设备会丢失记录。
            </p>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title="清除这份体检记录？" onClose={() => setConfirm(false)}>
          <p>这会删除本机答案与 A/B 方案，无法恢复，不影响其他作品。</p>
          <div className="button-row">
            <button className="primary" onClick={clear}>
              确认清除
            </button>
            <button className="secondary" onClick={() => setConfirm(false)}>
              保留记录
            </button>
          </div>
        </Modal>
      )}
      {editB && store.comparison && (
        <Modal title="给 B 方案换个预算" onClose={() => setEditB(false)}>
          <p className="muted">
            编辑期间保留上次有效的 B 结果，提交后才更新。A 方案不会改变。
          </p>
          <BudgetForm
            initial={store.comparison}
            section="all"
            comparison
            onDraft={() => undefined}
            onBack={() => setEditB(false)}
            onNext={(value) => {
              commit({ ...store, comparison: { ...value }, step: 9 });
              setEditB(false);
            }}
          />
        </Modal>
      )}
      {blob && <ShareDialog blob={blob} onClose={() => setBlob(null)} />}
    </div>
  );
}
