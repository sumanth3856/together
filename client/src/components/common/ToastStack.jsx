"use client";

import React from 'react';
import { useUIStore } from '../../store/useUIStore';

const TOAST_VARIANTS = {
  success: {
    icon: 'check_circle',
    chipBg: 'bg-success/15',
    chipText: 'text-success',
    borderColor: 'border-success/30',
    bar: 'bg-success',
  },
  error: {
    icon: 'error',
    chipBg: 'bg-error/15',
    chipText: 'text-error',
    borderColor: 'border-error/30',
    bar: 'bg-error',
  },
  warning: {
    icon: 'warning',
    chipBg: 'bg-amber-500/15',
    chipText: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    bar: 'bg-amber-500',
  },
  info: {
    icon: 'info',
    chipBg: 'bg-primary/15',
    chipText: 'text-primary',
    borderColor: 'border-outline',
    bar: 'bg-primary',
  },
  chat: {
    icon: 'chat_bubble',
    chipBg: 'bg-primary/15',
    chipText: 'text-primary',
    borderColor: 'border-outline',
    bar: 'bg-primary',
  },
};

export function ToastStack({ top = '16px' }) {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ top }}
      className="fixed left-4 right-4 z-[10000] flex flex-col items-stretch gap-2 pointer-events-none sm:left-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => {
        const variant = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info;
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-surface-container border ${variant.borderColor} p-3 pr-2 shadow-2xl sm:w-auto sm:max-w-sm ${toast.leaving ? 'toast-out' : 'toast-in'}`}
          >
            {toast.avatar ? (
              <img
                src={toast.avatar}
                alt={toast.title || 'Sender'}
                className="w-8 h-8 rounded-full border border-outline object-cover shrink-0"
              />
            ) : (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${variant.chipBg}`}>
                <span className={`material-symbols-outlined text-[16px] ${variant.chipText}`}>{variant.icon}</span>
              </span>
            )}
            {toast.title ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-background truncate leading-tight">{toast.title}</p>
                <p className="text-sm font-medium leading-snug text-on-surface truncate">
                  {toast.message}
                </p>
              </div>
            ) : (
              <span className="flex-1 text-sm font-medium leading-snug text-on-surface truncate">
                {toast.message}
              </span>
            )}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
            {!toast.leaving && (
              <span aria-hidden="true" className={`absolute bottom-0 left-0 h-0.5 ${variant.bar} toast-progress`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
