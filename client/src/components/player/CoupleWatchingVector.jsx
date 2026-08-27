import React, { useState } from 'react';

const COUPLE_IMAGE_URL = "https://static.vecteezy.com/system/resources/thumbnails/019/144/948/small/a-man-and-a-woman-couple-who-love-each-other-they-draw-hearts-with-each-other-s-hands-lovers-character-illustration-vector.jpg";

export function CoupleWatchingVector({ className = "" }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center select-none w-full max-w-xs sm:max-w-md md:max-w-lg ${className}`}>
      {/* Ambient Breathing Glow */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-2xl sm:blur-3xl pointer-events-none scale-110 sm:scale-125 animate-pulse"
        style={{ animationDuration: '4s' }}
        aria-hidden="true"
      />

      {/* Loading Skeleton Placeholder */}
      {!imageLoaded && !hasError && (
        <div className="w-36 h-24 sm:w-52 sm:h-36 md:w-64 md:h-44 rounded-2xl bg-surface-container-high/50 animate-pulse flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary animate-spin">progress_activity</span>
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center justify-center p-3 sm:p-6 text-center">
          <span className="material-symbols-outlined text-3xl sm:text-5xl text-primary mb-1 fill-1">favorite</span>
          <span className="text-xs sm:text-sm text-on-surface-variant font-medium">Watch Together</span>
        </div>
      ) : (
        <img
          src={COUPLE_IMAGE_URL}
          alt="A man and a woman couple who love each other drawing hearts together"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          className={`relative z-10 w-auto h-auto max-h-[110px] xs:max-h-[130px] sm:max-h-[180px] md:max-h-[240px] max-w-full object-contain rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lift transition-all duration-500 hover:scale-[1.02] ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        />
      )}
    </div>
  );
}
