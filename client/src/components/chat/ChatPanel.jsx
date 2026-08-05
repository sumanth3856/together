import React, { useState, useRef, useEffect, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: chatHistory.length,
    getScrollElement: () => chatContainerRef.current,
    estimateSize: () => 65,
    overscan: 10,
    getItemKey: (index) => chatHistory[index]?.id || index,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const onViewportResize = () => {
      const vv = window.visualViewport;
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      setKeyboardOffset(keyboardHeight);

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

  const INPUT_DOCK_HEIGHT = 62;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const formBottom = keyboardOffset > 0 ? keyboardOffset : (isMobile ? 70 : 0);
  const scrollPaddingBottom = INPUT_DOCK_HEIGHT + formBottom + 8;

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
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 pt-4 relative"
        style={{ paddingBottom: 'var(--chat-scroll-padding)' }}
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-70">
            <span className="material-symbols-outlined text-4xl mb-2">forum</span>
            <span className="font-label-sm">No moments yet.</span>
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
                    className="absolute top-0 left-0 w-full flex justify-center py-2"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wider">{msg.text}</span>
                  </div>
                );
              }

              const isMe = msg.senderId === myUserId;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={`absolute top-0 left-0 w-full flex gap-3 py-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {/* Avatar */}
                  <div className="shrink-0 pt-1">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-outline-variant" />
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
                      <span className="text-[10px] text-on-surface-variant font-label-sm">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="fixed md:absolute left-0 right-0 p-4 bg-surface-container-lowest border-t border-outline-variant flex gap-2 shrink-0 z-50 md:z-20"
        style={{
           bottom: `calc(${formBottom}px + env(safe-area-inset-bottom))`
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-surface-container border border-outline-variant rounded-full px-4 py-2.5 font-body-md text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow min-w-0"
          placeholder="Share a moment…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-surface-tint transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
});
