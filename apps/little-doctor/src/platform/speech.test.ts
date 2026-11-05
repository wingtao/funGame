import { describe, it, expect } from 'vitest';
import { createNarrator, chineseVoice } from './speech';
import type { VoicePort } from './speech';
const zh: SpeechSynthesisVoice = {
  lang: 'zh-CN',
  name: '本地中文',
  localService: true,
  default: true,
  voiceURI: 'local-zh',
};
function setup(initial: SpeechSynthesisVoice[] = [zh]) {
  let voices = initial;
  const calls: string[] = [],
    messages: string[] = [];
  let end: () => void = () => undefined;
  let change: () => void = () => undefined;
  let fail: (code: string) => void = () => undefined;
  let cancels = 0;
  const port: VoicePort = {
    voices: () => voices,
    cancel: () => {
      cancels++;
    },
    speak: (text, _voice, onEnd, onError) => {
      calls.push(text);
      end = onEnd;
      fail = onError;
    },
    subscribe: (callback) => {
      change = callback;
      return () => {
        change = () => undefined;
      };
    },
  };
  const narrator = createNarrator(port, (message) => messages.push(message));
  return {
    narrator,
    calls,
    messages,
    finish: () => end(),
    error: (code: string) => fail(code),
    load: (next: SpeechSynthesisVoice[]) => {
      voices = next;
      change();
    },
    cancels: () => cancels,
  };
}
describe('local Chinese narration', () => {
  it('uses a local Chinese voice and never chooses remote speech', () => {
    expect(chineseVoice([{ ...zh, localService: false }])).toBeUndefined();
    expect(chineseVoice([{ ...zh, lang: 'en-US' }, zh])).toBe(zh);
  });
  it('queues scan progress and replaces stale speech on a new stage', () => {
    const s = setup();
    s.narrator.play('开始扫描');
    s.narrator.append('扫描中');
    expect(s.calls).toEqual(['开始扫描']);
    s.finish();
    expect(s.calls).toEqual(['开始扫描', '扫描中']);
    s.narrator.play('结果');
    expect(s.calls.at(-1)).toBe('结果');
    s.narrator.stop();
    s.finish();
    expect(s.calls.at(-1)).toBe('结果');
  });
  it('waits for asynchronously loaded voices', () => {
    const s = setup([]);
    s.narrator.play('结果');
    expect(s.calls).toHaveLength(0);
    s.load([zh]);
    expect(s.calls).toEqual(['结果']);
  });
  it('surfaces blocked playback and does not resume after disposal', () => {
    const s = setup();
    s.narrator.play('开始');
    s.error('not-allowed');
    expect(s.messages.at(-1)).toContain('重播');
    s.narrator.destroy();
    s.load([zh]);
    s.narrator.play('不应播放');
    expect(s.calls).toEqual(['开始']);
  });
});
