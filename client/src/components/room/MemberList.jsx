import React from 'react';
import { Users, Crown, Key, Check, X, UserCheck } from 'lucide-react';

export function MemberList({ members = [], currentSocketId, isHost, onGrantControl, onRevokeControl }) {
  const getAvatarLetter = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="panel" style={{ marginTop: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserCheck size={14} color="var(--accent-cyan)" />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>Watching Together</span>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: '600',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.18)',
          color: 'var(--status-success)'
        }}>
          {members.length} online
        </span>
      </div>

      {/* Member List */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {members.map((m) => {
          const isYou = m.socketId === currentSocketId;

          return (
            <div
              key={m.socketId}
              className={`member-row${isYou ? ' you' : ''}`}
            >
              {/* Avatar */}
              <div
                className="avatar"
                style={{
                  width: '34px', height: '34px',
                  background: m.isHost
                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                    : (m.color || 'var(--accent-primary)'),
                  fontSize: '0.85rem',
                  boxShadow: isYou ? `0 2px 8px ${m.color || 'rgba(99,102,241,0.5)'}60` : 'none',
                }}
              >
                {getAvatarLetter(m.nickname)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.84rem', fontWeight: '700',
                    color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {m.nickname}
                  </span>
                  {isYou && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: '700' }}>(You)</span>
                  )}
                  {m.isHost && <Crown size={11} color="var(--accent-amber)" />}
                  {m.hasControl && !m.isHost && <Key size={10} color="var(--accent-emerald)" />}
                </div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                  {m.isHost ? '👑 Room Host' : m.hasControl ? '🎮 Has Control' : 'Viewer'}
                </span>
              </div>

              {/* Host Controls */}
              {isHost && !m.isHost && (
                m.hasControl ? (
                  <button
                    onClick={() => onRevokeControl(m.socketId)}
                    className="btn btn-danger"
                    style={{ minHeight: '28px', padding: '0 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)' }}
                    title="Revoke control"
                  >
                    <X size={12} />
                    <span>Revoke</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onGrantControl(m.socketId, true)}
                    className="btn btn-success"
                    style={{ minHeight: '28px', padding: '0 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)' }}
                    title="Grant control"
                  >
                    <Check size={12} />
                    <span>Grant</span>
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
