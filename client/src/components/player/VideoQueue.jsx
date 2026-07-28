import React, { useState } from 'react';
import { Play, Youtube, Check, Film, Music, Compass, Loader } from 'lucide-react';

const CATEGORIZED_PRESETS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Beats', category: 'Music', emoji: '🎵' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Chilled', category: 'Music', emoji: '🌆' },
  { id: 'BHACKCNDMW8', title: 'Deep Space Ambient 4K', category: 'Ambient', emoji: '🌌' },
  { id: '1nN_uA475YI', title: 'Tropical Beach Nature 4K', category: 'Ambient', emoji: '🌊' },
  { id: '5qap5aO4i9A', title: 'Lofi Girl - Chill Beats', category: 'Music', emoji: '☕' },
];

export function VideoQueue({ isHost, hasControl, currentVideo, onChangeVideo }) {
  const [urlInput, setUrlInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loadingPreset, setLoadingPreset] = useState(null);

  const extractVideoId = (input) => {
    if (!input) return '';
    const cleanInput = input.trim();
    if (cleanInput.length === 11) return cleanInput;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = cleanInput.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handleLoadVideo = (e) => {
    e.preventDefault();
    const vidId = extractVideoId(urlInput);
    if (!vidId) {
      alert('Please enter a valid YouTube video URL or ID');
      return;
    }
    onChangeVideo({ youtubeId: vidId, title: 'Custom YouTube Video' });
    setUrlInput('');
  };

  const handleSelectPreset = (preset) => {
    setLoadingPreset(preset.id);
    onChangeVideo({ youtubeId: preset.id, title: preset.title });
    setTimeout(() => setLoadingPreset(null), 1200);
  };

  const filteredPresets = activeCategory === 'All'
    ? CATEGORIZED_PRESETS
    : CATEGORIZED_PRESETS.filter((p) => p.category === activeCategory);

  const canControl = isHost || hasControl;

  return (
    <div className="panel" style={{ marginTop: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Youtube size={14} color="#ef4444" />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>Load Video</span>
        </div>
        {!canControl && (
          <span style={{
            fontSize: '0.68rem', color: 'var(--text-tertiary)',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)', padding: '2px 8px'
          }}>
            Host only
          </span>
        )}
      </div>

      <div style={{ padding: '14px 14px' }}>
        {/* URL Input */}
        <form onSubmit={handleLoadVideo} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Paste YouTube URL or video ID…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={!canControl}
            style={{ fontSize: '0.875rem', background: canControl ? 'var(--bg-input)' : 'rgba(255,255,255,0.02)' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canControl || !urlInput.trim()}
            style={{ minHeight: '44px', padding: '0 14px', flexShrink: 0, borderRadius: 'var(--radius-md)' }}
          >
            <Play size={15} />
            <span>Load</span>
          </button>
        </form>

        {/* Category Chips */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Presets</span>
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {['All', 'Music', 'Ambient'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'var(--accent-primary)' : 'transparent',
                  color: activeCategory === cat ? '#fff' : 'var(--text-tertiary)',
                  border: activeCategory === cat ? '1px solid transparent' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filteredPresets.map((preset) => {
            const isPlaying = currentVideo?.youtubeId === preset.id;
            const isLoading = loadingPreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                disabled={!canControl}
                className={`preset-chip${isPlaying ? ' active' : ''}`}
                style={{ fontSize: '0.76rem' }}
              >
                {isLoading ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : (
                  <span style={{ fontSize: '0.75rem' }}>{preset.emoji}</span>
                )}
                <span>{preset.title}</span>
                {isPlaying && <span style={{ fontSize: '0.62rem', color: 'var(--status-success)', fontWeight: '700' }}>● LIVE</span>}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
