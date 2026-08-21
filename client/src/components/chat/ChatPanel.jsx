import React, { useState, useRef, useEffect, memo } from 'react';
import { EmojiReactions } from './EmojiReactions';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { useSocket } from '../../hooks/useSocket';

export const ChatPanel = memo(function ChatPanel() {
  const chatHistory = useRoomStore(state => state.roomState?.chatHistory || []);
  const socketId = useRoomStore(state => state.socketId);
  const currentMember = useRoomStore(state => state.roomState?.members?.find(m => m.socketIds?.includes(state.socketId)));
  const myUserId = currentMember?.userId;
  const incomingReaction = useUIStore(state => state.incomingReaction);
  const { sendChatMessage: onSendMessage, sendReaction: onSendReaction } = useSocket();
  const [inputText, setInputText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
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

  // Track isMobile with a resize listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

  const INPUT_DOCK_HEIGHT = 64;
  const formBottom = keyboardOffset > 0 ? keyboardOffset : (isMobile ? 70 : 0);
  const scrollPaddingBottom = INPUT_DOCK_HEIGHT + formBottom + 8;

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
      className="flex flex-col h-full md:max-h-full relative overflow-hidden bg-surface-container rounded-3xl border border-outline-variant shadow-md"
      style={{
        '--chat-form-bottom': `${formBottom}px`,
        '--chat-scroll-padding': `${scrollPaddingBottom}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-outline-variant/50 bg-surface-container-lowest shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] fill-1">chat_bubble</span>
          </div>
          <h2 className="font-headline-md text-base sm:text-lg text-on-background">Moments</h2>
          {nonSystemMessageCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-label-sm font-semibold tabular-nums">
              {nonSystemMessageCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[11px] font-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </div>
      </div>

      {/* Floating Emoji Reactions Bar */}
      <EmojiReactions incomingReaction={incomingReaction} onSendReaction={onSendReaction} />

      {/* Messages Stream */}
      <div 
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 sm:px-4 pt-3.5 relative flex flex-col gap-3"
        style={{ paddingBottom: isMobile ? 'var(--chat-scroll-padding)' : '1rem' }}
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-75 my-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center text-primary mb-3 shadow-sm">
              <span className="material-symbols-outlined text-3xl">forum</span>
            </div>
            <span className="font-headline-md text-sm sm:text-base text-on-background">No moments yet.</span>
            <span className="font-body-md text-xs text-on-surface-variant mt-1 text-center max-w-[200px]">
              Share your thoughts or react with an emoji above!
            </span>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id || index}
                  className="w-full flex justify-center py-0.5 animate-fade-in"
                >
                  <span className="bg-surface-container-highest/70 backdrop-blur-xs text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-[11px] sm:text-xs tracking-wide border border-outline-variant/30 shadow-2xs text-center max-w-[85%] break-words leading-tight">
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
                <div className="shrink-0 pt-0.5">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt="Avatar" loading="lazy" className="w-8 h-8 rounded-full border border-outline-variant object-cover shadow-2xs" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-label-sm shadow-2xs ${isMe ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'}`}>
                      {msg.sender?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col min-w-0 max-w-[78%] sm:max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 px-1 flex-wrap ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="font-label-sm text-xs sm:text-sm text-on-surface font-semibold truncate max-w-[130px]">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    {msg.isHost && (
                      <span className="material-symbols-outlined text-[14px] text-primary" title="Room Host">
                        star
                      </span>
                    )}
                    <span className="text-[11px] sm:text-xs text-on-surface-variant/80 font-label-sm" title={new Date(msg.timestamp).toLocaleTimeString()}>
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                  
                  <div 
                    className={`inline-block w-fit px-3.5 py-2 text-sm font-body-md shadow-xs break-all [overflow-wrap:anywhere] leading-relaxed ${isMe ? 'bg-primary text-on-primary rounded-2xl rounded-tr-xs' : 'bg-surface-container-lowest text-on-background rounded-2xl rounded-tl-xs border border-outline-variant/60'}`}
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

      {/* Input Form — fixed on mobile to stay above tab bar, docked shrink-0 on desktop */}
      <form
        onSubmit={handleSend}
        className="fixed md:relative bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-surface-container-lowest border-t border-outline-variant/60 flex items-center gap-2 shrink-0 z-40 md:z-20 shadow-sm"
        style={{
          paddingBottom: isMobile ? `calc(${formBottom}px + env(safe-area-inset-bottom) + 0.5rem)` : '0.75rem'
        }}
      >
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="input w-full rounded-full pl-4 pr-10 py-2 text-sm sm:text-base bg-surface-container border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
            placeholder="Share a moment…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            aria-label="Chat message input"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 shadow-md hover:shadow-lg"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
});
