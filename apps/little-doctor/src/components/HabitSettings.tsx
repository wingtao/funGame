import { useState } from 'react';
import { partIds, parts } from '../domain/game';
import type { PartId, Store } from '../domain/game';
import {
  habitScenes,
  defaultScene,
  sceneConfigSchema,
} from '../domain/scenarios';
import type { SceneConfig } from '../domain/scenarios';
export function HabitSettings({
  scenarios,
  initialPart,
  locked,
  onSave,
}: {
  scenarios: Store['scenarios'];
  initialPart: PartId;
  locked: boolean;
  onSave: (scenarios: Store['scenarios']) => void;
}) {
  const [part, setPart] = useState(initialPart);
  const [drafts, setDrafts] = useState(scenarios);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const config = drafts[part] ?? defaultScene;
  function update(patch: Partial<SceneConfig>) {
    setDrafts({ ...drafts, [part]: { ...config, ...patch } });
    setSaved(false);
    setError('');
  }
  function save() {
    const result = sceneConfigSchema.safeParse(config);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '请检查配置');
      return;
    }
    onSave({ ...drafts, [part]: result.data });
    setSaved(true);
  }
  return (
    <section className="habit-settings">
      <h3>习惯场景配置</h3>
      <p>家长选择本次想练习的习惯。场景不是扫描诊断。</p>
      <fieldset disabled={locked}>
        <label className="config-field">
          配置部位
          <select
            aria-label="配置部位"
            value={part}
            onChange={(e) => {
              const chosen = partIds.find((id) => id === e.target.value);
              if (chosen) {
                setPart(chosen);
                setSaved(false);
                setError('');
              }
            }}
          >
            {partIds.map((id) => (
              <option key={id} value={id}>
                {parts[id].label}
              </option>
            ))}
          </select>
        </label>
        <label className="config-field">
          习惯场景
          <select
            aria-label="习惯场景"
            value={config.scene}
            onChange={(e) => update({ scene: e.target.value })}
          >
            <option value="general">通用习惯任务</option>
            {habitScenes[part]?.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.label}
              </option>
            ))}
            <option value="custom">自定义家长提醒</option>
          </select>
        </label>
        {(part === 'belly' || part === 'teeth') && (
          <label className="config-field">
            想约定少吃的零食（可选）
            <input
              value={config.snack}
              onChange={(e) => update({ snack: e.target.value })}
              maxLength={40}
              placeholder="例如：棒棒糖、薯片、甜饮料"
            />
            <small>只显示为家长约定，不会被描述为生病或长虫的原因。</small>
          </label>
        )}
        <label className="config-field">
          家长提醒（可选）
          <textarea
            value={config.note}
            onChange={(e) => update({ note: e.target.value })}
            maxLength={80}
            rows={2}
            placeholder="例如：今天先吃正餐，零食按约定的份量吃。"
          />
        </label>
        <div className="config-preview">
          <strong>
            {parts[part].label} ·{' '}
            {habitScenes[part]?.find((scene) => scene.id === config.scene)
              ?.label ??
              (config.scene === 'custom' ? '自定义家长提醒' : '通用习惯任务')}
          </strong>
          {config.snack && <p>零食约定：{config.snack}</p>}
          {config.note && <p>家长提醒：{config.note}</p>}
        </div>
        {error && (
          <p className="config-error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button type="button" className="primary" onClick={save}>
            保存习惯配置
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setDrafts({ ...drafts, [part]: { ...defaultScene } });
              setSaved(false);
            }}
          >
            恢复当前部位默认
          </button>
        </div>
        {saved && (
          <p className="config-saved" role="status">
            已应用配置，请重新开始扫描。
          </p>
        )}
      </fieldset>
      {locked && (
        <p className="config-error">先完成或取消当前任务，再修改场景。</p>
      )}
    </section>
  );
}
