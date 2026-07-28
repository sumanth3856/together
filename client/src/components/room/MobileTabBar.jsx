import React from 'react';
import { Tv, MessageSquare, Users, Youtube } from 'lucide-react';

export function MobileTabBar({ activeTab, onSelectTab, memberCount, chatCount }) {
  return (
    <nav className="mobile-tab-bar">
      <button 
        className={`mobile-tab-item ${activeTab === 'video' ? 'active' : ''}`}
        onClick={() => onSelectTab('video')}
      >
        <Tv size={20} />
        <span>Video</span>
      </button>

      <button 
        className={`mobile-tab-item ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onSelectTab('chat')}
        style={{ position: 'relative' }}
      >
        <MessageSquare size={20} />
        <span>Chat</span>
        {chatCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '6px',
              right: 'calc(50% - 16px)',
              background: 'var(--accent-tertiary)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {chatCount}
          </span>
        )}
      </button>

      <button 
        className={`mobile-tab-item ${activeTab === 'members' ? 'active' : ''}`}
        onClick={() => onSelectTab('members')}
      >
        <Users size={20} />
        <span>Guests ({memberCount})</span>
      </button>

      <button 
        className={`mobile-tab-item ${activeTab === 'queue' ? 'active' : ''}`}
        onClick={() => onSelectTab('queue')}
      >
        <Youtube size={20} />
        <span>Queue</span>
      </button>
    </nav>
  );
}
