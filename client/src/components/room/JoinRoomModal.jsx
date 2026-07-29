import React, { useState } from 'react';
import { Tv, Plus, Users, ArrowRight, Zap, ShieldCheck, Smile, Monitor, X } from 'lucide-react';

export function JoinRoomModal({ initialRoomId, onCreateRoom, onJoinRoom, onCancel }) {
  const [activeTab, setActiveTab] = useState(initialRoomId ? 'join' : 'create');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('tg_nickname');
    if (saved) setNickname(saved);
  }, []);

  const getAvatarLetter = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) { alert('Please enter a nickname'); return; }

    localStorage.setItem('tg_nickname', nickname.trim());
    setLoading(true);
    setRetrying(false);
    const retryTimer = setTimeout(() => setRetrying(true), 2500);

    try {
      if (activeTab === 'create') {
        await onCreateRoom(nickname.trim());
      } else {
        if (!roomId.trim()) {
          alert('Please enter a Room Code');
          clearTimeout(retryTimer);
          setLoading(false);
          return;
        }
        await onJoinRoom(roomId.trim(), nickname.trim());
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

          {/* Nickname Input */}
          <div>
            <span className="section-label">Your Nickname</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Avatar Preview */}
              <div
                className="avatar"
                style={{
                  width: '44px', height: '44px', flexShrink: 0,
                  background: nickname
                    ? `hsl(${(nickname.charCodeAt(0) * 37) % 360}, 65%, 50%)`
                    : 'var(--bg-surface-3)',
                  fontSize: '1.1rem',
                  transition: 'background var(--transition-base)',
                  boxShadow: nickname ? '0 2px 8px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                {getAvatarLetter(nickname)}
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Sumanth"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
                autoFocus
              />
            </div>
          </div>

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
