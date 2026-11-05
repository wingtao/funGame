import { z } from 'zod';
import type { PartId } from './game';
export type HabitScene = {
  id: string;
  label: string;
  buddy: string;
  task: string;
  intro: string;
  steps: [string, string, string];
};
export const habitScenes: Partial<Record<PartId, HabitScene[]>> = {
  belly: [
    {
      id: 'snacks',
      label: '零食吃多了，影响正餐',
      buddy: '零食虫虫',
      task: '和零食约个时间',
      intro:
        '零食虫虫是故事角色，不是真正的寄生虫。一起按约定吃零食，把肚子留给正餐。',
      steps: [
        '和家长商量今天零食的份量和时间。',
        '先好好吃正餐，不用零食替代吃饭。',
        '想再吃时先告诉家长，一起做决定。',
      ],
    },
    {
      id: 'sweet-drinks',
      label: '总想喝甜饮料',
      buddy: '甜甜团子',
      task: '给饮料换个选择',
      intro: '甜甜团子来提醒：今天和家长一起选一杯白水。',
      steps: [
        '和家长一起准备白水。',
        '把想喝的甜饮料告诉家长，商量份量和时间。',
        '口渴时先喝水，不用饮料代替正餐。',
      ],
    },
    {
      id: 'picky',
      label: '不愿尝试不同食物',
      buddy: '彩虹团子',
      task: '认识一种食物',
      intro: '彩虹团子想和你认识一种不同的食物，可以先看看、闻闻，不勉强。',
      steps: [
        '和家长挑一种适合自己的食物。',
        '一起观察颜色、闻闻气味，愿意时再尝试。',
        '告诉家长你的感受，不舒服就停下。',
      ],
    },
    {
      id: 'toilet',
      label: '想上厕所时总拖延',
      buddy: '慢慢团子',
      task: '听听身体的提醒',
      intro: '慢慢团子陪你练习：想上厕所时，及时告诉大人。',
      steps: [
        '有便意时告诉大人。',
        '请家长陪伴，安心使用厕所。',
        '不舒服或排便困难时告诉大人，不强迫自己。',
      ],
    },
  ],
  teeth: [
    {
      id: 'sweets',
      label: '糖果和甜点吃得频繁',
      buddy: '甜甜糖虫',
      task: '给甜食定个约定',
      intro: '甜甜糖虫只是故事角色。我们一起练习少频繁吃甜食，认真刷牙。',
      steps: [
        '和家长约好甜食的份量和时间。',
        '不把糖果一直含在嘴里，也不一直零零碎碎地吃。',
        '和家长一起认真刷牙，照顾每颗牙齿。',
      ],
    },
    {
      id: 'brushing',
      label: '睡前拖延刷牙',
      buddy: '泡泡糖虫',
      task: '完成睡前刷牙',
      intro: '泡泡糖虫不是牙齿检查结果，它来提醒我们完成睡前刷牙。',
      steps: [
        '和家长一起准备适合自己的牙刷。',
        '请家长陪伴，认真刷牙。',
        '收好牙刷，把刷牙加入睡前安排。',
      ],
    },
  ],
  eyes: [
    {
      id: 'screen',
      label: '看屏幕太久，忘记休息',
      buddy: '眨眨精灵',
      task: '给屏幕按个暂停',
      intro: '眨眨精灵邀请你放下屏幕，让眼睛休息一下。',
      steps: [
        '和家长约好屏幕使用时间。',
        '到时间就放下设备，看看远处。',
        '离开屏幕活动一下，眼睛不舒服就告诉大人。',
      ],
    },
    {
      id: 'rubbing',
      label: '喜欢用手揉眼睛',
      buddy: '轻轻精灵',
      task: '小手离开眼睛',
      intro: '轻轻精灵想和你练习：想揉眼睛时，先停一下并告诉家长。',
      steps: [
        '先把小手洗干净。',
        '不要用力揉眼睛。',
        '眼睛痒或不舒服时告诉家长，不自己处理。',
      ],
    },
  ],
};
export const sceneConfigSchema = z.object({
  scene: z.string().max(32).default('general'),
  snack: z.string().trim().max(40, '零食名称最多 40 个字').default(''),
  note: z.string().trim().max(80, '家长提醒最多 80 个字').default(''),
});
export type SceneConfig = z.infer<typeof sceneConfigSchema>;
export const defaultScene: SceneConfig = {
  scene: 'general',
  snack: '',
  note: '',
};
export function validScene(part: PartId, id: string): boolean {
  return (
    id === 'general' ||
    id === 'custom' ||
    Boolean(habitScenes[part]?.some((scene) => scene.id === id))
  );
}
export function selectedScene(
  part: PartId,
  config: SceneConfig,
): HabitScene | undefined {
  return habitScenes[part]?.find((scene) => scene.id === config.scene);
}
