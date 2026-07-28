import React, { useState } from 'react';
import { Play, Youtube, Check, Film, Music, Radio, Compass } from 'lucide-react';

const CATEGORIZED_PRESETS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Beats', category: 'Music' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Chilled', category: 'Music' },
  { id: 'BHACKCNDMW8', title: 'Deep Space Ambient 4K', category: 'Ambient' },
  { id: '1nN_uA475YI', title: 'Tropical Beach Nature 4K', category: 'Ambient' },
  { id: '5qap5aO4i9A', title: 'Lofi Girl - Chill Beats', category: 'Music' }
];

export function VideoQueue({ isHost, hasControl, currentVideo, onChangeVideo }) {
  const [urlInput, setUrlInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedPreset, setCopiedPreset] = useState(null);

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
    setCopiedPreset(preset.id);
    onChangeVideo({ youtubeId: preset.id, title: preset.title });
    setTimeout(() => setCopiedPreset(null), 1500);
  };

  const filteredPresets = activeCategory === 'All' 
    ? CATEGORIZED_PRESETS 
    : CATEGORIZED_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="panel" style={{ marginTop: '16px', padding: '16px 18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Youtube size={18} color="#ef4444" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Load YouTube Video</h3>
        </div>
        {!isHost && !hasControl && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Host Permission Required</span>
        )}
      </div>

      {/* URL Input */}
      <form onSubmit={handleLoadVideo} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="text"
            className="input-field"
            placeholder="Paste YouTube Link or Video ID"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={!isHost && !hasControl}
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!isHost && !hasControl || !urlInput.trim()}
          style={{ minHeight: '44px' }}
        >
          <Play size={15} />
          <span>Load</span>
        </button>
      </form>

      {/* Preset Categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            DEMO PRESETS
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Music', 'Ambient'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'var(--accent-primary)' : 'transparent',
                  color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer'
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

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                disabled={!isHost && !hasControl}
                className="btn btn-secondary"
                style={{
                  minHeight: '32px',
                  padding: '0 10px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  borderColor: isPlaying ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: isPlaying ? 'rgba(88, 80, 236, 0.15)' : 'var(--bg-input)'
                }}
              >
                {copiedPreset === preset.id ? (
                  <Check size={12} color="#10b981" />
                ) : isPlaying ? (
                  <Radio size={12} color="var(--status-success)" />
                ) : (
                  <Film size={12} color="var(--text-secondary)" />
                )}
                <span>{preset.title}</span>
                {isPlaying && <span style={{ fontSize: '0.65rem', color: 'var(--status-success)', fontWeight: '700' }}>Playing</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
