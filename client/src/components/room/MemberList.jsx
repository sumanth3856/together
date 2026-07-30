import React, { memo, useState } from 'react';
import { UserCheck, Crown, MoreVertical } from 'lucide-react';
import Avatar from 'boring-avatars';
import { useRoomStore } from '../../store/useRoomStore';
import { useSocket } from '../../hooks/useSocket';

export const MemberList = memo(function MemberList({ members = [], currentSocketId }) {
  const roomState = useRoomStore((s) => s.roomState);
  const { kickUser, transferHost } = useSocket();
  const hostId = roomState?.hostId;
  
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleMenu = (userId) => {
    if (openMenuId === userId) setOpenMenuId(null);
    else setOpenMenuId(userId);
  };

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
          const isHost = m.userId === hostId;
          const iAmHost = members.find(mem => mem.socketIds?.includes(currentSocketId))?.userId === hostId;

          return (
            <div
              key={m.userId}
              className={`member-row${isYou ? ' you' : ''}`}
              style={{ position: 'relative' }}
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
                  {isHost && <Crown size={14} color="#f59e0b" />}
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
                  {isHost ? 'Host' : 'Viewer'}
                </span>
              </div>

              {/* Host Controls */}
              {iAmHost && !isYou && (
                <div>
                  <button onClick={() => toggleMenu(m.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <MoreVertical size={16} />
                  </button>
                  
                  {openMenuId === m.userId && (
                    <div style={{
                      position: 'absolute', right: '10px', top: '40px', background: 'var(--bg-surface-3)',
                      border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '4px',
                      zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <button 
                        onClick={() => { transferHost(m.userId); setOpenMenuId(null); }}
                        style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left', borderRadius: '4px' }}
                        className="btn-hover"
                      >
                        Make Host
                      </button>
                      <button 
                        onClick={() => { kickUser(m.userId); setOpenMenuId(null); }}
                        style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#ef4444', textAlign: 'left', borderRadius: '4px' }}
                        className="btn-hover"
                      >
                        Kick User
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
