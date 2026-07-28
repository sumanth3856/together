import React from 'react';
import { Users, Crown, Key, Check, X } from 'lucide-react';

export function MemberList({
  members = [],
  currentSocketId,
  isHost,
  onGrantControl,
  onRevokeControl
}) {
  const getAvatarLetter = (name) => {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="panel" style={{ marginTop: '16px', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Room Guests</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{members.length} Connected</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {members.map((m) => {
          const isYou = m.socketId === currentSocketId;

          return (
            <div
              key={m.socketId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: isYou ? 'rgba(88, 80, 236, 0.12)' : 'var(--bg-input)',
                border: isYou ? '1px solid rgba(88, 80, 236, 0.3)' : '1px solid var(--border-subtle)'
              }}
            >
              {/* Member Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: m.isHost ? '#d97706' : (m.color || 'var(--accent-primary)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: '#fff',
                    fontSize: '0.82rem'
                  }}
                >
                  {getAvatarLetter(m.nickname)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {m.nickname} {isYou && <span style={{ color: 'var(--accent-primary)', fontSize: '0.72rem' }}>(You)</span>}
                    </span>
                    {m.isHost && <Crown size={13} color="#f59e0b" />}
                    {m.hasControl && !m.isHost && <Key size={12} color="#10b981" />}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {m.isHost ? 'Room Owner' : m.hasControl ? 'Control Granted' : 'Guest'}
                  </span>
                </div>
              </div>

              {/* Host Actions */}
              {isHost && !m.isHost && (
                <div>
                  {m.hasControl ? (
                    <button
                      onClick={() => onRevokeControl(m.socketId)}
                      className="btn btn-ghost"
                      style={{ minHeight: '30px', padding: '0 8px', fontSize: '0.72rem', color: '#ef4444' }}
                      title="Revoke control permission"
                    >
                      <X size={13} />
                      <span>Revoke</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onGrantControl(m.socketId, true)}
                      className="btn btn-secondary"
                      style={{ minHeight: '30px', padding: '0 8px', fontSize: '0.72rem', borderColor: '#10b981', color: '#34d399' }}
                      title="Grant playback control"
                    >
                      <Check size={13} />
                      <span>Grant Control</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
