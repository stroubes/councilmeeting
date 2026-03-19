import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

interface ToastRecord {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  addToast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, tone: ToastTone = 'info'): void => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current, { id, message, tone }]);

      window.setTimeout(() => {
        removeToast(id);
      }, 3600);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <aside className="toast-viewport" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <p>{toast.message}</p>
            <button type="button" className="btn btn-quiet" onClick={() => removeToast(toast.id)}>
              Dismiss
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}
