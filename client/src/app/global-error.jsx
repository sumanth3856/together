"use client";

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="m-0 p-0">
        <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-lg ambient-shadow">
            
            <div className="w-16 h-16 rounded-full bg-error-container/30 border border-error/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px] text-error">report</span>
            </div>

            <h1 className="font-headline-lg text-2xl text-on-background mb-3">
              Critical Error
            </h1>

            <p className="font-body-md text-on-surface-variant leading-relaxed max-w-[300px] mx-auto mb-8">
              A critical error occurred while rendering the application. 
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-lg hover:bg-surface-tint hover:-translate-y-0.5 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
