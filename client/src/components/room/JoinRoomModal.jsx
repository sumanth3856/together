import React, { useState } from 'react';
import { Tv, Plus, Users, ArrowRight, ShieldCheck, Zap, Smile } from 'lucide-react';

export function JoinRoomModal({ initialRoomId, onCreateRoom, onJoinRoom }) {
  const [activeTab, setActiveTab] = useState(initialRoomId ? 'join' : 'create');
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tg_nickname') || '';
    }
    return '';
  });
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [loading, setLoading] = useState(false);

  const getAvatarLetter = (name) => {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }

    localStorage.setItem('tg_nickname', nickname.trim());
    setLoading(true);

    try {
      if (activeTab === 'create') {
        await onCreateRoom(nickname.trim());
      } else {
        if (!roomId.trim()) {
          alert('Please enter a Room Code');
          setLoading(false);
          return;
        }
        await onJoinRoom(roomId.trim(), nickname.trim());
      }
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
    >
      <div 
        className="panel" 
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px 28px'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Tv size={28} color="#ffffff" />
          </div>

          <h1 
            style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: '#ffffff',
              marginBottom: '4px'
            }}
          >
            Together
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Watch YouTube videos in synchronized playback
          </p>
        </div>

        {/* Tab Toggle */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'var(--bg-input)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button 
            type="button"
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('create')}
            style={{ height: '38px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Create Room</span>
          </button>
          <button 
            type="button"
            className={`btn ${activeTab === 'join' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('join')}
            style={{ height: '38px', fontSize: '0.85rem' }}
          >
            <Users size={16} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nickname */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              NICKNAME
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: '#fff',
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                {getAvatarLetter(nickname)}
              </div>
              <input 
                type="text"
                className="input-field"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
              />
            </div>
          </div>

          {/* Room Code */}
          {activeTab === 'join' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                ROOM CODE
              </label>
              <input 
                type="text"
                className="input-field"
                placeholder="e.g. TOG-4829"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                style={{ letterSpacing: '0.05em', fontWeight: '600', textTransform: 'uppercase' }}
                required
              />
            </div>
          )}

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '4px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>{activeTab === 'create' ? 'Create Room' : 'Join Room'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Feature List */}
        <div 
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Zap size={16} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Synced Video</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={16} color="var(--status-warning)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Host Controls</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Smile size={16} color="var(--status-success)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live Reactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
