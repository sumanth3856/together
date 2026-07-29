"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('[Together] Runtime Error:', error);
  }, [error]);

  const isNetworkError = error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('socket');

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#EDF1F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center', animation: 'fadeInUp 0.4s ease both' }}>

        <div style={{
          width: '68px', height: '68px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 22px',
        }}>
          <AlertTriangle size={30} color="#ef4444" strokeWidth={1.8} />
        </div>

        <h1 style={{ fontSize: '1.55rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {isNetworkError ? 'Connection Lost' : 'Something went wrong'}
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65, maxWidth: '310px', margin: '0 auto 28px' }}>
          {isNetworkError
            ? 'Unable to reach the server. Check your connection and try again.'
            : 'An unexpected error occurred in the room. You can retry or go back home.'}
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '24px', textAlign: 'left',
          }}>
            <code style={{ fontSize: '0.74rem', color: '#ef4444', wordBreak: 'break-word', lineHeight: 1.6 }}>
              {error.message}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="error-retry-btn"
            onClick={reset}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#0145F2', color: '#fff',
              border: 'none', borderRadius: '12px',
              padding: '11px 22px', fontSize: '0.875rem', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(1,69,242,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <button
            id="error-home-btn"
            onClick={() => { window.location.href = '/'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'transparent', color: '#475569',
              border: '1.5px solid #cbd5e1', borderRadius: '12px',
              padding: '11px 22px', fontSize: '0.875rem', fontWeight: '600',
              cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
          >
            <Home size={14} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
