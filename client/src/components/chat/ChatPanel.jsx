import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Crown, Key, Radio } from 'lucide-react';
import { EmojiReactions } from './EmojiReactions';

export function ChatPanel({ chatHistory = [], currentSocketId, incomingReaction, onSendMessage, onSendReaction }) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getAvatarLetter = (name) => {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  };

  return (
    <div 
      className="panel" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 'calc(100vh - 120px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Floating Emoji Particles Container */}
      <EmojiReactions 
        incomingReaction={incomingReaction} 
        onSendReaction={onSendReaction} 
      />

      {/* Header */}
      <div 
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-input)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Room Chat</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chatHistory.length} messages</span>
      </div>

      {/* Message Stream */}
      <div 
        className="scroll-y"
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {chatHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Radio size={28} color="var(--text-tertiary)" style={{ marginBottom: '10px' }} />
            <p>No messages yet. Say hi to start watching!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div 
                  key={msg.id} 
                  style={{
                    textAlign: 'center',
                    margin: '8px 0',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}>
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isSelf = msg.socketId === currentSocketId;
            const showAvatar = !isSelf;

            return (
              <div 
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'flex-end',
                  alignSelf: isSelf ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {/* Other User Avatar */}
                {showAvatar && (
                  <div 
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      background: msg.color || 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      color: '#fff',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {getAvatarLetter(msg.sender)}
                  </div>
                )}

                {/* Message Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                  {!isSelf && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingLeft: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: msg.color || 'var(--text-secondary)' }}>
                        {msg.sender}
                      </span>
                      {msg.isHost && <Crown size={12} color="#f59e0b" />}
                      {msg.hasControl && <Key size={11} color="#10b981" />}
                    </div>
                  )}
                  <div 
                    style={{
                      background: isSelf ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      border: isSelf ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '10px 14px',
                      borderRadius: isSelf ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '0.9rem',
                      wordBreak: 'break-word',
                      color: isSelf ? '#fff' : 'var(--text-primary)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px', padding: '0 4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-input)'
        }}
      >
        <input 
          type="text"
          className="input-field"
          placeholder="Send a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ minHeight: '38px', fontSize: '0.85rem' }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!inputText.trim()}
          style={{ minHeight: '38px', padding: '0 12px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
