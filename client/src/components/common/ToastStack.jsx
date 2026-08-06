"use client";

import React from 'react';
import { useUIStore } from '../../store/useUIStore';

const TOAST_VARIANTS = {
  success: {
    icon: 'check_circle',
    chipBg: 'bg-green-100',
    chipText: 'text-green-700',
    ring: 'ring-green-200',
    bar: 'bg-green-600',
  },
  error: {
    icon: 'error',
    chipBg: 'bg-red-100',
    chipText: 'text-red-700',
    ring: 'ring-red-200',
    bar: 'bg-red-600',
  },
  warning: {
    icon: 'warning',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-700',
    ring: 'ring-amber-200',
    bar: 'bg-amber-500',
  },
  info: {
    icon: 'info',
    chipBg: 'bg-[#f3ede8]',
    chipText: 'text-[#5e3f3a]',
    ring: 'ring-[#e8bdb6]',
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
            className={`pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-xl bg-surface-container-lowest p-3 pr-2 shadow-lg ring-1 sm:w-auto sm:max-w-sm ${variant.ring} ${toast.leaving ? 'toast-out' : 'toast-in'}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${variant.chipBg}`}>
              <span className={`material-symbols-outlined text-[16px] ${variant.chipText}`}>{variant.icon}</span>
            </span>
            <span className="flex-1 text-sm font-medium leading-snug text-on-surface">
              {toast.message}
            </span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
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
