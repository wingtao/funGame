import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { downloadImage, shareFile } from '../platform/share';
export function ShareDialog({
  blob,
  onClose,
}: {
  blob: Blob;
  onClose: () => void;
}) {
  const image = useRef<HTMLImageElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (image.current) {
      image.current.src = url;
    }
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return (
    <Modal title="分享图片" onClose={onClose}>
      <p className="muted">本机生成。若无法下载，可长按图片保存。</p>
      <img className="share-preview" ref={image} alt="即将分享的卡片预览" />
      <div className="button-row">
        <button
          className="primary"
          onClick={() => {
            shareFile(blob).catch(() =>
              setError('分享不可用，请下载图片或长按保存。'),
            );
          }}
        >
          分享图片
        </button>
        <button className="secondary" onClick={() => downloadImage(blob)}>
          下载 PNG
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </Modal>
  );
}
