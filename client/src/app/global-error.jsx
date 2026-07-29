"use client";

import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100dvh',
          background: '#EDF1F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: "'Inter', 'Outfit', sans-serif",
          margin: 0,
        }}>
          <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center', animation: 'fadeInUp 0.4s ease both' }}>
            
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertOctagon size={34} color="#ef4444" strokeWidth={1.8} />
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Critical Error
            </h1>

            <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.65, maxWidth: '320px', margin: '0 auto 32px' }}>
              A critical error occurred while rendering the application. 
            </p>

            <button
              id="global-error-retry-btn"
              onClick={reset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#0145F2', color: '#fff',
                border: 'none', borderRadius: '12px',
                padding: '12px 24px', fontSize: '0.9rem', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(1,69,242,0.25)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <RefreshCw size={15} />
              <span>Restart Application</span>
            </button>
          </div>

          <style>{`
            @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
            body { margin: 0; padding: 0; }
          `}</style>
        </div>
      </body>
    </html>
  );
}
