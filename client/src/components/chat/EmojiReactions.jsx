import React, { useState, useEffect } from 'react';

const REACTION_EMOJIS = ['🔥', '😂', '❤️', '😮', '🎉', '👏', '🍿', '💯'];

export function EmojiReactions({ incomingReaction, onSendReaction }) {
  const [particles, setParticles] = useState([]);

  // Trigger floating particle when incoming reaction is received
  useEffect(() => {
    if (!incomingReaction) return;

    const id = Date.now() + Math.random();
    const leftOffset = Math.floor(Math.random() * 70) + 15;

    setParticles((prev) => [
      ...prev,
      { id, emoji: incomingReaction.emoji, left: `${leftOffset}%` }
    ]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2000);
  }, [incomingReaction]);

  const handleEmojiClick = (emoji) => {
    onSendReaction(emoji);
  };

  return (
    <>
      {/* Floating Reaction Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: '70px',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 40
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="reaction-particle"
            style={{ left: p.left, bottom: '16px', fontSize: '1.6rem' }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Reaction Buttons Bar */}
      <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-surface-container border-b border-outline-variant/50 shrink-0">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="flex-1 max-w-[38px] h-8 min-w-0 flex items-center justify-center rounded-lg text-base transition-colors hover:bg-surface-container-high"
            title={`React ${emoji}`}
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
