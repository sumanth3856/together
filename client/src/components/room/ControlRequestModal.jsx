import React from 'react';
import { Key, CheckCircle, XCircle, Zap } from 'lucide-react';

export function ControlRequestModal({ requestNotice, onRespond }) {
  if (!requestNotice) return null;

  return (
    <div className="toast-container" style={{ maxWidth: '340px' }}>
      <div style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(245,158,11,0.08)',
        animation: 'slideInRight 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Icon */}
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Key size={18} color="var(--accent-amber)" />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-amber)', marginBottom: '4px' }}>
              Control Request
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{requestNotice.nickname}</strong>
              {' '}wants playback control.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn btn-success"
                onClick={() => onRespond(requestNotice.socketId, true)}
                style={{ flex: 1, minHeight: '36px', fontSize: '0.82rem' }}
              >
                <CheckCircle size={13} />
                <span>Grant</span>
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onRespond(requestNotice.socketId, false)}
                style={{ flex: 1, minHeight: '36px', fontSize: '0.82rem' }}
              >
                <XCircle size={13} />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
