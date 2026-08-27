import React from 'react';

export function MobileTabBar({ activeTab, onSelectTab, memberCount, chatCount }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/60 flex items-center justify-around px-3 z-50 md:hidden shadow-lift"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}
    >
      <button 
        className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 active:scale-95 ${activeTab === 'video' ? 'text-primary bg-primary/10' : 'text-on-surface-muted hover:text-on-surface'}`}
        onClick={() => onSelectTab('video')}
        title="Video and Queue"
        aria-label="Video tab"
      >
        <span className={`material-symbols-outlined text-[22px] ${activeTab === 'video' ? 'fill-1' : ''}`}>movie</span>
        <span className="text-xs font-semibold mt-0.5 tracking-wide">Video</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl relative transition-all duration-200 active:scale-95 ${activeTab === 'chat' ? 'text-primary bg-primary/10' : 'text-on-surface-muted hover:text-on-surface'}`}
        onClick={() => onSelectTab('chat')}
        title="Moments and Reactions Chat"
        aria-label="Chat moments tab"
      >
        <div className="relative flex items-center justify-center">
          <span className={`material-symbols-outlined text-[22px] ${activeTab === 'chat' ? 'fill-1' : ''}`}>chat_bubble</span>
          {chatCount > 0 && (
            <span className="absolute -top-1.5 -right-3 bg-primary text-on-primary text-[11px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-soft tabular-nums border border-surface-container-lowest">
              {chatCount > 99 ? '99+' : chatCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold mt-0.5 tracking-wide">Chat</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 active:scale-95 ${activeTab === 'members' ? 'text-primary bg-primary/10' : 'text-on-surface-muted hover:text-on-surface'}`}
        onClick={() => onSelectTab('members')}
        title="Room Members and Details"
        aria-label="Members tab"
      >
        <span className={`material-symbols-outlined text-[22px] ${activeTab === 'members' ? 'fill-1' : ''}`}>groups</span>
        <span className="text-xs font-semibold mt-0.5 tracking-wide">Guests ({memberCount})</span>
      </button>
    </nav>
  );
}
