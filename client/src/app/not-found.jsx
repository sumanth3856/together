"use client";

import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-lg ambient-shadow">
        
        {/* Code */}
        <div className="text-7xl font-black text-primary leading-none tracking-tighter mb-4 select-none">
          404
        </div>

        <div className="w-14 h-14 rounded-full bg-primary-container/30 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[28px] text-primary">explore</span>
        </div>

        <h1 className="font-headline-lg text-2xl text-on-background mb-3">
          Page Not Found
        </h1>

        <p className="font-body-md text-on-surface-variant leading-relaxed max-w-[300px] mx-auto mb-8">
          This page doesn't exist. Head back home or double-check the URL.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/"
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-lg hover:bg-surface-tint hover:-translate-y-0.5 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Back to Home</span>
          </a>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-surface-container text-on-surface hover:bg-surface-container-high px-6 py-3 rounded-full font-label-lg transition-all border border-outline-variant"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
