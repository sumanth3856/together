import React, { useState } from 'react';
import { Tv, Plus, Users, ArrowRight, Zap, ShieldCheck, Smile, Monitor, X } from 'lucide-react';

import { supabase } from '../../lib/supabase';

export function JoinRoomModal({ initialRoomId, onCreateRoom, onJoinRoom, onCancel, user }) {
  const [activeTab, setActiveTab] = useState(initialRoomId ? 'join' : 'create');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const getAvatarLetter = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const nickname = user.user_metadata.full_name || 'Guest';
    const avatar = user.user_metadata.avatar_url || null;

    setLoading(true);
    setRetrying(false);
    const retryTimer = setTimeout(() => setRetrying(true), 2500);

    try {
      if (activeTab === 'create') {
        await onCreateRoom(user.id, nickname, avatar);
      } else {
        if (!roomId.trim()) {
          alert('Please enter a Room Code');
          clearTimeout(retryTimer);
          setLoading(false);
          return;
        }
        await onJoinRoom(roomId.trim(), user.id, nickname, avatar);
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      clearTimeout(retryTimer);
      setLoading(false);
      setRetrying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="landing-card" style={{ position: 'relative' }}>
        
        {/* Close Button */}
        {onCancel && (
          <button 
            onClick={onCancel}
            style={{ 
              position: 'absolute', top: '16px', right: '16px', 
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)',
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset'
          }}>
            <Monitor size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Together
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Watch YouTube in perfect sync with friends
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="tab-control" style={{ marginBottom: '22px' }}>
          <button
            type="button"
            className={`tab-control-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={15} />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            className={`tab-control-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <Users size={15} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* User Profile / Auth */}
          {!user ? (
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="btn btn-secondary"
                style={{ width: '100%', minHeight: '48px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
          ) : (
            <div>
              <span className="section-label">Signed in as</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-surface-2)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {user.user_metadata.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                ) : (
                  <div className="avatar" style={{ width: '40px', height: '40px', background: 'var(--accent-primary-dim)' }}>
                    {getAvatarLetter(user.user_metadata.full_name)}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.user_metadata.full_name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Room Code Input */}
          {activeTab === 'join' && (
            <div>
              <span className="section-label">Room Code</span>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. TOG-X7HF"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                style={{ letterSpacing: '0.1em', fontFamily: "var(--font-outfit), monospace", fontWeight: '700', fontSize: '1rem' }}
                required
              />
            </div>
          )}

          {/* Submit */}
          {user && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '4px', minHeight: '48px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {retrying ? 'Retrying...' : 'Connecting...'}
                </span>
              ) : (
                <>
                  <span>{activeTab === 'create' ? 'Create Room' : 'Join Room'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </form>

        {/* Feature Highlights */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          textAlign: 'center'
        }}>
          {[
            { icon: <Zap size={16} color="var(--accent-primary)" />, label: 'Frame-perfect Sync' },
            { icon: <ShieldCheck size={16} color="var(--accent-amber)" />, label: 'Host Controls' },
            { icon: <Smile size={16} color="var(--accent-emerald)" />, label: 'Live Reactions' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {icon}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spin animation for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
