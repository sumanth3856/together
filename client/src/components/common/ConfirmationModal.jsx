import React, { useEffect, useRef } from 'react';

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      ></div>

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl border border-outline-variant animate-fade-in-up text-center"
      >
        <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-6 border border-outline-variant/50 shadow-sm`}>
          <span className={`material-symbols-outlined text-[32px] ${styles.iconColor}`}>
            {styles.icon}
          </span>
        </div>
        
        <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-on-background mb-4">
          {title}
        </h2>
        
        <p className="font-body-lg text-on-surface-variant mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3.5 rounded-full font-label-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3.5 rounded-full font-label-lg transition-all shadow-md hover:shadow-lg ${styles.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
