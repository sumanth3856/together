import React, { memo, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { useSocket } from '../../hooks/useSocket';

export const MemberList = memo(function MemberList({ members = [], currentSocketId }) {
  const hostId = useRoomStore((s) => s.roomState?.hostId);
  const { kickUser, transferHost, sendReaction } = useSocket();
  
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
    <div className="bg-surface-container/90 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-outline-variant/60 shadow-card flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest/80 rounded-t-2xl md:rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-container text-tertiary flex items-center justify-center shrink-0 shadow-soft">
             <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <span className="font-display-lg text-lg sm:text-xl font-bold text-on-background">Watching Together</span>
        </div>
        <span className="chip bg-success-container border border-success/30 text-success text-[11px] uppercase tracking-wider">
          {members.length} online
        </span>
      </div>

      {/* Member List */}
      <div className="p-3 sm:p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar md:max-h-[380px] relative rounded-b-2xl md:rounded-b-3xl">
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
              style={{ zIndex: isMenuOpen ? 50 : 1 }}
              className={`flex items-center gap-3.5 p-3 rounded-2xl relative transition-all duration-200 ${isYou ? 'bg-surface-container-lowest/80 border border-outline-variant ring-1 ring-primary/30 shadow-soft' : 'bg-surface-container-highest/30 hover:bg-surface-container-highest/70 border border-outline-variant/40 hover:-translate-y-px'} `}
            >
              {/* Avatar */}
              <div className="shrink-0 relative">
                {m.avatar ? (
                  <img 
                    src={m.avatar} 
                    alt={m.nickname || 'Member'} 
                    loading="lazy" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.member-avatar-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    className="w-10 h-10 rounded-full border border-outline-variant/60 object-cover shadow-2xs" 
                  />
                ) : null}
                <div 
                  style={{ display: m.avatar ? 'none' : 'flex' }}
                  className={`member-avatar-fallback w-10 h-10 rounded-full items-center justify-center font-bold shadow-soft ${isYou ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface border border-outline-variant/60'}`}
                >
                  {initial}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  {isHost && (
                    <span className="material-symbols-outlined text-[15px] text-primary" title="Room Host" aria-label="Room Host">
                      star
                    </span>
                  )}
                  <span className="text-sm sm:text-base text-on-surface font-semibold truncate">
                    {m.nickname}
                  </span>
                  {isYou && (
                    <span className="text-[10px] sm:text-[11px] text-primary font-bold tracking-wider uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      (You)
                    </span>
                  )}
                </div>
                <span className="text-xs text-on-surface-muted">
                  {isHost ? 'Room Host' : 'Viewer'}
                </span>
              </div>

              {/* Member Actions (3 dots menu) */}
              {!isYou && (
                <div className="relative">
                  <button
                    onClick={(e) => handleToggleMenu(m.userId, e)}
                    className={`p-2 rounded-xl transition-colors ${isMenuOpen ? 'bg-primary/10 text-primary' : 'text-on-surface-muted hover:bg-surface-container-highest hover:text-on-surface active:scale-95'}`}
                    title={`Actions for ${m.nickname}`}
                    aria-label={`Actions for ${m.nickname}`}
                    aria-expanded={isMenuOpen}
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>

                  {isMenuOpen && (
                    <div
                      className={`absolute right-0 z-40 bg-surface-container/98 backdrop-blur-xl border border-outline-variant rounded-2xl shadow-lift w-60 sm:w-64 p-2 flex flex-col gap-1 animate-scale-in ${menuPlacement === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Mini Member Profile Header */}
                      <div className="flex items-center gap-2.5 p-2 bg-surface-container-lowest/70 rounded-xl border border-outline-variant/40 mb-0.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                            {m.nickname}
                          </div>
                          <div className="text-[11px] text-on-surface-muted flex items-center gap-1 font-medium">
                            {isHost ? 'Room Host' : 'Viewer'}
                          </div>
                        </div>
                      </div>

                      {/* Social & Utility Actions */}
                      <div className="flex flex-col gap-0.5">
                        <button 
                          onClick={() => handleWave(m.nickname)}
                          title={`Send a wave to ${m.nickname}`}
                          aria-label={`Send a wave to ${m.nickname}`}
                          className="w-full text-left p-2 rounded-xl text-xs sm:text-sm text-on-surface hover:bg-surface-container-highest transition-all flex items-center gap-2.5 group active:scale-[0.98]"
                        >
                          <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-sm group-hover:scale-110 transition-transform shrink-0 shadow-2xs">
                            👋
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-on-surface">Send Wave</span>
                            <span className="text-[10px] text-on-surface-muted">Send a quick hello</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => handleCopyNickname(m.nickname)}
                          className="w-full text-left p-2 rounded-xl text-xs sm:text-sm text-on-surface hover:bg-surface-container-lowest transition-all flex items-center gap-2.5 group active:scale-[0.98]"
                        >
                          <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-muted group-hover:text-primary group-hover:scale-110 transition-transform shrink-0 shadow-2xs">
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-on-surface">Copy Nickname</span>
                            <span className="text-[10px] text-on-surface-muted">Copy to clipboard</span>
                          </div>
                        </button>
                      </div>

                      {/* Host-only Controls */}
                      {iAmHost && (
                        <>
                          <div className="h-px bg-outline-variant/40 my-0.5" />
                          <div className="px-2 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted">
                            Host Actions
                          </div>
                          
                          <div className="flex flex-col gap-0.5">
                            <button 
                              onClick={() => handleTransferHost(m.userId, m.nickname)}
                              className="w-full text-left p-2 rounded-xl text-xs sm:text-sm text-primary hover:bg-primary/10 transition-all flex items-center gap-2.5 group active:scale-[0.98]"
                            >
                              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-primary">Make Host</span>
                                <span className="text-[10px] text-on-surface-muted">Transfer room leadership</span>
                              </div>
                            </button>

                            <button 
                              onClick={() => handleKickUser(m.userId, m.nickname)}
                              className="w-full text-left p-2 rounded-xl text-xs sm:text-sm text-error hover:bg-error/10 transition-all flex items-center gap-2.5 group active:scale-[0.98]"
                            >
                              <span className="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">person_remove</span>
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-error">Kick from Room</span>
                                <span className="text-[10px] text-on-surface-muted">Remove from session</span>
                              </div>
                            </button>
                          </div>
                        </>
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
