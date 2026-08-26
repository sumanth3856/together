import React, { memo, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';

export const VideoDetailsCard = memo(function VideoDetailsCard({ currentSocketId, onLoadVideo }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const roomId = useRoomStore(state => state.roomState?.roomId);
  const currentVideo = useRoomStore(state => state.roomState?.currentVideo);
  const isPlaying = useRoomStore(state => state.roomState?.playback?.isPlaying);
  const memberCount = useRoomStore(state => state.roomState?.members?.length || 0);
  const setToastNotification = useUIStore(state => state.setToastNotification);

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-surface-container/90 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-outline-variant/60 shadow-card overflow-hidden flex flex-col">
      {/* Video Info Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/50 flex items-start gap-3.5 bg-surface-container-lowest/80">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-soft">
           <span className="material-symbols-outlined text-[22px] sm:text-[24px]">movie</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-on-surface mb-1 line-clamp-2 leading-snug">
            {currentVideo?.title || 'No Video Loaded'}
          </h3>
          <div className="flex items-center gap-2.5 flex-wrap">
             <div className="chip bg-success-container text-success border border-success/30 text-[10px] sm:text-[11px] uppercase tracking-wider">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
               <span>{isPlaying ? 'Live' : 'Paused'}</span>
             </div>
             <span className="text-on-surface-muted text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">group</span>
                 {memberCount} Watching
             </span>
          </div>
        </div>
      </div>

      {/* Manual Load Form */}
      <div className="p-4 md:p-6 flex flex-col gap-3.5">
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const url = e.target.elements.videoUrl.value.trim();
            if (!url) return;
            
            const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
            if (ytMatch && ytMatch[1]) {
              if (onLoadVideo) onLoadVideo({ youtubeId: ytMatch[1] });
              e.target.reset();
              setToastNotification({ type: 'success', message: 'Video loaded! Syncing with room…' });
              setVideoLoaded(true);
              setTimeout(() => setVideoLoaded(false), 2000);
            } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
              if (onLoadVideo) onLoadVideo({ youtubeId: url });
              e.target.reset();
              setToastNotification({ type: 'success', message: 'Video loaded! Syncing with room…' });
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
              let title = url.split('/').pop()?.split('?')[0] || 'External Track';
              try {
                const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.title) title = data.title;
                }
              } catch {}
              if (onLoadVideo) onLoadVideo({ youtubeId: url, title });
              e.target.reset();
              setToastNotification({ type: 'success', message: 'Media loaded! Syncing with room…' });
            } else {
              setToastNotification({ type: 'error', message: 'Please enter a valid video or media link.' });
            }
          }}
          className="flex gap-2 w-full"
        >
          <input
            name="videoUrl"
            type="text"
            placeholder="Paste YouTube, SoundCloud, or Video URL..."
            className="input flex-1 bg-surface-container-highest text-xs sm:text-sm py-2 px-3 rounded-xl border border-outline-variant focus:border-primary placeholder:text-on-surface-muted"
          />
          <button type="submit" className="btn btn-primary px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-soft">
            Load
          </button>
        </form>

        <button 
          onClick={handleCopyShareLink} 
          className="btn btn-secondary w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-outline-variant hover:bg-surface-container-highest transition-colors shadow-soft"
        >
          {copiedLink ? <span className="material-symbols-outlined text-[18px] text-success">check</span> : <span className="material-symbols-outlined text-[18px]">share</span>}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
        </button>
      </div>
    </div>
  );
});
