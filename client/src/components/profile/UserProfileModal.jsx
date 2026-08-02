import React, { useState } from 'react';
import { X, User, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserAvatar } from '../common/UserAvatar';
import { useUIStore } from '../../store/useUIStore';
import { ConfirmationModal } from '../common/ConfirmationModal';

export function UserProfileModal({ user, onClose }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const setToastNotification = useUIStore(state => state.setToastNotification);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      });
      
      if (error) throw error;
      setToastNotification({ type: 'success', message: 'Profile updated successfully!' });
      onClose();
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onClose();
    } catch (err) {
      alert('Error logging out: ' + err.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(13, 7, 20, 0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ 
        position: 'relative', width: '100%', maxWidth: '400px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 24px',
        boxShadow: 'var(--shadow-lg)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '12px', right: '12px', 
            background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--text-secondary)',
            width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: 'var(--accent-primary-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            overflow: 'hidden',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 4px 20px var(--accent-primary-glow)'
          }}>
            <UserAvatar user={user} size={80} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Your Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {user?.email}
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>
              Display Name
            </label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. CinemaFan"
              className="room-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '48px', borderRadius: '12px' }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="btn btn-danger"
            style={{ width: '100%', minHeight: '48px', borderRadius: 'var(--radius-md)' }}
            disabled={isLoggingOut}
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <ConfirmationModal
          title="Log Out"
          message="Are you sure you want to log out of your account?"
          confirmText="Log Out"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
