import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export function ConfirmationModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  variant = 'danger' 
}) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle size={28} color="var(--status-danger)" />,
          iconBg: 'rgba(239, 68, 68, 0.1)',
          iconBorder: 'rgba(239, 68, 68, 0.2)',
          buttonClass: 'btn-danger'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={28} color="var(--status-success)" />,
          iconBg: 'rgba(16, 185, 129, 0.1)',
          iconBorder: 'rgba(16, 185, 129, 0.2)',
          buttonClass: 'btn-primary'
        };
      default:
        return {
          icon: <Info size={28} color="var(--accent-primary)" />,
          iconBg: 'var(--accent-primary-dim)',
          iconBorder: 'rgba(1, 69, 242, 0.2)',
          buttonClass: 'btn-primary'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(13, 7, 20, 0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 24px',
        width: '100%', maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeInUp 0.3s ease both',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: styles.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          border: `1px solid ${styles.iconBorder}`
        }}>
          {styles.icon}
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
          {title}
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: '120px', minHeight: '48px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${styles.buttonClass}`}
            style={{ flex: 1, minWidth: '120px', minHeight: '48px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
