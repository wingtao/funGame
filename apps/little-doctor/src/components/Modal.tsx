import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-label={title}>
      <header className="modal-heading">
        <h2>{title}</h2>
        <button
          autoFocus
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
