import type { z } from 'zod';
export function readLocal<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): { value: T; message: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { value: fallback, message: '' };
    }
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success
      ? { value: result.data, message: '' }
      : {
          value: fallback,
          message:
            '本机记录损坏或版本不支持。当前使用初始设置，保存将替换旧记录。',
        };
  } catch {
    return {
      value: fallback,
      message: '无法读取本机设置；当前可使用，但刷新后可能丢失。',
    };
  }
}
export function saveLocal(key: string, value: unknown): string {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return '';
  } catch {
    return '设置未保存到本机，刷新后可能丢失。';
  }
}
export function clearLocal(key: string): string {
  try {
    localStorage.removeItem(key);
    return '';
  } catch {
    return '无法清除浏览器记录，请在浏览器设置中清理本站数据。';
  }
}
