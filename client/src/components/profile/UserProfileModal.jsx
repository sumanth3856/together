import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export function UserProfileModal({ isOpen, onClose, user }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const setToastNotification = useUIStore(state => state.setToastNotification);
  const theme = useUIStore(state => state.theme);
  const setTheme = useUIStore(state => state.setTheme);

  useLockBodyScroll(isOpen);

  React.useEffect(() => {
    setDisplayName(user?.user_metadata?.full_name || '');
  }, [user]);

  if (!isOpen) return null;

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

  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

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

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.image || null;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="fixed inset-0 z-[100] flex items-center justify-center font-body-md p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true"></div>
        
        {/* Modal Container */}
        <div className="relative z-10 w-full max-w-[800px] bg-surface-container/98 backdrop-blur-2xl rounded-3xl shadow-cinema overflow-hidden border border-outline-variant text-on-surface animate-fade-in-up flex flex-col md:flex-row">
            
            {/* Left Sidebar: Profile Summary */}
            <div className="w-full md:w-1/3 bg-surface-container-lowest/80 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-outline-variant/50">
                <div className="shrink-0 relative mb-4">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={displayName || 'User Avatar'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.profile-avatar-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        className="w-28 h-28 rounded-full border-2 border-outline-variant object-cover shadow-soft"
                      />
                    ) : null}
                    <div
                      style={{ display: userAvatar ? 'none' : 'flex' }}
                      className="profile-avatar-fallback w-28 h-28 rounded-full bg-surface-container-highest text-primary items-center justify-center text-4xl font-display-lg border-2 border-outline-variant shadow-soft"
                    >
                      {initial}
                    </div>
                </div>
                <h2 id="profile-title" className="font-display-lg text-xl font-bold mb-1 text-on-background">{displayName || 'User'}</h2>
                <p className="text-xs text-on-surface-muted break-all">{user?.email}</p>
                <div className="mt-auto pt-6 w-full">
                    <button 
                        onClick={() => setShowSignoutConfirm(true)}
                        disabled={isLoggingOut}
                        title="Sign out of your account"
                        aria-label="Sign out"
                        className="btn w-full py-2.5 text-error hover:bg-error-container/50 border border-error/20 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                    >
                        {isLoggingOut ? (
                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                Sign Out
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Content: Settings Form */}
            <div className="w-full md:w-2/3 p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-background">Account Settings</h3>
                    <button 
                      onClick={onClose} 
                      title="Close dialog" 
                      aria-label="Close dialog"
                      className="w-10 h-10 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-on-surface">Display Name</label>
                        <input 
                            type="text" 
                            className="input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-xs text-on-surface-muted">This is how you will appear to others in the room</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                        <input 
                            type="email" 
                            className="input bg-surface-container-highest/40 border-outline-variant/50 text-on-surface-muted cursor-not-allowed"
                            value={user?.email || ''}
                            disabled
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-on-surface">Appearance</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTheme('dark')}
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary shadow-soft' : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                                Dark
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme('light')}
                                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary shadow-soft' : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">light_mode</span>
                                Light
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-outline-variant/50 flex justify-end items-center">
                        <button 
                            type="submit" 
                            disabled={isSaving || !displayName.trim()}
                            className="btn btn-primary px-8 py-3 shadow-glow"
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {showSignoutConfirm && (
            <ConfirmationModal
                title="Sign Out"
                message="Are you sure you want to sign out? You will be disconnected from any active rooms."
                confirmText="Sign Out"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                    setShowSignoutConfirm(false);
                    handleLogout();
                }}
                onCancel={() => setShowSignoutConfirm(false)}
            />
        )}
    </div>
  );
}
