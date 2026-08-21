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

  const INPUT_DOCK_HEIGHT = 62;
  const formBottom = keyboardOffset > 0 ? keyboardOffset : (isMobile ? 70 : 0);
  const scrollPaddingBottom = INPUT_DOCK_HEIGHT + formBottom + 8;

  // Format a timestamp as a relative string ("just now", "2 min ago", etc.)
  const formatRelativeTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="flex flex-col h-full md:max-h-full relative overflow-hidden bg-surface-container rounded-3xl border border-outline-variant shadow-md"
      style={{
        '--chat-form-bottom': `${formBottom}px`,
        '--chat-scroll-padding': `${scrollPaddingBottom}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-outline-variant/50 bg-surface-container-lowest shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px] fill-1">chat_bubble</span>
          <h2 className="font-headline-md text-lg text-on-background">Moments</h2>
      </div>

      <EmojiReactions incomingReaction={incomingReaction} onSendReaction={onSendReaction} />

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 pt-4 relative flex flex-col gap-3"
        style={{ paddingBottom: isMobile ? 'var(--chat-scroll-padding)' : '1rem' }}
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-70 my-auto">
            <span className="material-symbols-outlined text-4xl mb-2">forum</span>
            <span className="font-label-sm">No moments yet.</span>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id || index}
                  className="w-full flex justify-center py-1"
                >
                  <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wider">{msg.text}</span>
                </div>
              );
            }

            const isMe = msg.senderId === myUserId;

            return (
              <div
                key={msg.id || index}
                className={`w-full flex gap-3 py-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="shrink-0 pt-1">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt="Avatar" loading="lazy" className="w-8 h-8 rounded-full border border-outline-variant" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-sm border border-outline-variant">
                       {msg.sender?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`flex flex-col min-w-0 flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 flex-wrap ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="font-label-sm text-on-background">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    {msg.isHost && <span className="material-symbols-outlined text-[14px] text-primary" title="Host">star</span>}
                    <span className="text-[10px] text-on-surface-variant font-label-sm" title={new Date(msg.timestamp).toLocaleTimeString()}>
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                  <div 
                    className={`px-4 py-2 text-sm font-body-md shadow-sm break-words ${isMe ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm' : 'bg-surface-container-lowest text-on-background rounded-2xl rounded-tl-sm border border-outline-variant'}`}
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

      {/* Input — fixed on mobile to stay above tab bar, docked shrink-0 on desktop */}
      <form
        onSubmit={handleSend}
        className="fixed md:relative bottom-0 left-0 right-0 p-3 bg-surface-container-lowest border-t border-outline-variant flex gap-2 shrink-0 z-40 md:z-20"
        style={{
          paddingBottom: isMobile ? `calc(${formBottom}px + env(safe-area-inset-bottom) + 0.75rem)` : '0.75rem'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="input flex-1 rounded-full"
          placeholder="Share a moment…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-surface-tint transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md hover:shadow-lift"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
});
