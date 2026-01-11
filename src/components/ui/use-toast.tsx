'use client';

import * as React from 'react';

export type ToastActionElement = React.ReactElement

export type ToastVariant = 'default' | 'destructive'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: ToastVariant
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'UPDATE'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS'; id?: string }
  | { type: 'REMOVE'; id?: string }

const TOAST_REMOVE_DELAY = 4000;

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...state].slice(0, 5);
    case 'UPDATE':
      return state.map(t => (t.id === action.toast.id ? { ...t, ...action.toast } : t));
    case 'DISMISS':
      return state.filter(t => t.id !== action.id);
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}

type ToastContextValue = {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = React.useReducer(reducer, []);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD', toast: { id, ...t } });
    // auto remove
    window.setTimeout(() => dispatch({ type: 'REMOVE', id }), TOAST_REMOVE_DELAY + 200);
    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: 'DISMISS', id });
    window.setTimeout(() => dispatch({ type: 'REMOVE', id }), 200);
  }, []);

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
