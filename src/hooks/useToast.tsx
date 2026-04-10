import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { Toast } from '../components/shared/Toast';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (title: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const timeoutRef = useRef<number | null>(null);

  const shiftQueue = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const pushToast = useCallback(
    (title: string, variant: ToastVariant = 'info') => {
      setQueue((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          title,
          variant
        }
      ]);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        shiftQueue();
      }, 3200);
    },
    [shiftQueue]
  );

  const contextValue = useMemo(() => ({ pushToast }), [pushToast]);
  const activeToast = queue[0];

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast message={activeToast} onClose={shiftQueue} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }
  return context;
};
