import { describe, it, expect } from 'vitest';
import { narration } from './narration';
const input = {
  phase: 'mission' as const,
  label: '小牙齿',
  buddy: '甜甜糖虫',
  task: '给甜食定个约定',
  steps: ['约定份量。', '吃完收好。', '认真刷牙。'],
  intro: '这是故事角色。',
  snack: '棒棒糖',
  note: '今天先吃正餐。',
};
describe('narration scripts', () => {
  it('reads parent-selected scene and custom reminders', () => {
    const text = narration(input);
    expect(text).toContain('模拟扫描完成');
    expect(text).toContain('棒棒糖');
    expect(text).toContain('今天先吃正餐');
    expect(text).toContain('故事');
  });
  it('covers start, practice, review and reward', () => {
    expect(narration({ ...input, phase: 'scanning' })).toContain(
      '开始扫描小牙齿',
    );
    expect(narration({ ...input, phase: 'practice' })).toContain('第3步');
    expect(narration({ ...input, phase: 'reviewing' })).toContain('复查');
    expect(narration({ ...input, phase: 'award' })).toContain(
      '不是身体健康检查',
    );
  });
});
