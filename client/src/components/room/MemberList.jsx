import React, { memo, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { useSocket } from '../../hooks/useSocket';

export const MemberList = memo(function MemberList({ members = [], currentSocketId }) {
  const roomState = useRoomStore((s) => s.roomState);
  const { kickUser, transferHost, sendReaction } = useSocket();
  const hostId = roomState?.hostId;
  
  const [openMenu, setOpenMenu] = useState(null); // { userId, placement: 'bottom' | 'top' }

  const handleToggleMenu = (userId, e) => {
    e.stopPropagation();
    if (openMenu?.userId === userId) {
      setOpenMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 300;
    const placement = spaceBelow < 220 ? 'top' : 'bottom';
    setOpenMenu({ userId, placement });
  };

  const handleCopyNickname = (nickname) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(nickname);
      useUIStore.getState().setToastNotification({
        type: 'info',
        message: `Copied "${nickname}" to clipboard`
      });
    }
    setOpenMenu(null);
  };

  const handleWave = (nickname) => {
    if (sendReaction) {
      sendReaction('👋');
      useUIStore.getState().setToastNotification({
        type: 'info',
        message: `Waved to ${nickname} 👋`
      });
    }
    setOpenMenu(null);
  };

  const handleTransferHost = (userId, nickname) => {
    if (transferHost) {
      transferHost(userId);
      useUIStore.getState().setToastNotification({
        type: 'success',
        message: `Made ${nickname} the room host.`
      });
    }
    setOpenMenu(null);
  };

  const handleKickUser = (userId, nickname) => {
    if (kickUser) {
      kickUser(userId);
      useUIStore.getState().setToastNotification({
        type: 'info',
        message: `Removed ${nickname} from the room.`
      });
    }
    setOpenMenu(null);
  };

  return (
    <div className="bg-surface-container rounded-3xl border border-outline-variant shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <span className="font-headline-md text-lg text-on-background">Watching Together</span>
        </div>
        <span className="chip bg-success/10 border border-success/20 text-success text-[11px] uppercase tracking-wider">
          {members.length} online
        </span>
      </div>

      {/* Member List */}
      <div className="p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar max-h-[360px] relative rounded-b-3xl">
        {/* Click outside backdrop when any menu is open */}
        {openMenu && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setOpenMenu(null)}
            aria-hidden="true"
          />
        )}

        {members.map((m) => {
          const isYou = m.socketIds && m.socketIds.includes(currentSocketId);
          const isHost = m.userId === hostId;
          const iAmHost = members.find(mem => mem.socketIds?.includes(currentSocketId))?.userId === hostId;
          const initial = m.nickname ? m.nickname.charAt(0).toUpperCase() : '?';
          const isMenuOpen = openMenu?.userId === m.userId;
          const menuPlacement = openMenu?.placement || 'bottom';

          return (
            <div
              key={m.userId}
              className={`flex items-center gap-4 p-3 rounded-2xl relative transition-all duration-200 ${isYou ? 'bg-primary-container/20 border border-primary-container/50 shadow-soft' : 'hover:bg-surface-container-high hover:-translate-y-px border border-transparent'} `}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {m.avatar ? (
                  <img src={m.avatar} alt="Avatar" loading="lazy" className="w-10 h-10 rounded-full border border-outline-variant" />
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
                  <span className="font-label-lg text-sm sm:text-base text-on-background truncate">
                    {m.nickname}
                  </span>
                  {isYou && (
                    <span className="text-xs text-primary font-label-sm tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded-sm font-semibold">(You)</span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-body-md text-on-surface-variant">
                  {isHost ? 'Host' : 'Viewer'}
                </span>
              </div>

              {/* Member Actions (3 dots menu) */}
              {!isYou && (
                <div className="relative">
                  <button
                    onClick={(e) => handleToggleMenu(m.userId, e)}
                    className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-background'}`}
                    title={`Actions for ${m.nickname}`}
                    aria-label={`Actions for ${m.nickname}`}
                    aria-expanded={isMenuOpen}
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>

                  {isMenuOpen && (
                    <div
                      className={`absolute right-0 z-40 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-48 py-1.5 flex flex-col animate-fade-in divide-y divide-outline-variant/30 ${menuPlacement === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        <button 
                          onClick={() => handleWave(m.nickname)}
                          className="w-full text-left px-3.5 py-2 font-label-md text-xs sm:text-sm text-on-background hover:bg-surface-container-high transition-colors flex items-center gap-2.5"
                        >
                          <span className="text-[16px]">👋</span> Send Wave
                        </button>
                        <button 
                          onClick={() => handleCopyNickname(m.nickname)}
                          className="w-full text-left px-3.5 py-2 font-label-md text-xs sm:text-sm text-on-background hover:bg-surface-container-high transition-colors flex items-center gap-2.5"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">content_copy</span> Copy Nickname
                        </button>
                      </div>

                      {iAmHost && (
                        <div className="py-1">
                          <button 
                            onClick={() => handleTransferHost(m.userId, m.nickname)}
                            className="w-full text-left px-3.5 py-2 font-label-md text-xs sm:text-sm text-primary hover:bg-primary-container/20 transition-colors flex items-center gap-2.5"
                          >
                            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Make Host
                          </button>
                          <button 
                            onClick={() => handleKickUser(m.userId, m.nickname)}
                            className="w-full text-left px-3.5 py-2 font-label-md text-xs sm:text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2.5"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_remove</span> Kick from Room
                          </button>
                        </div>
                      )}
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
