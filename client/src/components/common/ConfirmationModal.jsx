import React, { useEffect, useRef } from 'react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export function ConfirmationModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  variant = 'danger' 
}) {
  const modalRef = useRef(null);

  useLockBodyScroll(true);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'warning',
          iconBg: 'bg-error-container',
          iconColor: 'text-error',
          buttonClass: 'bg-error hover:bg-error/90 text-on-error',
        };
      case 'success':
        return {
          icon: 'check_circle',
          iconBg: 'bg-primary-container',
          iconColor: 'text-primary',
          buttonClass: 'bg-primary hover:bg-surface-tint text-on-primary',
        };
      default:
        return {
          icon: 'info',
          iconBg: 'bg-surface-container-highest',
          iconColor: 'text-primary',
          buttonClass: 'bg-primary hover:bg-surface-tint text-on-primary',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 modal-backdrop animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-surface-container/98 backdrop-blur-2xl rounded-3xl p-8 shadow-cinema border border-outline-variant text-on-surface animate-fade-in-up text-center"
      >
        <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-5 border border-outline-variant/60 shadow-soft`}>
          <span className={`material-symbols-outlined text-[32px] ${styles.iconColor}`}>
            {styles.icon}
          </span>
        </div>
        
        <h2 id="confirmation-modal-title" className="font-display-lg text-2xl sm:text-3xl font-bold text-on-background mb-3">
          {title}
        </h2>
        
        <p className="text-sm sm:text-base text-on-surface-variant mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary flex-1 px-6 py-3 rounded-xl text-sm font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 px-6 py-3 rounded-xl text-sm font-semibold shadow-soft ${styles.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
