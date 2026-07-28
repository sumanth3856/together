import React from 'react';
import { Key, CheckCircle, XCircle } from 'lucide-react';

export function ControlRequestModal({ requestNotice, onRespond }) {
  if (!requestNotice) return null;

  return (
    <div className="toast-container">
      <div 
        className="panel" 
        style={{
          padding: '16px 18px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: '#121620'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div 
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              color: '#fbbf24',
              flexShrink: 0
            }}
          >
            <Key size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fbbf24' }}>
              Control Request
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <strong style={{ color: '#fff' }}>{requestNotice.nickname}</strong> wants playback control permission.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => onRespond(requestNotice.socketId, true)}
                style={{ flex: 1, background: '#10b981', minHeight: '36px', fontSize: '0.82rem' }}
              >
                <CheckCircle size={14} /> Grant
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => onRespond(requestNotice.socketId, false)}
                style={{ flex: 1, minHeight: '36px', fontSize: '0.82rem' }}
              >
                <XCircle size={14} /> Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
