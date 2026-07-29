import React from 'react';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#EDF1F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center', animation: 'fadeInUp 0.4s ease both' }}>

        {/* Code */}
        <div style={{
          fontSize: '5.5rem', fontWeight: '900',
          color: '#0145F2',
          lineHeight: 1, letterSpacing: '-0.04em',
          marginBottom: '16px',
          userSelect: 'none',
        }}>
          404
        </div>

        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(1,69,242,0.08)', border: '1.5px solid rgba(1,69,242,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Compass size={24} color="#0145F2" strokeWidth={1.8} />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65, maxWidth: '300px', margin: '0 auto 30px' }}>
          This page doesn\'t exist. Head back home or double-check the URL.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            id="notfound-home-btn"
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#0145F2', color: '#fff',
              border: 'none', borderRadius: '12px',
              padding: '11px 22px', fontSize: '0.875rem', fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(1,69,242,0.25)',
              transition: 'transform 0.15s',
            }}
          >
            <Home size={14} />
            <span>Back to Home</span>
          </a>

          <button
            id="notfound-back-btn"
            onClick={() => window.history.back()}
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
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
