import React, { useState } from 'react';
import { Monitor, Zap, ShieldCheck, Smile, ArrowRight, Play, Users } from 'lucide-react';
import { JoinRoomModal } from '../room/JoinRoomModal';

export function LandingPage({ initialRoomId, onCreateRoom, onJoinRoom }) {
  const [isModalOpen, setIsModalOpen] = useState(!!initialRoomId);

  return (
    <div className="landing-bg" style={{ display: 'block', padding: '0' }}>
      
      {/* ── Top Navigation ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 5vw', position: 'relative', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px var(--accent-primary-glow), 0 0 0 1px rgba(255,255,255,0.1) inset'
          }}>
            <Monitor size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Together</span>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-secondary"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          Sign In
        </button>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', minHeight: '65vh', padding: '0 20px',
        animation: 'fadeInUp 0.6s ease both'
      }}>
        <div style={{
          background: 'var(--accent-primary-dim)', border: '1px solid rgba(1,69,242,0.2)',
          padding: '6px 16px', borderRadius: 'var(--radius-full)', marginBottom: '24px',
          display: 'inline-flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Now in Beta</span>
        </div>
        
        <h1 className="hero-title">
          Watch YouTube together,<br/>
          <span className="text-gradient-primary">in perfect sync.</span>
        </h1>
        
        <p className="hero-subtitle" style={{ maxWidth: '400px' }}>
          Experience YouTube with friends. Real-time sync, live chat, zero setup.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ minHeight: '56px', padding: '0 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-full)' }}
          >
            <Play size={18} fill="currentColor" />
            <span>Start Watching Free</span>
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-secondary"
            style={{ minHeight: '56px', padding: '0 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-full)' }}
          >
            <Users size={18} />
            <span>Join a Room</span>
          </button>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section style={{
        position: 'relative', zIndex: 10,
        maxWidth: '1200px', margin: '0 auto', padding: '60px 20px 100px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div className="feature-card">
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(1,69,242,0.2)'
            }}>
              <Zap size={24} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>Perfect Sync</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
              Advanced WebSocket architecture ensures everyone stays on the exact same frame.
            </p>
          </div>

          <div className="feature-card">
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(245,158,11,0.2)'
            }}>
              <ShieldCheck size={24} color="#fbbf24" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>Host Controls</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
              Grant or revoke playback controls to your friends with a single click.
            </p>
          </div>

          <div className="feature-card">
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <Smile size={24} color="#34d399" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>Live Reactions</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
              Express yourself with floating emojis and lightning-fast chat.
            </p>
          </div>

        </div>
      </section>

      {/* ── Modal Overlay ── */}
      {isModalOpen && (
        <JoinRoomModal 
          initialRoomId={initialRoomId} 
          onCreateRoom={onCreateRoom} 
          onJoinRoom={onJoinRoom} 
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
