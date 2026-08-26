import React, { useState, useRef, useEffect, memo } from 'react';
import { EmojiReactions } from './EmojiReactions';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { useSocket } from '../../hooks/useSocket';

const EMPTY_CHAT = [];

export const ChatPanel = memo(function ChatPanel() {
  const chatHistory = useRoomStore(state => state.roomState?.chatHistory || EMPTY_CHAT);
  const socketId = useRoomStore(state => state.socketId);
  const members = useRoomStore(state => state.roomState?.members);
  const currentMember = members?.find(m => m.socketIds?.includes(socketId));
  const myUserId = currentMember?.userId;
  const incomingReaction = useUIStore(state => state.incomingReaction);
  const { sendChatMessage: onSendMessage, sendReaction: onSendReaction } = useSocket();
  const [inputText, setInputText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const onViewportResize = () => {
      const vv = window.visualViewport;
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      setKeyboardOffset(keyboardHeight);

      if (keyboardHeight > 0) {
        requestAnimationFrame(() => {
          scrollToBottom('auto');
        });
      }
    };

    window.visualViewport.addEventListener('resize', onViewportResize);
    window.visualViewport.addEventListener('scroll', onViewportResize);
    return () => {
      window.visualViewport.removeEventListener('resize', onViewportResize);
      window.visualViewport.removeEventListener('scroll', onViewportResize);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatHistory.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [chatHistory.length]);

  // Scroll to bottom when component mounts
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom('auto');
    });
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Format a timestamp as a relative string ("just now", "2 min ago", etc.)
  const formatRelativeTime = (ts) => {
    if (!ts) return 'just now';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const nonSystemMessageCount = chatHistory.filter(m => !m.isSystem).length;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 max-h-full relative overflow-hidden bg-surface-container/90 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-outline-variant/60 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/50 bg-surface-container-lowest/80 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] fill-1">chat_bubble</span>
          </div>
          <h2 className="font-display-lg text-base sm:text-lg font-bold text-on-background">Moments</h2>
          {nonSystemMessageCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant/60 tabular-nums">
              {nonSystemMessageCount}
            </span>
          )}
        </div>

        {/* Live sync pill badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-container/80 text-success text-[11px] font-bold border border-success/30 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </div>
      </div>

      {/* Emoji Reactions Bar */}
      <EmojiReactions
        onReactionSelect={(emoji) => onSendReaction(emoji)}
        incomingReaction={incomingReaction}
      />

      {/* Message Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 sm:px-4 py-3 space-y-3 overscroll-contain"
        aria-live="polite"
        aria-label="Chat message history"
      >
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-3 text-on-surface-muted shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-on-surface-variant">No moments yet.</p>
            <p className="text-[11px] text-on-surface-muted mt-0.5 max-w-[200px]">Send a reaction or share your thoughts as the video plays!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id || index} className="w-full flex justify-center py-1 animate-fade-in">
                  <span className="bg-surface-container-highest/60 backdrop-blur-xs text-on-surface-variant px-3 py-1 rounded-full text-[11px] sm:text-xs border border-outline-variant/40 shadow-2xs text-center max-w-[85%] break-words leading-tight">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderId === myUserId;

            return (
              <div
                key={msg.id || index}
                className={`w-full flex gap-2.5 py-1 animate-fade-in ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="shrink-0 pt-0.5 relative">
                  {msg.avatar ? (
                    <img 
                      src={msg.avatar} 
                      alt={msg.sender || 'Avatar'} 
                      loading="lazy" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      className="w-8 h-8 rounded-full border border-outline-variant/60 object-cover shadow-2xs" 
                    />
                  ) : null}
                  <div 
                    style={{ display: msg.avatar ? 'none' : 'flex' }}
                    className={`avatar-fallback w-8 h-8 rounded-full items-center justify-center text-xs sm:text-sm font-bold shadow-2xs ${isMe ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface border border-outline-variant/60'}`}
                  >
                    {msg.sender?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col min-w-0 max-w-[78%] sm:max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 px-1 flex-wrap ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold truncate max-w-[130px]">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    {msg.isHost && (
                      <span className="material-symbols-outlined text-[14px] text-primary" title="Room Host">
                        star
                      </span>
                    )}
                    <span className="text-[11px] text-on-surface-muted font-medium" title={new Date(msg.timestamp).toLocaleTimeString()}>
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                  
                  <div 
                    className={`inline-block w-fit px-3.5 py-2 text-sm shadow-soft break-all [overflow-wrap:anywhere] leading-relaxed ${isMe ? 'bg-primary text-on-primary rounded-2xl rounded-tr-xs' : 'bg-surface-container-highest text-on-surface rounded-2xl rounded-tl-xs border border-outline-variant/60'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form — docked flush at bottom of chat panel */}
      <form
        onSubmit={handleSend}
        className="relative p-2.5 sm:p-3 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/60 flex items-center gap-2 shrink-0 z-20 shadow-soft"
        style={{
          paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined
        }}
      >
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="input w-full rounded-full pl-4 pr-10 py-2 text-sm sm:text-base bg-surface-container-highest border-outline-variant focus:border-primary placeholder:text-on-surface-muted"
            placeholder="Share a moment…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            aria-label="Chat message input"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          title="Send message"
          aria-label="Send message"
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 shadow-soft"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
});
