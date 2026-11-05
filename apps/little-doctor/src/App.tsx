import {
  useCallback,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  ScanLine,
  Flower2,
  Settings2,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Volume2,
  VolumeX,
  Smile,
  Hand,
  Eye,
  Ear,
  Footprints,
  Brain,
  Heart,
  Utensils,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  parts,
  partIds,
  reducer,
  initialGame,
  storeSchema,
  emptyStore,
  KEY,
  localDay,
  recordAward,
  todayParts,
} from './domain/game';
import type { PartId, Store } from './domain/game';
import { Explorer, Buddy } from './components/Explorer';
import { Modal } from './components/Modal';
import { HabitSettings } from './components/HabitSettings';
import { selectedScene, defaultScene } from './domain/scenarios';
import { readLocal, saveLocal, clearLocal } from './platform/storage';
import { browserVoicePort, createNarrator } from './platform/speech';
import type { Narrator } from './platform/speech';
import { narration } from './domain/narration';
const icons = {
  belly: Utensils,
  teeth: Smile,
  hands: Hand,
  eyes: Eye,
  ears: Ear,
  head: Brain,
  feet: Footprints,
  body: Heart,
};
export default function App() {
  const [loaded] = useState(() => readLocal(KEY, storeSchema, emptyStore));
  const [store, setStore] = useState(loaded.value);
  const [notice, setNotice] = useState(loaded.message);
  const [game, dispatch] = useReducer(reducer, initialGame);
  const [parent, setParent] = useState(false);
  const [collection, setCollection] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const narrator = useRef<Narrator | null>(null);
  const [voiceMessage, setVoiceMessage] = useState('');
  const part = parts[game.part],
    scanning = game.phase === 'scanning' || game.phase === 'reviewing',
    locked = game.phase !== 'ready' && game.phase !== 'award';
  const sceneConfig = store.scenarios[game.part] ?? defaultScene;
  const scene = selectedScene(game.part, sceneConfig);
  const story = {
    buddy: scene?.buddy ?? part.buddy,
    task: scene?.task ?? part.task,
    steps: scene?.steps ?? part.steps,
    intro: scene?.intro,
  };
  const familyPlan = (
    <div className="family-plan">
      {sceneConfig.snack && (
        <p>
          <strong>少吃零食约定：</strong>
          {sceneConfig.snack}
        </p>
      )}
      {sceneConfig.note && (
        <p>
          <strong>家长提醒：</strong>
          {sceneConfig.note}
        </p>
      )}
    </div>
  );
  const today = localDay();
  const earned = todayParts(store, today);
  const persist = useCallback((value: Store) => {
    setStore(value);
    setNotice(saveLocal(KEY, value));
  }, []);
  const beep = useCallback(
    (success = false) => {
      if (!store.sound) {
        return;
      }
      try {
        if (typeof AudioContext === 'undefined') {
          return;
        }
        const context = audio.current ?? new AudioContext();
        audio.current = context;
        context.resume().catch(() => undefined);
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.frequency.setValueAtTime(
          success ? 660 : 440,
          context.currentTime,
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          success ? 880 : 550,
          context.currentTime + 0.12,
        );
        gain.gain.setValueAtTime(0.025, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + 0.25,
        );
        oscillator.start();
        oscillator.stop(context.currentTime + 0.26);
      } catch {
        setNotice('声音不可用，可以继续无声游玩。');
      }
    },
    [store.sound],
  );
  function speakPhase(phase = game.phase) {
    if (!store.voice) {
      return;
    }
    const text = narration({
      phase,
      label: part.label,
      ...story,
      snack: sceneConfig.snack,
      note: sceneConfig.note,
    });
    if (narrator.current) {
      narrator.current.play(text);
    } else {
      setVoiceMessage('此浏览器不支持语音播报，可换用系统浏览器。');
    }
  }
  function setVoice(enabled: boolean) {
    persist({ ...store, voice: enabled });
    if (enabled) {
      if (narrator.current) {
        narrator.current.play('语音已开启。点击开始扫描，就能听到讲解。');
      } else {
        setVoiceMessage('此浏览器不支持语音播报，可换用系统浏览器。');
      }
    } else {
      narrator.current?.stop();
      setVoiceMessage('');
    }
  }
  useEffect(() => {
    const port = browserVoicePort();
    if (!port) {
      return;
    }
    const controller = createNarrator(port, setVoiceMessage);
    narrator.current = controller;
    const hide = () => {
      if (document.visibilityState !== 'visible') {
        controller.stop();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      controller.destroy();
      narrator.current = null;
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  const stageNarration = useEffectEvent(() => {
    if (parent || collection || game.phase === 'ready') {
      narrator.current?.stop();
      return;
    }
    if (
      game.phase === 'mission' ||
      game.phase === 'practice' ||
      game.phase === 'award'
    ) {
      speakPhase();
    }
  });
  useEffect(() => {
    stageNarration();
  }, [game.phase, parent, collection]);
  const processNarration = useEffectEvent(() => {
    if (store.voice && !parent && !collection) {
      narrator.current?.append(
        game.phase === 'reviewing' ? '复查进行中。' : '正在扫描，请稍等。',
      );
    }
  });
  const finishReview = useEffectEvent(() => {
    persist(recordAward(store, game.part, localDay()));
    beep(true);
  });
  useEffect(
    () => () => {
      audio.current?.close().catch(() => undefined);
    },
    [],
  );
  useEffect(() => {
    if (game.phase !== 'scanning' && game.phase !== 'reviewing') {
      return;
    }
    let elapsed = 0,
      previous = performance.now(),
      progressSpoken = false;
    const duration = game.phase === 'reviewing' ? 2400 : 3600;
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (document.visibilityState !== 'visible') {
        return;
      }
      elapsed += Math.min(delta, 250);
      const progress = Math.min(1, elapsed / duration);
      if (!progressSpoken && progress >= 0.45) {
        progressSpoken = true;
        processNarration();
      }
      dispatch({ type: 'tick', progress });
      if (progress === 1) {
        clearInterval(timer);
        if (game.phase === 'reviewing') {
          finishReview();
        }
      }
    }, 80);
    return () => clearInterval(timer);
  }, [game.phase, game.part]);
  useEffect(() => {
    if (
      game.phase === 'ready' ||
      !window.matchMedia('(max-width: 720px)').matches
    ) {
      return;
    }
    const target =
      game.phase === 'scanning' || game.phase === 'reviewing'
        ? '.scanner-card'
        : '.control-panel';
    document.querySelector(target)?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, [game.phase]);
  function choose(id: PartId) {
    dispatch({ type: 'select', part: id });
  }
  function clear() {
    const message = clearLocal(KEY);
    setStore(emptyStore);
    setNotice(message);
    dispatch({ type: 'reset' });
    setConfirmClear(false);
    setParent(false);
  }
  const step =
    game.phase === 'ready'
      ? 0
      : game.phase === 'scanning'
        ? 0
        : game.phase === 'mission' || game.phase === 'practice'
          ? 1
          : 2;
  return (
    <div className="doctor-app">
      <header className="site-header">
        <a
          href="#"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            dispatch({ type: 'reset' });
          }}
        >
          <span className="brand-icon">
            <ScanLine size={24} />
          </span>
          <strong>身体探险队</strong>
        </a>
        <div className="header-actions">
          <button
            className="sticker-button"
            onClick={() => setCollection(true)}
          >
            <Flower2 size={19} />
            <span>我的贴纸</span>
            <b>{store.records.length}</b>
          </button>
          <button
            className="icon-button"
            aria-label="家长说明与设置"
            onClick={() => setParent(true)}
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>
      <div className="voice-toolbar">
        <button
          type="button"
          aria-pressed={store.voice}
          aria-label={store.voice ? '关闭语音' : '开启语音'}
          onClick={() => setVoice(!store.voice)}
        >
          {store.voice ? <Volume2 size={18} /> : <VolumeX size={18} />}语音
          {store.voice ? '已开' : '已关'}
        </button>
        <button
          type="button"
          disabled={!store.voice}
          onClick={() => speakPhase()}
        >
          重播语音
        </button>
        {voiceMessage && <span role="status">{voiceMessage}</span>}
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button className="text-button" onClick={() => setNotice('')}>
            知道了
          </button>
        </div>
      )}
      <main>
        <div className="page-title">
          <div>
            <span className="tiny-label">亲子互动 · 模拟游戏</span>
            <h1>今天，探索哪里？</h1>
          </div>
          <span className="daily-count">
            <Flower2 size={17} /> 今日 {earned.length} / 8
          </span>
        </div>
        <div className="game-layout">
          <section className="scanner-card" aria-label="模拟扫描区">
            <div className="scanner-heading">
              <span className="device-status">
                <i />
                {scanning
                  ? '模拟扫描中'
                  : game.phase === 'award'
                    ? '任务已完成'
                    : '探险准备就绪'}
              </span>
              <span className="device-number">DOUDOU / 01</span>
            </div>
            <div className="avatar-stage">
              <Explorer
                part={game.part}
                scanning={scanning}
                progress={game.progress}
              />
              <span className="avatar-name">豆豆</span>
              <span className="part-bubble" style={{ background: part.color }}>
                {part.label}
              </span>
            </div>
            <div className="scanner-bottom">
              <ScanLine size={18} />
              <span>
                {scanning ? '保持页面打开，马上就好' : '选择部位，和豆豆一起玩'}
              </span>
              <small>模拟</small>
            </div>
            {scanning && (
              <progress
                className="scan-progress"
                max={1}
                value={game.progress}
                aria-label="模拟扫描进度"
              />
            )}
          </section>
          <section className="control-panel" aria-label="探索与任务">
            <div className="journey" aria-label="游戏步骤">
              {['选部位', '做任务', '领贴纸'].map((label, index) => (
                <span
                  className={
                    step === index ? 'active' : step > index ? 'done' : ''
                  }
                  key={label}
                >
                  <b>{step > index ? <Check size={12} /> : index + 1}</b>
                  {label}
                </span>
              ))}
            </div>
            {game.phase === 'ready' ? (
              <>
                <div className="panel-heading">
                  <h2>选一个部位</h2>
                  <p>只扫描卡通角色，不使用摄像头。</p>
                </div>
                <div className="part-grid">
                  {partIds.map((id) => {
                    const Icon = icons[id],
                      selected = game.part === id;
                    return (
                      <button
                        key={id}
                        className={`part-card ${selected ? 'selected' : ''}`}
                        aria-label={`选择${parts[id].label}`}
                        aria-pressed={selected}
                        onClick={() => choose(id)}
                      >
                        <span
                          className="part-icon"
                          style={{ background: parts[id].color }}
                        >
                          <Icon size={23} />
                        </span>
                        <span>
                          <strong>{parts[id].label}</strong>
                          <small>{parts[id].hint}</small>
                        </span>
                        {earned.includes(id) && (
                          <Check className="earned-check" size={14} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="primary start-button"
                  onClick={() => {
                    beep();
                    speakPhase('scanning');
                    dispatch({ type: 'start' });
                  }}
                >
                  <ScanLine size={20} />
                  开始扫描{part.label}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : scanning ? (
              <div className="scan-state">
                <span className="scan-orbit">
                  <ScanLine size={42} />
                </span>
                <h2>
                  {game.phase === 'reviewing'
                    ? '好习惯复查中'
                    : '正在探索' + part.label}
                </h2>
                <p>这是故事动画，不是身体检测。</p>
                <strong className="progress-number">
                  {Math.round(game.progress * 100)}
                  <small>%</small>
                </strong>
                <button
                  className="secondary"
                  onClick={() => dispatch({ type: 'reset' })}
                >
                  取消扫描
                </button>
              </div>
            ) : game.phase === 'mission' ? (
              <div className="mission-state">
                <span className="mini-badge">故事小精灵</span>
                <Buddy color={part.color} />
                <h2>你好，我是{story.buddy}</h2>
                <p>一起完成「{story.task}」吧。</p>
                {story.intro && <p className="scene-intro">{story.intro}</p>}
                {(sceneConfig.snack || sceneConfig.note) && familyPlan}
                <ol className="task-list">
                  {story.steps.map((text, index) => (
                    <li key={text}>
                      <span>{index + 1}</span>
                      {text}
                    </li>
                  ))}
                </ol>
                <button
                  className="primary"
                  onClick={() => dispatch({ type: 'practice' })}
                >
                  开始习惯任务
                  <ArrowRight size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => dispatch({ type: 'reset' })}
                >
                  <ArrowLeft size={15} />
                  换一个部位
                </button>
              </div>
            ) : game.phase === 'practice' ? (
              <div className="practice-state">
                <span className="mini-badge">习惯小任务</span>
                <h2>{story.task}</h2>
                {(sceneConfig.snack || sceneConfig.note) && familyPlan}
                <p>和家长在生活里试一试，完成一项点亮一颗星。</p>
                <div className="task-checklist">
                  {story.steps.map((text, index) => (
                    <button
                      key={text}
                      className={game.picked.includes(index) ? 'task-done' : ''}
                      aria-label={`完成第${index + 1}项任务`}
                      aria-pressed={game.picked.includes(index)}
                      disabled={game.picked.includes(index)}
                      onClick={() => {
                        beep();
                        dispatch({ type: 'pick', star: index });
                      }}
                    >
                      <span>
                        <Star
                          size={23}
                          fill={
                            game.picked.includes(index)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </span>
                      <strong>{text}</strong>
                      {game.picked.includes(index) && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <label className="parent-confirm">
                  <input
                    type="checkbox"
                    checked={game.confirmed}
                    onChange={(e) =>
                      dispatch({ type: 'confirm', value: e.target.checked })
                    }
                  />
                  我和家长一起完成了
                </label>
                <button
                  className="primary"
                  disabled={game.picked.length < 3 || !game.confirmed}
                  onClick={() => {
                    beep();
                    speakPhase('reviewing');
                    dispatch({ type: 'review' });
                  }}
                >
                  完成了，开始复查
                  <ArrowRight size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => dispatch({ type: 'reset' })}
                >
                  下次再做
                </button>
              </div>
            ) : (
              <div className="award-state">
                <span className="mini-badge">好习惯任务完成</span>
                <div className="flower-award">
                  <Flower2 size={92} strokeWidth={1.3} />
                  <Check size={23} className="flower-check" />
                </div>
                <h2>{story.task}，完成！</h2>
                <p>获得一张「{part.label}」贴纸。</p>
                <small>每个部位每天记一次，可以重复游玩。</small>
                <div className="award-actions">
                  <button
                    className="primary"
                    onClick={() => dispatch({ type: 'reset' })}
                  >
                    继续探索
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setCollection(true)}
                  >
                    查看贴纸
                  </button>
                </div>
                <p className="award-note">这是任务奖励，不是健康检查结果。</p>
              </div>
            )}
          </section>
        </div>
        <section className="habit-strip">
          <div>
            <ShieldCheck size={20} />
            <span>不使用摄像头</span>
          </div>
          <div>
            <Heart size={20} />
            <span>不做健康判断</span>
          </div>
          <div>
            <Flower2 size={20} />
            <span>用鼓励练习好习惯</span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>FUN GAME</span>
        <p>亲子模拟游戏 · 身体不舒服，请告诉大人。</p>
      </footer>
      {parent && (
        <Modal
          title="家长说明与设置"
          onClose={() => {
            setParent(false);
            setConfirmClear(false);
          }}
        >
          <div className="parent-copy">
            <p>
              这是亲子角色扮演游戏。扫描对象是卡通角色，小精灵是故事形象，不代表孩子体内有虫、细菌或疾病。
            </p>
            <p>
              任务奖励只记录参与和练习，不判断身体健康。孩子不舒服时请停止游戏并向大人求助，需要时寻求医疗帮助。
            </p>
            <p>
              不使用摄像头、麦克风或定位。不注册、不上传数据；贴纸和声音偏好只存于当前浏览器，清理浏览器会丢失。
            </p>
            <HabitSettings
              scenarios={store.scenarios}
              initialPart={game.part}
              locked={locked}
              onSave={(scenarios) => {
                persist({ ...store, scenarios });
                dispatch({ type: 'reset' });
              }}
            />
            <label className="sound-setting">
              <input
                type="checkbox"
                checked={store.voice}
                onChange={(event) => setVoice(event.target.checked)}
              />
              中文语音播报
            </label>
            <p className="voice-help">
              使用设备本地中文语音，不上传家长提醒。若未播放，请安装系统中文语音、检查音量并点击重播。部分内置浏览器可能不支持。
            </p>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                if (narrator.current) {
                  narrator.current.play(
                    '你好，我是豆豆。我们一起开始身体探险吧。',
                  );
                } else {
                  setVoiceMessage('此浏览器不支持语音播报。');
                }
              }}
            >
              试听中文语音
            </button>
            <label className="sound-setting">
              <input
                type="checkbox"
                checked={store.sound}
                disabled={locked}
                onChange={(e) => persist({ ...store, sound: e.target.checked })}
              />
              {store.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              开启轻提示音
            </label>
            {locked && <small>完成或取消当前任务后可修改声音设置。</small>}
            <button
              className="text-button danger"
              onClick={() => setConfirmClear(true)}
            >
              <RotateCcw size={15} />
              清除本机贴纸
            </button>
            {confirmClear && (
              <div className="notice">
                <p>确定清除本游戏的贴纸和偏好？不能恢复。</p>
                <div className="button-row">
                  <button className="secondary" onClick={clear}>
                    确认清除
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setConfirmClear(false)}
                  >
                    保留
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {collection && (
        <Modal title="我的习惯贴纸" onClose={() => setCollection(false)}>
          <p className="collection-summary">
            今天点亮 {earned.length} 个部位 · 累计 {store.records.length} 张
          </p>
          <div className="collection-grid">
            {partIds.map((id) => {
              const count = store.records.filter((r) => r.part === id).length;
              const Icon = icons[id];
              return (
                <article className={count ? 'collected' : ''} key={id}>
                  <span
                    style={{ background: count ? parts[id].color : undefined }}
                  >
                    <Icon size={28} />
                  </span>
                  <strong>{parts[id].label}</strong>
                  <small>
                    {count
                      ? `${count} 张 · ${earned.includes(id) ? '今日已点亮' : '等待今天点亮'}`
                      : '还未收集'}
                  </small>
                </article>
              );
            })}
          </div>
          <p className="collection-note">
            贴纸记录任务参与，不是身体健康记录。
          </p>
        </Modal>
      )}
    </div>
  );
}
