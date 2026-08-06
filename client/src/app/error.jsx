"use client";

import React, { useEffect } from 'react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('[Together] Runtime Error:', error);
  }, [error]);

  const isNetworkError = error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('socket');

  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-lg ambient-shadow">
        
        <div className="w-16 h-16 rounded-full bg-error-container/30 border border-error/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[32px] text-error">warning</span>
        </div>

        <h1 className="font-headline-lg text-2xl text-on-background mb-3">
          {isNetworkError ? 'Connection Lost' : 'Something went wrong'}
        </h1>

        <p className="font-body-md text-on-surface-variant leading-relaxed max-w-[300px] mx-auto mb-6">
          {isNetworkError
            ? 'Unable to reach the server. Check your connection and try again.'
            : 'An unexpected error occurred in the room. You can retry or go back home.'}
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="bg-error-container/10 border border-error/20 rounded-xl p-4 mb-6 text-left overflow-x-auto">
            <code className="text-xs text-error break-words leading-relaxed font-mono">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-lg hover:bg-surface-tint hover:-translate-y-0.5 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Try Again</span>
          </button>

          <button
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-2 bg-surface-container text-on-surface hover:bg-surface-container-high px-6 py-3 rounded-full font-label-lg transition-all border border-outline-variant"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
