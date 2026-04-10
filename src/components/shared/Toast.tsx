import { useEffect, useState } from 'react';
import { cx } from '../../lib/utils';
import type { ToastMessage } from '../../hooks/useToast';

interface ToastProps {
  message?: ToastMessage;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={cx(
        'pointer-events-none fixed bottom-6 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-white/95 p-4 shadow-soft backdrop-blur transition duration-300 sm:right-6',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        message.variant === 'success' && 'border-emerald-200',
        message.variant === 'error' && 'border-rose-200',
        message.variant === 'info' && 'border-brand-orange/30'
      )}
    >
      <p className="text-sm font-semibold text-brand-ink">{message.title}</p>
    </div>
  );
};
