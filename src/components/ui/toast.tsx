'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { useToast, type Toast } from './use-toast';
import { cn } from '../../lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitives.Provider duration={4000}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
      <ToastPrimitives.Viewport
        className={cn(
          'fixed bottom-0 right-0 z-50 m-4 flex w-full max-w-sm flex-col gap-2',
          'outline-none',
        )}
      />
    </ToastPrimitives.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const isDestructive = toast.variant === 'destructive';

  return (
    <ToastPrimitives.Root
      className={cn(
        'pointer-events-auto relative grid w-full gap-1 rounded-md border p-4 shadow-lg',
        'bg-background text-foreground',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0',
        isDestructive && 'border-destructive/50 bg-destructive text-destructive-foreground',
      )}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div className="grid gap-1">
        {toast.title ? (
          <ToastPrimitives.Title className="text-sm font-semibold">
            {toast.title}
          </ToastPrimitives.Title>
        ) : null}
        {toast.description ? (
          <ToastPrimitives.Description className="text-sm opacity-90">
            {toast.description}
          </ToastPrimitives.Description>
        ) : null}
      </div>

      {toast.action ? <div className="mt-2">{toast.action}</div> : null}

      <ToastPrimitives.Close
        className="absolute right-2 top-2 rounded-md p-1 text-sm opacity-60 hover:opacity-100 focus:outline-none"
        aria-label="Close"
      >
        ✕
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
}

/** 액션 버튼 스타일 */
export function ToastAction({
  altText,
  children,
  onClick,
}: {
  altText?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      )}
      aria-label={altText}
    >
      {children}
    </button>
  );
}
