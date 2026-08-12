import React, { useState, useRef } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

// Module-level API URL — computed once, not on every search
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
  return '';
};
const API_BASE_URL = getApiUrl();

export function SearchAndQueuePanel({ onAddVideo, onPlayVideo, onRemoveVideo }) {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Cache the last search results so switching tabs doesn't clear them
  const lastResultsRef = useRef([]);

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
      const res = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const videos = data.results || [];
      setResults(videos);
      lastResultsRef.current = videos; // cache for tab-switch persistence
    } catch (err) {
      setError('Failed to load search results.');
      // Restore last results so the user doesn't lose their previous search
      if (lastResultsRef.current.length > 0) setResults(lastResultsRef.current);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (video) => {
    if (onAddVideo) onAddVideo(video);
    setActiveTab('queue');
  };

  const handlePlayNow = (video) => {
    if (video.id && onRemoveVideo) {
      onRemoveVideo(video.id);
    }
    if (onPlayVideo) onPlayVideo(video);
  };

  const handleRemoveFromQueue = (queueId) => {
    if (onRemoveVideo) onRemoveVideo(queueId);
  };

  return (
    <div className="bg-surface-container rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col h-full max-h-full">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/50 bg-surface-container-lowest shrink-0">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-label-lg transition-colors border-b-2 ${activeTab === 'search' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-background'}`}
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          Search
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-label-lg transition-colors border-b-2 ${activeTab === 'queue' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-background'}`}
        >
          <span className="material-symbols-outlined text-[18px]">queue_music</span>
          Queue ({queue.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-surface-container">
        
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-4 h-full">
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Search YouTube..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input w-full pl-11 bg-surface-container-lowest"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary px-5 rounded-xl min-w-[64px]"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Go'}
              </button>
            </form>

            {error && <div className="text-error font-label-sm text-center bg-error-container/50 p-2 rounded-lg">{error}</div>}

            <div className="flex flex-col gap-3 overflow-y-auto">
              {results.length === 0 && !loading && !error && (
                 <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant opacity-70">
                    <span className="material-symbols-outlined text-4xl mb-2">youtube_activity</span>
                    <span className="font-label-sm">Search for videos to watch</span>
                 </div>
              )}
              {loading && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant animate-pulse">
                      <div className="w-[100px] h-[56px] shrink-0 rounded-lg bg-surface-container-high"></div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <div className="h-4 bg-surface-container-high rounded-full w-3/4"></div>
                        <div className="h-3 bg-surface-container-high rounded-full w-1/2"></div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 justify-center pr-1">
                        <div className="w-7 h-7 rounded-lg bg-surface-container-high"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.map((v) => (
                <div key={v.youtubeId} className="flex gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant hover:border-primary-container hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-[100px] h-[56px] shrink-0 rounded-lg overflow-hidden relative">
                     <img 
                        src={v.thumbnail} 
                        alt={v.title} 
                        loading="lazy"
                        className="w-full h-full object-cover bg-surface-container" 
                        onError={(e) => {
                          if (e.target.src !== `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`) {
                            e.target.src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
                          }
                        }}
                     />
                     <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-label-sm">
                         {v.duration}
                     </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="font-label-md text-on-background truncate group-hover:text-primary transition-colors">{v.title}</div>
                    <div className="font-label-sm text-xs text-on-surface-variant truncate mt-0.5">{v.author}</div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 justify-center pr-1">
                    <button type="button" onClick={() => handleAddToQueue(v)} className="w-7 h-7 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-primary flex items-center justify-center transition-colors" title="Add to Queue">
                       <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                    {isHost && (
                      <button type="button" onClick={() => handlePlayNow(v)} className="w-7 h-7 rounded-lg bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center transition-colors" title="Play Now">
                        <span className="material-symbols-outlined text-[16px] fill-1">play_arrow</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-on-surface-variant opacity-70">
                <span className="material-symbols-outlined text-4xl mb-2">queue_music</span>
                <span className="font-label-sm">Queue is empty</span>
                <span className="text-[11px] mt-1">Search for videos to add them here.</span>
              </div>
            ) : (
              queue.map((v, index) => (
                <div key={v.id} className="flex gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant relative hover:border-primary-container hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="absolute -top-2 -left-2 bg-primary text-on-primary text-[10px] font-label-lg w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                  <div className="w-[100px] h-[56px] shrink-0 rounded-lg overflow-hidden ml-2">
                     <img 
                        src={v.thumbnail} 
                        alt={v.title} 
                        loading="lazy"
                        className="w-full h-full object-cover bg-surface-container"
                        onError={(e) => {
                          if (e.target.src !== `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`) {
                            e.target.src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
                          }
                        }}
                     />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="font-label-md text-on-background truncate group-hover:text-primary transition-colors">{v.title}</div>
                    <div className="font-label-sm text-[10px] text-on-surface-variant truncate mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {v.addedBy}
                    </div>
                  </div>
                  {isHost && (
                    <div className="flex flex-col gap-1 shrink-0 justify-center pr-1">
                      <button type="button" onClick={() => handlePlayNow(v)} className="w-7 h-7 rounded-lg bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center transition-colors" title="Play Now">
                        <span className="material-symbols-outlined text-[16px] fill-1">play_arrow</span>
                      </button>
                      <button type="button" onClick={() => handleRemoveFromQueue(v.id)} className="w-7 h-7 rounded-lg bg-error/10 text-error hover:bg-error hover:text-on-error flex items-center justify-center transition-colors" title="Remove">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
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
