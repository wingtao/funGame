import type { Phase } from './game';
export type NarrationInput = {
  phase: Phase;
  label: string;
  buddy: string;
  task: string;
  steps: string[];
  intro?: string;
  snack: string;
  note: string;
};
export function narration(input: NarrationInput): string {
  const { phase, label, buddy, task, steps, intro, snack, note } = input;
  const plan = [
    snack ? `和家长约定少吃的零食有：${snack}。` : '',
    note ? `家长提醒：${note}。` : '',
  ]
    .filter(Boolean)
    .join('');
  switch (phase) {
    case 'ready':
      return `请选择一个部位，和豆豆一起做习惯任务。当前选择${label}。`;
    case 'scanning':
      return `开始扫描${label}。`;
    case 'mission':
      return `模拟扫描完成。你好，我是${buddy}，故事里的小精灵。${intro ?? ''}一起完成${task}。${plan}`;
    case 'practice':
      return `开始任务：${task}。${plan}${steps.map((step, i) => `第${i + 1}步，${step}`).join('')}完成后，请和家长一起确认。`;
    case 'reviewing':
      return '开始习惯复查。';
    case 'award':
      return `${task}，完成啦！获得一张${label}贴纸。真棒！这是习惯任务奖励，不是身体健康检查。`;
  }
}
