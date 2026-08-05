import React, { memo, useState } from 'react';
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
    <div className="bg-surface-container rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <span className="font-headline-md text-lg text-on-background">Watching Together</span>
        </div>
        <span className="bg-success/10 border border-success/20 text-success px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wider">
          {members.length} online
        </span>
      </div>

      {/* Member List */}
      <div className="p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar max-h-[300px]">
        {members.map((m) => {
          const isYou = m.socketIds && m.socketIds.includes(currentSocketId);
          const isHost = m.userId === hostId;
          const iAmHost = members.find(mem => mem.socketIds?.includes(currentSocketId))?.userId === hostId;
          const initial = m.nickname ? m.nickname.charAt(0).toUpperCase() : '?';

          return (
            <div
              key={m.userId}
              className={`flex items-center gap-4 p-3 rounded-2xl relative ${isYou ? 'bg-primary-container/20 border border-primary-container/50' : 'hover:bg-surface-container-high border border-transparent'} transition-colors`}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {m.avatar ? (
                  <img src={m.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-outline-variant" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-display-md shadow-sm">
                    {initial}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  {isHost && <span className="material-symbols-outlined text-[16px] text-primary" title="Host">star</span>}
                  <span className="font-label-lg text-on-background truncate">
                    {m.nickname}
                  </span>
                  {isYou && (
                    <span className="text-[10px] text-primary font-label-sm tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-sm">(You)</span>
                  )}
                </div>
                <span className="text-xs font-body-md text-on-surface-variant">
                  {isHost ? 'Host' : 'Viewer'}
                </span>
              </div>

              {/* Host Controls */}
              {iAmHost && !isYou && (
                <div>
                  <button onClick={() => toggleMenu(m.userId)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-background transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                  {openMenuId === m.userId && (
                    <div className="absolute right-4 top-12 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-10 w-48 py-2 animate-fade-in-up">
                      <button 
                        onClick={() => { transferHost(m.userId); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 font-label-md text-on-background hover:bg-surface-container-high transition-colors flex items-center gap-2"
                      >
                         <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Make Host
                      </button>
                      <button 
                        onClick={() => { kickUser(m.userId); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 font-label-md text-error hover:bg-error/10 transition-colors flex items-center gap-2 mt-1"
                      >
                         <span className="material-symbols-outlined text-[18px]">person_remove</span> Kick from Room
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
