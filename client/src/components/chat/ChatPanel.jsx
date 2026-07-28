import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Crown, Key, Radio } from 'lucide-react';
import { EmojiReactions } from './EmojiReactions';

export function ChatPanel({ chatHistory = [], incomingReaction, onSendMessage, onSendReaction }) {
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
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-input)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Room Chat</h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{chatHistory.length} messages</span>
      </div>

      {/* Message Stream */}
      <div 
        style={{
          flex: 1,
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {chatHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Radio size={24} color="var(--text-tertiary)" style={{ marginBottom: '6px' }} />
            <p>No messages yet. Say hi to start watching!</p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            if (msg.isSystem) {
              return (
                <div 
                  key={msg.id} 
                  style={{
                    textAlign: 'center',
                    margin: '2px 0',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-input)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span>{msg.text}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                {/* User Avatar */}
                <div 
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: msg.color || 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  {getAvatarLetter(msg.sender)}
                </div>

                {/* Message Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: msg.color || 'var(--text-primary)' }}>
                      {msg.sender}
                    </span>
                    {msg.isHost && <Crown size={12} color="#f59e0b" />}
                    {msg.hasControl && <Key size={11} color="#10b981" />}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      padding: '7px 10px',
                      borderRadius: '0 8px 8px 8px',
                      fontSize: '0.85rem',
                      wordBreak: 'break-word',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {msg.text}
                  </div>
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
