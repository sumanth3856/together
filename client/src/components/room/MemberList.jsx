import React, { memo } from 'react';
import { UserCheck } from 'lucide-react';
import Avatar from 'boring-avatars';

export const MemberList = memo(function MemberList({ members = [], currentSocketId }) {

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
            background: 'var(--accent-primary-dim)', border: '1px solid rgba(1,69,242,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserCheck size={14} color="var(--accent-primary)" />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>Watching Together</span>
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
          const isYou = m.socketIds && m.socketIds.includes(currentSocketId);

          return (
            <div
              key={m.userId}
              className={`member-row${isYou ? ' you' : ''}`}
            >
              {/* Avatar */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {m.avatar ? (
                  <img src={m.avatar} alt="Avatar" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                ) : (
                  <Avatar
                    size={34}
                    name={m.nickname}
                    variant="beam"
                    colors={['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b']}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, paddingLeft: '4px' }}>
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
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                  Viewer
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
