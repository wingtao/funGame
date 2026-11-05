export type ShareModel = {
  title: string;
  subtitle: string;
  lines: string[];
  footer: string;
  theme: 'car' | 'earnings';
};
export async function createShareImage(model: ShareModel): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1500;
  canvas.height = 2000;
  const c = canvas.getContext('2d');
  if (!c) {
    throw new Error('当前浏览器不支持图片生成');
  }
  c.scale(2, 2);
  c.fillStyle = model.theme === 'car' ? '#fff8ee' : '#faf6ef';
  c.fillRect(0, 0, 750, 1000);
  c.strokeStyle = '#352c28';
  c.lineWidth = 3;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(36, 36, 678, 928, 28);
  c.fill();
  c.stroke();
  c.fillStyle = '#352c28';
  c.font = 'bold 24px system-ui';
  c.fillText('FUN GAME / 生活快乐研究所', 72, 100);
  const wrap = (text: string, y: number, size: number, weight = '') => {
    c.font = `${weight} ${size}px system-ui`;
    let line = '';
    let row = y;
    for (const char of text) {
      if (c.measureText(line + char).width > 590) {
        c.fillText(line, 80, row);
        row += size * 1.5;
        line = '';
      }
      line += char;
    }
    c.fillText(line, 80, row);
    return row + size * 1.5;
  };
  let y = wrap(model.title, 190, 44, 'bold');
  y = wrap(model.subtitle, y + 20, 23);
  // Original geometric companion, drawn locally without external assets.
  c.fillStyle = model.theme === 'car' ? '#bfe7d3' : '#d5b38e';
  c.beginPath();
  c.roundRect(230, y + 30, 290, 160, 55);
  c.fill();
  c.stroke();
  c.fillStyle = '#352c28';
  c.beginPath();
  c.arc(320, y + 100, 6, 0, Math.PI * 2);
  c.arc(425, y + 100, 6, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(372, y + 116, 16, 0, Math.PI);
  c.stroke();
  y += 260;
  for (const line of model.lines) {
    y = wrap(line, y, 27);
    y += 18;
  }
  wrap(model.footer, 870, 18);
  wrap('仅作趣味估算 · 数据留在本机', 920, 17);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('图片生成失败'));
      }
    }, 'image/png');
  });
}
export async function shareFile(blob: Blob): Promise<void> {
  const file = new File([blob], 'fungame-card.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }
  downloadImage(blob);
}
export function downloadImage(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fungame-card.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
