import React, { useState, useRef, useEffect, memo } from 'react';
import { MessageSquare, Send, Crown, Key, Hash } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Avatar from 'boring-avatars';
import { EmojiReactions } from './EmojiReactions';

export const ChatPanel = memo(function ChatPanel({ chatHistory = [], incomingReaction, onSendMessage, onSendReaction }) {
  const [inputText, setInputText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: chatHistory.length,
    getScrollElement: () => chatContainerRef.current,
    estimateSize: () => 65,
    overscan: 10,
  });

  // Track keyboard height via Visual Viewport API so the fixed input
  // lifts above the software keyboard on mobile browsers.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const TAB_BAR_HEIGHT = 60;

    const onViewportResize = () => {
      const vv = window.visualViewport;
      // keyboard offset = how much the viewport has shrunk from the bottom
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      setKeyboardOffset(keyboardHeight);

      // When keyboard opens, ensure latest message stays visible
      if (keyboardHeight > 0 && chatContainerRef.current && chatHistory.length > 0) {
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(chatHistory.length - 1, { align: 'end' });
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', onViewportResize);
    window.visualViewport.addEventListener('scroll', onViewportResize);
    return () => {
      window.visualViewport.removeEventListener('resize', onViewportResize);
      window.visualViewport.removeEventListener('scroll', onViewportResize);
    };
  }, [chatHistory.length, rowVirtualizer]);

  useEffect(() => {
    if (chatContainerRef.current && chatHistory.length > 0) {
      rowVirtualizer.scrollToIndex(chatHistory.length - 1, { align: 'end' });
    }
  }, [chatHistory, rowVirtualizer]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Height of the docked input bar (approx 62px) + tab bar (60px) + buffer
  const INPUT_DOCK_HEIGHT = 62;
  const TAB_BAR_H = 60;
  // When keyboard is open: input sits just above keyboard; messages need bottom padding for input only
  // When keyboard is closed: input sits above tab bar
  const formBottom = keyboardOffset > 0
    ? keyboardOffset
    : TAB_BAR_H;
  const scrollPaddingBottom = INPUT_DOCK_HEIGHT + (keyboardOffset > 0 ? keyboardOffset : TAB_BAR_H) + 8;

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 'calc(100vh - 116px)',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        '--chat-form-bottom': `${formBottom}px`,
        '--chat-scroll-padding': `${scrollPaddingBottom}px`,
      }}
    >
      {/* Floating Emoji Particles */}
      <EmojiReactions incomingReaction={incomingReaction} onSendReaction={onSendReaction} />

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--bg-surface-2)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary-dim)',
            border: '1px solid rgba(99,102,241,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Hash size={14} color="var(--accent-primary)" />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>Live Chat</span>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: '600',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '2px 8px'
        }}>
          {chatHistory.length} msgs
        </span>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="scroll-area chat-messages-scroll-area"
        style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}
      >
        {chatHistory.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.6 }}>💬</div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>No messages yet.<br />Be the first to say hi!</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const msg = chatHistory[virtualRow.index];

              if (msg.isSystem) {
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'flex', justifyContent: 'center',
                      padding: '4px 0'
                    }}
                  >
                    <span className="chat-system-pill">{msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '6px 0'
                  }}
                >
                  {/* Avatar */}
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <Avatar
                      size={28}
                      name={msg.sender}
                      variant="beam"
                      colors={['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b']}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: '700',
                        color: msg.color || 'var(--text-primary)',
                      }}>
                        {msg.sender}
                      </span>
                      {msg.isHost && <Crown size={11} color="var(--accent-amber)" title="Host" />}
                      {msg.hasControl && !msg.isHost && <Key size={10} color="var(--accent-emerald)" title="Has Control" />}
                      <span style={{ fontSize: '0.63rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="chat-bubble">{msg.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="chat-input-form"
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
          background: 'var(--bg-surface-2)',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          placeholder="Type a message…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          aria-label="Chat message input"
          style={{ minHeight: '38px', fontSize: '0.875rem', flex: 1, background: 'var(--bg-input)' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputText.trim()}
          aria-label="Send message"
          style={{ minHeight: '38px', width: '38px', padding: 0, borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
});
