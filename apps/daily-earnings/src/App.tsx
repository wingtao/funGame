import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Settings2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Share2,
  Coffee,
  Check,
  Leaf,
  Pause,
  Play,
  ArrowRight,
  LockKeyhole,
} from 'lucide-react';
import { Temporal } from '@js-temporal/polyfill';
import {
  calculateDay,
  KEY,
  storeSchema,
  EMPTY,
  defaultConfig,
  STATE_LABEL,
  formatMoney,
  countdown,
  cents,
} from './domain/earnings';
import type { Config, Store } from './domain/earnings';
import { readLocal, saveLocal, clearLocal } from './platform/storage';
import { createShareImage } from './platform/share';
import { Workroom } from './components/Workroom';
import { Settings } from './components/Settings';
import { Modal } from './components/Modal';
import { ShareDialog } from './components/ShareDialog';
export default function App() {
  const [initial] = useState(() => readLocal(KEY, storeSchema, EMPTY));
  const [store, setStore] = useState(initial.value);
  const [message, setMessage] = useState(initial.message);
  const [now, setNow] = useState(() => Date.now());
  const [demo, setDemo] = useState(false);
  const [demoStart, setDemoStart] = useState(() => Date.now());
  const [settings, setSettings] = useState(false);
  const [externalRevision, setExternalRevision] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focus, setFocus] = useState(false);
  const [toast, setToast] = useState('');
  const [shareOptions, setShareOptions] = useState(false);
  const [includeAmount, setIncludeAmount] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sharing, setSharing] = useState(false);
  const demoConfig = useMemo(
    () => ({
      ...defaultConfig(),
      timeZone: 'Asia/Shanghai',
      overrides: { '2026-11-05': true },
      denominators: { '2026-11': 20 },
    }),
    [],
  );
  const config = demo ? demoConfig : store.config;
  const effectiveNow = demo
    ? Temporal.ZonedDateTime.from('2026-11-05T14:32:18[Asia/Shanghai]')
        .epochMilliseconds + Math.max(0, now - demoStart)
    : now;
  const result = useMemo(
    () => (config ? calculateDay(config, effectiveNow) : null),
    [config, effectiveNow],
  );
  const hidden = !demo && store.hidden;
  function commit(next: Store) {
    setStore(next);
    setMessage(saveLocal(KEY, next));
  }
  useEffect(() => {
    let previous = store.config ? calculateDay(store.config, Date.now()) : null;
    let previousMs = Date.now();
    const tick = (natural: boolean) => {
      const currentMs = Date.now();
      setNow(currentMs);
      const current = store.config
        ? calculateDay(store.config, currentMs)
        : null;
      if (
        !demo &&
        current?.ok &&
        previous?.ok &&
        natural &&
        document.visibilityState === 'visible' &&
        document.hasFocus() &&
        current.date === previous.date &&
        currentMs > previousMs &&
        currentMs - previousMs < 5000
      ) {
        const remembered =
          store.celebrated.date === current.date ? store.celebrated.ids : [];
        const ids = current.reachedIds
          .filter((id) => !previous?.ok || !previous.reachedIds.includes(id))
          .filter((id) => !remembered.includes(id));
        if (ids.length) {
          const next = {
            ...store,
            celebrated: { date: current.date, ids: [...remembered, ...ids] },
            updatedAt: currentMs,
          };
          setStore(next);
          setMessage(saveLocal(KEY, next));
          setToast('小目标达成！今天又多了一份小快乐。');
        }
      }
      previous = current;
      previousMs = currentMs;
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        tick(true);
      }
    }, 1000);
    const resume = () => tick(false);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [store, demo]);
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== KEY) {
        return;
      }
      const loaded = readLocal(KEY, storeSchema, EMPTY);
      setStore(loaded.value);
      setExternalRevision((value) => value + 1);
      setMessage(
        loaded.message ||
          '已同步另一个标签页的设置。若正在编辑，请取消后重新打开以载入更新。',
      );
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  function save(configToSave: Config) {
    commit({
      ...store,
      config: configToSave,
      hidden: store.config ? store.hidden : false,
      updatedAt: Date.now(),
    });
    setSettings(false);
    setDemo(false);
    setNow(Date.now());
  }
  function reset() {
    const error = clearLocal(KEY);
    setStore(EMPTY);
    setMessage(error);
    setSettings(false);
    setDemo(false);
  }
  function toggleFullscreen() {
    if (focus) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
      setFocus(false);
    } else {
      setFocus(true);
      document.documentElement
        .requestFullscreen?.()
        .catch(() => setMessage('使用页面内专注模式；浏览器不支持系统全屏。'));
    }
  }
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setFocus(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  function makeShare() {
    if (!result?.ok) {
      return;
    }
    setSharing(true);
    createShareImage({
      title: '今日也在好好生活',
      subtitle: demo ? '虚拟演示 · 分享一份小快乐' : '我和打工搭子的一天',
      theme: 'earnings',
      lines: [
        `工作日进度 ${Math.round(result.progress * 100)}%`,
        ...(includeAmount ? [`今日估算 ¥${formatMoney(result.income)}`] : []),
        '日子慢慢过，小快乐慢慢攒。',
      ],
      footer: '今日已赚 / FUN GAME',
    })
      .then((value) => {
        setBlob(value);
        setShareOptions(false);
      })
      .catch(() => setMessage('图片生成失败，请重试。'))
      .finally(() => setSharing(false));
  }
  return (
    <div className={focus ? 'app focus-mode' : 'app'}>
      <header className="site-header">
        <a className="brand" href="#" aria-label="今日已赚首页">
          <span className="brand-mark">
            <Leaf size={23} />
          </span>
          <span>今日已赚</span>
        </a>
        <div className="header-tools">
          <span className="local-note">
            <LockKeyhole size={13} />
            数据只在本机
          </span>
          <button
            className="icon-button"
            aria-label="打开设置"
            onClick={() => {
              if (store.config && hidden && !demo) {
                setReveal(true);
              } else {
                setSettings(true);
              }
            }}
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>
      {message && (
        <div className="notice" role="status">
          {message}
          <button className="text-button" onClick={() => setMessage('')}>
            知道了
          </button>
        </div>
      )}
      {demo && (
        <div className="demo-banner">
          你正在体验虚拟演示，不会保存个人收入。
          <button
            onClick={() => {
              setDemo(false);
              if (!store.config) {
                setSettings(true);
              }
            }}
          >
            设置我的工资 <ArrowRight size={15} />
          </button>
        </div>
      )}
      {!config ? (
        <main className="welcome">
          <div className="welcome-copy">
            <h1>今天赚了多少？</h1>
            <p>实时估算收入，查看下班倒计时。</p>
            <div className="button-row">
              <button className="primary" onClick={() => setSettings(true)}>
                设置我的工资 <ArrowUpRight size={18} />
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setDemoStart(Date.now());
                  setDemo(true);
                }}
              >
                先逛逛演示
              </button>
            </div>
            <span className="fine-print">无需注册，数据仅存本机。</span>
          </div>
          <div className="welcome-scene">
            <Workroom />
          </div>
        </main>
      ) : (
        <main>
          <div className="day-heading">
            <div>
              <h1>今日收入</h1>
            </div>
            <p>
              {result?.ok ? result.date : '今日'}
              <br />
              <small>{config.timeZone}</small>
            </p>
          </div>
          {result?.ok ? (
            <>
              <div className="dashboard-grid">
                <section className="income-card">
                  <div className="income-top">
                    <span className="status-pill">
                      <i />
                      {STATE_LABEL[result.state]}
                    </span>
                    <button
                      className="icon-button"
                      onClick={() => {
                        if (demo) {
                          return;
                        }
                        commit({
                          ...store,
                          hidden: !store.hidden,
                          updatedAt: Date.now(),
                        });
                      }}
                      aria-label={hidden ? '显示金额' : '隐藏金额'}
                    >
                      {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <p className="income-label">
                    {demo ? '虚拟演示收入' : '今日累计收入'}{' '}
                    <span>
                      {' '}
                      / {config.basis === 'net' ? '到手' : '税前'}估算
                    </span>
                  </p>
                  <div
                    className={`income-value ${hidden ? 'hidden-value' : ''}`}
                    aria-label={hidden ? '金额已隐藏' : undefined}
                  >
                    <span>¥</span>
                    {hidden ? '••••••' : formatMoney(result.income)}
                  </div>
                  <p className="rate-line">
                    {hidden
                      ? '金额已隐藏。'
                      : result.paidMs > 0
                        ? `每分钟约 ¥${formatMoney(result.dailyIncome / (result.paidMs / 60000))}`
                        : '今日休息。'}
                  </p>
                  <div className="work-progress">
                    <div>
                      <span>工作日进度（含午休）</span>
                      <strong>{Math.round(result.progress * 100)}%</strong>
                    </div>
                    <progress
                      value={result.progress}
                      max={1}
                      aria-label="工作日进度"
                    />
                  </div>
                  <div className="countdown-row">
                    <span>
                      {result.state === 'rest'
                        ? '下次上班'
                        : result.state === 'before'
                          ? '距离开工'
                          : '距离下班'}
                    </span>
                    <strong>
                      {result.state === 'rest'
                        ? result.next
                        : countdown(result.countdown)}
                    </strong>
                  </div>
                  <div className="tiny-rule">
                    {config.mode === 'monthly'
                      ? `本月按 ${result.denominator} 个计薪日估算 · 日历工作日 ${result.calendarDays} 天`
                      : '按实际计薪时长估算'}
                    <br />
                    {config.start} – {config.end} ·{' '}
                    {config.lunchEnabled
                      ? config.paidLunch
                        ? '午休计薪'
                        : '午休不计薪'
                      : '无午休'}{' '}
                    · 设备时钟计算
                  </div>
                </section>
                <section className={`scene-card ${paused ? 'paused' : ''}`}>
                  <div className="scene-top">
                    <span>阿豚的工位</span>
                    <button
                      className="icon-button"
                      aria-label={paused ? '播放装饰动画' : '暂停装饰动画'}
                      onClick={() => setPaused(!paused)}
                    >
                      {paused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>
                  <Workroom state={result.state} paused={paused} />
                </section>
              </div>
              <section className="goals-section">
                <div className="section-heading">
                  <div>
                    <h2>今日目标</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() =>
                      hidden && !demo ? setReveal(true) : setSettings(true)
                    }
                  >
                    编辑目标 <ArrowUpRight size={15} />
                  </button>
                </div>
                <p className="muted">目标不扣减收入。</p>
                <div className="goals-grid">
                  {[...config.goals]
                    .sort((a, b) => cents(a.amount) - cents(b.amount))
                    .map((goal, i) => {
                      const done = result.reachedIds.includes(goal.id);
                      return (
                        <article
                          className={`goal-card ${done ? 'complete' : ''}`}
                          key={goal.id}
                        >
                          <span className="goal-icon">
                            {done ? <Check size={22} /> : <Coffee size={22} />}
                          </span>
                          <div>
                            <small>
                              小快乐 {String(i + 1).padStart(2, '0')}
                            </small>
                            <h3>{goal.name}</h3>
                            <p>
                              {hidden
                                ? '金额已隐藏'
                                : done
                                  ? '这份快乐，赚到了！'
                                  : `还差 ¥${formatMoney(Math.max(0, cents(goal.amount) - result.income))}`}
                            </p>
                          </div>
                          <span className="goal-price">
                            {hidden ? '•••' : `¥${goal.amount}`}
                          </span>
                          <progress
                            max={1}
                            value={Math.min(
                              1,
                              result.income / cents(goal.amount),
                            )}
                            aria-label={`${goal.name}进度`}
                          />
                        </article>
                      );
                    })}
                  {config.goals.length === 0 && (
                    <button
                      className="empty-goal"
                      onClick={() =>
                        hidden && !demo ? setReveal(true) : setSettings(true)
                      }
                    >
                      给今天加一个小目标吧 <ArrowRight size={17} />
                    </button>
                  )}
                </div>
              </section>
              <div className="dashboard-bottom">
                <div className="button-row">
                  <button className="secondary" onClick={toggleFullscreen}>
                    {focus ? <Minimize2 size={16} /> : <Maximize2 size={16} />}{' '}
                    {focus ? '退出专注' : '专注展示'}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setIncludeAmount(false);
                      setShareOptions(true);
                    }}
                  >
                    <Share2 size={16} />
                    分享今天
                  </button>
                </div>
              </div>
            </>
          ) : (
            <section className="error-card" role="alert">
              <h2>先调整一下工作安排</h2>
              <p>{result?.message}</p>
              <button
                className="primary"
                onClick={() => (hidden ? setReveal(true) : setSettings(true))}
              >
                检查设置
              </button>
            </section>
          )}
        </main>
      )}
      <footer className="site-footer">
        <span>FUN GAME</span>
        <p>收入仅为估算，数据存于本机。</p>
      </footer>
      {settings && (
        <Settings
          externalRevision={externalRevision}
          initial={store.config ?? defaultConfig()}
          onSave={save}
          onClose={() => setSettings(false)}
          onReset={reset}
        />
      )}
      {reveal && (
        <Modal title="准备查看你的设置？" onClose={() => setReveal(false)}>
          <p>
            编辑设置会展示薪资与目标金额。仅在本次编辑中显示，不会解除主页的隐藏状态。
          </p>
          <button
            className="primary"
            onClick={() => {
              setReveal(false);
              setSettings(true);
            }}
          >
            确认，打开设置
          </button>
        </Modal>
      )}
      {shareOptions && (
        <Modal title="分享一份小快乐" onClose={() => setShareOptions(false)}>
          <p>默认只包含场景和工作进度，不包含薪资。</p>
          <label className="check">
            <input
              type="checkbox"
              checked={includeAmount}
              onChange={(e) => setIncludeAmount(e.target.checked)}
            />
            我愿意在这张图片中展示今日估算收入
          </label>
          <button className="primary" disabled={sharing} onClick={makeShare}>
            {sharing ? '正在本机生成…' : '生成分享预览'}
          </button>
        </Modal>
      )}
      {blob && <ShareDialog blob={blob} onClose={() => setBlob(null)} />}
      {toast && (
        <div className="toast" role="status">
          <Check size={20} />
          {toast}
        </div>
      )}
    </div>
  );
}
