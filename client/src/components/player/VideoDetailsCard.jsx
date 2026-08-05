import React, { memo, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

export const VideoDetailsCard = memo(function VideoDetailsCard({ currentSocketId, onLoadVideo }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const roomId = useRoomStore(state => state.roomState?.roomId);
  const currentVideo = useRoomStore(state => state.roomState?.currentVideo);
  const isPlaying = useRoomStore(state => state.roomState?.playback?.isPlaying);
  const memberCount = useRoomStore(state => state.roomState?.members?.length || 0);

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-surface-container rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
      {/* Video Info Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/50 flex items-start gap-4 bg-surface-container-lowest">
        <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
           <span className="material-symbols-outlined text-[24px]">movie</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-headline-md text-lg text-on-background mb-1 truncate">
            {currentVideo?.title || 'No Video Loaded'}
          </h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-0.5 rounded-full border border-success/20">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
               <span className="font-label-sm text-[10px] uppercase tracking-wider">{isPlaying ? 'Live' : 'Paused'}</span>
             </div>
             <span className="text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">group</span>
                 {memberCount} Watching
             </span>
          </div>
        </div>
      </div>

      {/* Manual Load Form */}
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const url = e.target.elements.videoUrl.value.trim();
            if (!url) return;
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
            if (match && match[1]) {
              if (onLoadVideo) onLoadVideo({ youtubeId: match[1] });
              e.target.reset();
            } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
              if (onLoadVideo) onLoadVideo({ youtubeId: url });
              e.target.reset();
            }
          }}
          className="flex gap-2 w-full"
        >
          <input
            name="videoUrl"
            type="text"
            placeholder="Paste YouTube URL or ID..."
            className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 font-body-md text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow"
          />
          <button type="submit" className="bg-surface-container-highest text-on-surface hover:bg-outline-variant px-5 py-2 rounded-xl font-label-lg transition-colors border border-outline-variant">
            Load
          </button>
        </form>

        <button 
          onClick={handleCopyShareLink} 
          className="w-full bg-surface-container hover:bg-surface-container-high text-on-background px-4 py-3 rounded-xl font-label-lg transition-colors border border-outline-variant flex items-center justify-center gap-2"
        >
          {copiedLink ? <span className="material-symbols-outlined text-[18px] text-success">check</span> : <span className="material-symbols-outlined text-[18px]">share</span>}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
        </button>
      </div>
    </div>
  );
});
