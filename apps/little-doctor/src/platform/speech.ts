export type VoicePort = {
  voices: () => SpeechSynthesisVoice[];
  cancel: () => void;
  speak: (
    text: string,
    voice: SpeechSynthesisVoice,
    onEnd: () => void,
    onError: (code: string) => void,
  ) => void;
  subscribe: (callback: () => void) => () => void;
};
export function chineseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const local = voices.filter(
    (v) => v.localService && /^zh(?:[-_]|$)/i.test(v.lang),
  );
  return (
    local.find((v) => /^zh[-_]CN$/i.test(v.lang)) ??
    local.find((v) => /^zh[-_](?:Hans|SG)/i.test(v.lang)) ??
    local[0]
  );
}
export function createNarrator(
  port: VoicePort,
  onMessage: (message: string) => void,
) {
  let queue: string[] = [],
    active = false,
    generation = 0,
    disposed = false;
  function stop() {
    generation++;
    queue = [];
    active = false;
    port.cancel();
  }
  function pump() {
    if (disposed || active || !queue.length) {
      return;
    }
    const voices = port.voices(),
      voice = chineseVoice(voices);
    if (!voice) {
      onMessage(
        voices.length
          ? '设备没有可用的本地中文语音。请在系统中安装中文语音后重试。'
          : '正在加载设备语音，若未播放请点击重播。',
      );
      return;
    }
    const text = queue.shift();
    if (!text) {
      return;
    }
    active = true;
    const token = generation;
    try {
      port.speak(
        text,
        voice,
        () => {
          if (disposed || token !== generation) {
            return;
          }
          active = false;
          onMessage('');
          pump();
        },
        (code) => {
          if (disposed || token !== generation) {
            return;
          }
          active = false;
          queue = [];
          if (code !== 'interrupted' && code !== 'canceled') {
            onMessage(
              code === 'not-allowed'
                ? '请点击“重播语音”开始播放。'
                : '语音播放失败，请点击重播或检查设备音量。',
            );
          }
        },
      );
    } catch {
      active = false;
      queue = [];
      onMessage('语音不可用，请检查系统中文语音设置。');
    }
  }
  const unsubscribe = port.subscribe(pump);
  return {
    play(text: string) {
      stop();
      if (!disposed && text.trim()) {
        queue = [text];
        onMessage('');
        pump();
      }
    },
    append(text: string) {
      if (!disposed && text.trim()) {
        queue.push(text);
        pump();
      }
    },
    stop,
    destroy() {
      disposed = true;
      stop();
      unsubscribe();
    },
  };
}
export type Narrator = ReturnType<typeof createNarrator>;
export function browserVoicePort(): VoicePort | null {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return null;
  }
  const synth = window.speechSynthesis;
  let utterance: SpeechSynthesisUtterance | null = null;
  return {
    voices: () => synth.getVoices(),
    cancel: () => {
      synth.cancel();
      utterance = null;
    },
    speak: (text, voice, onEnd, onError) => {
      const next = new SpeechSynthesisUtterance(text);
      utterance = next;
      next.voice = voice;
      next.lang = voice.lang;
      next.rate = 0.95;
      next.pitch = 1.05;
      next.volume = 0.9;
      next.onend = () => {
        if (utterance === next) {
          utterance = null;
        }
        onEnd();
      };
      next.onerror = (event) => {
        if (utterance === next) {
          utterance = null;
        }
        onError(event.error);
      };
      synth.speak(next);
    },
    subscribe: (callback) => {
      synth.addEventListener('voiceschanged', callback);
      return () => synth.removeEventListener('voiceschanged', callback);
    },
  };
}
