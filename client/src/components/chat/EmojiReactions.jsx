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
      <div 
        style={{
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4px',
          background: 'var(--bg-input)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="btn btn-ghost"
            style={{
              minHeight: '32px',
              padding: 0,
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1.1rem'
            }}
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
