import React, { useState, useEffect } from 'react';
import { Search, ListVideo, Plus, Play, Trash2, Loader, Youtube } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
export function SearchAndQueuePanel({ onAddVideo, onPlayVideo, onRemoveVideo }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'queue'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roomState = useRoomStore((s) => s.roomState);
  const socketId = useRoomStore((s) => s.socketId);

  const currentMember = roomState?.members?.find((m) => m.socketIds?.includes(socketId));
  const isHost = roomState?.hostId === currentMember?.userId;
  const queue = roomState?.videoQueue || [];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
          return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
        }
        if (typeof window !== 'undefined') {
          const { protocol, hostname } = window.location;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:4000`;
          }
        }
        return ''; // Falls back to relative if not configured
      };

      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Failed to load search results.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (video) => {
    if (onAddVideo) onAddVideo(video);
    // Switch to queue tab to show it was added
    setActiveTab('queue');
  };

  const handlePlayNow = (video) => {
    if (onPlayVideo) onPlayVideo(video);
  };

  const handleRemoveFromQueue = (queueId) => {
    if (onRemoveVideo) onRemoveVideo(queueId);
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '600',
            color: activeTab === 'search' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'search' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Search size={16} /> Search
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            flex: 1, padding: '12px', fontSize: '0.85rem', fontWeight: '600',
            color: activeTab === 'queue' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'queue' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <ListVideo size={16} /> Queue ({queue.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search YouTube..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', background: 'var(--bg-input)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 12px' }}>
                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Go'}
              </button>
            </form>

            {error && <div style={{ color: 'var(--status-error)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((v) => (
                <div key={v.youtubeId} style={{ display: 'flex', gap: '10px', background: 'var(--bg-surface-2)', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <img src={v.thumbnail} alt={v.title} style={{ width: '100px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{v.author} • {v.duration}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                    <button type="button" onClick={() => handleAddToQueue(v)} style={{ background: 'var(--bg-surface-3)', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: 'var(--accent-primary)' }} title="Add to Queue">
                      <Plus size={14} />
                    </button>
                    <button type="button" onClick={() => handlePlayNow(v)} style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: '#fff' }} title="Play Now">
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)' }}>
                <ListVideo size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Queue is empty</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Search for videos to add them here.</div>
              </div>
            ) : (
              queue.map((v, index) => (
                <div key={v.id} style={{ display: 'flex', gap: '10px', background: 'var(--bg-surface-2)', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-6px', left: '-6px', background: 'var(--accent-primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {index + 1}
                  </div>
                  <img src={v.thumbnail} alt={v.title} style={{ width: '100px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Added by {v.addedBy}</div>
                  </div>
                  {isHost && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button type="button" onClick={() => handleRemoveFromQueue(v.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '4px', padding: '8px', cursor: 'pointer', color: '#ef4444' }} title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
