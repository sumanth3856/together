import React from 'react';

export function MobileTabBar({ activeTab, onSelectTab, memberCount, chatCount }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-around px-2 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}
    >
      <button 
        className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${activeTab === 'video' ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
        onClick={() => onSelectTab('video')}
      >
        <span className={`material-symbols-outlined text-[24px] ${activeTab === 'video' ? 'fill-1' : ''}`}>movie</span>
        <span className="font-label-sm text-[10px] mt-1">Video</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center w-20 h-full relative transition-colors ${activeTab === 'chat' ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
        onClick={() => onSelectTab('chat')}
      >
        <span className={`material-symbols-outlined text-[24px] ${activeTab === 'chat' ? 'fill-1' : ''}`}>chat_bubble</span>
        <span className="font-label-sm text-[10px] mt-1">Chat</span>
        {chatCount > 0 && (
          <span className="absolute top-1 right-3 bg-error text-on-error text-[9px] font-label-lg w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
            {chatCount > 99 ? '99+' : chatCount}
          </span>
        )}
      </button>

      <button 
        className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${activeTab === 'members' ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
        onClick={() => onSelectTab('members')}
      >
        <span className={`material-symbols-outlined text-[24px] ${activeTab === 'members' ? 'fill-1' : ''}`}>groups</span>
        <span className="font-label-sm text-[10px] mt-1">Guests ({memberCount})</span>
      </button>
    </nav>
  );
}
