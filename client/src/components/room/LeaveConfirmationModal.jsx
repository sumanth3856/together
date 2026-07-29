import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function LeaveConfirmationModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(255, 255, 255, 0.85)',
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
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertTriangle size={28} color="var(--status-danger)" />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Leave Room?
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
          Are you sure you want to leave? Your connection will be lost.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: '120px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
            style={{ flex: 1, minWidth: '120px' }}
          >
            Leave Surely
          </button>
        </div>
      </div>
    </div>
  );
}
