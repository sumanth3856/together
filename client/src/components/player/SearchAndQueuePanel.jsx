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
const EMPTY_QUEUE = [];
const EMPTY_MEMBERS = [];

export function SearchAndQueuePanel({ onAddVideo, onPlayVideo, onRemoveVideo }) {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastResultsRef = useRef([]);

  const hostId = useRoomStore((s) => s.roomState?.hostId);
  const allowMemberControls = useRoomStore((s) => s.roomState?.settings?.allowMemberControls ?? true);
  const queue = useRoomStore((s) => s.roomState?.videoQueue || EMPTY_QUEUE);
  const members = useRoomStore((s) => s.roomState?.members || EMPTY_MEMBERS);
  const socketId = useRoomStore((s) => s.socketId);

  const currentMember = members.find((m) => m.socketIds?.includes(socketId));
  const isHost = hostId === currentMember?.userId;
  const canControl = isHost || allowMemberControls;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        setResults([]);
        setError(`Search failed (${res.status}). Please try again.`);
        return;
      }
      const data = await res.json();
      const videos = Array.isArray(data?.results) ? data.results : [];
      setResults(videos);
      lastResultsRef.current = videos;
      if (videos.length === 0) {
        setError('No videos found.');
      }
    } catch (err) {
      setResults([]);
      setError('Failed to load search results. Check network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDirectUrl = async (e) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    setUrlLoading(true);
    setError(null);

    try {
      let videoTitle = cleanUrl.split('/').pop()?.split('?')[0] || 'External Video';
      let thumbnail = '';
      let author = 'Web Media';
      
      // Attempt oEmbed / metadata fetch if it looks like a web URL
      if (cleanUrl.startsWith('http')) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/oembed?url=${encodeURIComponent(cleanUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.title) videoTitle = data.title;
            if (data.thumbnail) thumbnail = data.thumbnail;
            if (data.author || data.provider) author = data.author || data.provider;
          }
        } catch {
          // Fallback title is already set
        }
      }

      const videoObject = {
        youtubeId: cleanUrl, // For backward compatibility across socket events
        videoUrl: cleanUrl,
        title: videoTitle,
        thumbnail,
        duration: 'External',
        author
      };

      if (onAddVideo) onAddVideo(videoObject);
      setUrlInput('');
      setActiveTab('queue');
    } catch (err) {
      setError('Failed to add URL.');
    } finally {
      setUrlLoading(false);
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
    <div className="bg-surface-container rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col h-full max-h-full" data-testid="search-and-queue-panel">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/50 bg-surface-container-lowest shrink-0 px-2">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-label-md text-xs sm:text-sm transition-colors border-b-2 ${activeTab === 'search' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-background'}`}
          data-testid="tab-search"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          Search
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-label-md text-xs sm:text-sm transition-colors border-b-2 ${activeTab === 'queue' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-background'}`}
          data-testid="tab-queue"
        >
          <span className="material-symbols-outlined text-[18px]">queue_music</span>
          Queue ({queue.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-surface-container flex flex-col">
        
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-3 h-full min-h-0 flex-1">
            {/* Compact Dual Input Zone (Search YouTube + Paste Direct URL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
              {/* YouTube Search Form */}
              <form onSubmit={handleSearch} className="flex gap-1.5 items-center">
                <div className="relative flex-1 min-w-0">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search YouTube..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input w-full pl-9 pr-2 py-1.5 h-10 text-sm sm:text-base bg-surface-container-lowest rounded-xl border border-outline-variant/70 focus:border-primary"
                    data-testid="search-input"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary px-4 h-10 rounded-xl min-w-[54px] text-xs sm:text-sm font-semibold shrink-0 shadow-sm"
                  data-testid="search-submit-btn"
                >
                  {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : 'Go'}
                </button>
              </form>

              {/* Direct External URL Form */}
              <form onSubmit={handleAddDirectUrl} className="flex gap-1.5 items-center">
                <div className="relative flex-1 min-w-0">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">link</span>
                  <input
                    type="text"
                    placeholder="Paste link (SoundCloud, Vimeo, MP4)..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="input w-full pl-9 pr-2 py-1.5 h-10 text-sm sm:text-base bg-surface-container-lowest rounded-xl border border-outline-variant/70 focus:border-primary"
                    data-testid="direct-url-input"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={urlLoading || !urlInput.trim()} 
                  className="btn bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface px-3.5 h-10 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-colors"
                  data-testid="direct-url-submit-btn"
                >
                  {urlLoading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : 'Add'}
                </button>
              </form>
            </div>

            {error && <div className="text-error font-label-sm text-center bg-error-container/50 py-1.5 px-3 rounded-lg text-xs" data-testid="search-error">{error}</div>}

            {/* Video Search Results List with Breathing Room */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
              {results.length === 0 && !loading && !error && (
                 <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant opacity-70">
                    <span className="material-symbols-outlined text-4xl mb-2 text-primary/60">youtube_activity</span>
                    <span className="font-label-sm text-xs sm:text-sm">Search videos or paste a link to queue and watch</span>
                 </div>
              )}
              {loading && (
                <div className="flex flex-col gap-2.5" data-testid="search-skeleton">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 bg-surface-container-lowest p-2.5 rounded-2xl border border-outline-variant/60 animate-pulse">
                      <div className="w-[100px] h-[58px] shrink-0 rounded-xl bg-surface-container-high"></div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <div className="h-4 bg-surface-container-high rounded-full w-3/4"></div>
                        <div className="h-3 bg-surface-container-high rounded-full w-1/2"></div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0 justify-center pr-1">
                        <div className="w-8 h-8 rounded-xl bg-surface-container-high"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.map((v) => (
                <div key={v.youtubeId} className="flex gap-3 bg-surface-container-lowest p-2 sm:p-2.5 rounded-2xl border border-outline-variant/60 hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group" data-testid={`video-result-${v.youtubeId}`}>
                  <div className="w-[96px] sm:w-[110px] h-[56px] sm:h-[62px] shrink-0 rounded-xl overflow-hidden relative shadow-inner">
                     <img 
                        src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} 
                        alt={v.title} 
                        loading="lazy"
                        className="w-full h-full object-cover bg-surface-container" 
                        onError={(e) => {
                          if (e.target.src !== `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`) {
                            e.target.src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
                          }
                        }}
                     />
                     {v.duration && (
                       <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-label-sm font-semibold">
                           {v.duration}
                       </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="font-label-md text-sm sm:text-base text-on-background line-clamp-2 group-hover:text-primary transition-colors leading-snug">{v.title}</div>
                    <div className="font-label-sm text-xs sm:text-sm text-on-surface-variant truncate mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {v.author || 'Video'}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col gap-1.5 shrink-0 justify-center items-center pr-1">
                    <button 
                      type="button" 
                      onClick={() => handlePlayNow(v)} 
                      disabled={!canControl}
                      className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl font-label-md text-xs sm:text-sm transition-all shadow-xs active:scale-95 ${!canControl ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-surface-tint hover:shadow-sm'}`}
                      title={canControl ? "Play Now" : "Controls restricted"}
                      aria-label={`Play ${v.title} now`}
                      data-testid={`play-now-${v.youtubeId}`}
                    >
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px] fill-1">play_arrow</span>
                      <span className="hidden sm:inline font-semibold">Play</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => handleAddToQueue(v)} 
                      disabled={!canControl}
                      className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl font-label-md text-xs sm:text-sm transition-all shadow-xs active:scale-95 ${!canControl ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed' : 'bg-surface-container-high hover:bg-primary-container text-primary hover:text-on-primary-container'}`}
                      title={canControl ? "Add to Queue" : "Queue restricted"}
                      aria-label={`Add ${v.title} to queue`}
                      data-testid={`add-queue-${v.youtubeId}`}
                    >
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">playlist_add</span>
                      <span className="hidden sm:inline font-semibold">Queue</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto" data-testid="queue-list-container">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-on-surface-variant opacity-70" data-testid="queue-empty-state">
                <span className="material-symbols-outlined text-4xl mb-2">queue_music</span>
                <span className="font-label-sm">Queue is empty</span>
                <span className="text-[11px] mt-1">Search for videos or paste a link to add them here.</span>
              </div>
            ) : (
              queue.map((v, index) => (
                <div key={v.id || index} className="flex gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant relative hover:border-primary-container hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group" data-testid={`queue-item-${index}`}>
                  <div className="absolute -top-2 -left-2 bg-primary text-on-primary text-[10px] font-label-lg w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                  <div className="w-[100px] h-[56px] shrink-0 rounded-lg overflow-hidden ml-2 bg-surface-container flex items-center justify-center">
                     {v.thumbnail ? (
                       <img 
                          src={v.thumbnail} 
                          alt={v.title} 
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (v.youtubeId && e.target.src !== `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`) {
                              e.target.src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
                            }
                          }}
                       />
                     ) : (
                       <span className="material-symbols-outlined text-2xl text-on-surface-variant opacity-50">movie</span>
                     )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="font-label-md text-on-background truncate group-hover:text-primary transition-colors">{v.title}</div>
                    <div className="font-label-sm text-[10px] text-on-surface-variant truncate mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {v.addedBy || 'Member'}
                    </div>
                  </div>
                  {isHost && (
                    <div className="flex flex-col gap-1 shrink-0 justify-center pr-1">
                      <button type="button" onClick={() => handlePlayNow(v)} className="w-7 h-7 rounded-lg bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center transition-colors" title="Play Now" data-testid={`queue-play-${index}`}>
                        <span className="material-symbols-outlined text-[16px] fill-1">play_arrow</span>
                      </button>
                      <button type="button" onClick={() => handleRemoveFromQueue(v.id)} className="w-7 h-7 rounded-lg bg-error/10 text-error hover:bg-error hover:text-on-error flex items-center justify-center transition-colors" title="Remove" data-testid={`queue-remove-${index}`}>
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
