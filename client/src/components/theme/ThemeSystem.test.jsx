import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomHeader } from '../room/RoomHeader';
import { LandingPage } from '../landing/LandingPage';
import { VideoPlayer } from '../player/VideoPlayer';
import { useUIStore } from '../../store/useUIStore';

// Mock Next navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Theme System Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    useUIStore.setState({ theme: 'dark' });
  });

  it('renders theme toggle in RoomHeader and toggles theme when clicked', () => {
    render(
      <RoomHeader 
        roomId="123456" 
        onLeaveRoom={vi.fn()} 
        user={{ id: 'u1', email: 'test@example.com' }} 
      />
    );

    const themeToggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(themeToggleBtn).toBeDefined();

    // Toggle theme to light
    fireEvent.click(themeToggleBtn);
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('beingus-theme')).toBe('light');
  });

  it('renders theme toggle in LandingPage header and toggles theme when clicked', () => {
    render(<LandingPage onCreateRoom={vi.fn()} onJoinRoom={vi.fn()} user={null} />);

    const themeToggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(themeToggleBtn).toBeDefined();

    fireEvent.click(themeToggleBtn);
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('preserves VideoPlayer instance and does not unmount when theme toggles', () => {
    const handlePlaybackChange = vi.fn();
    const { container, rerender } = render(
      <VideoPlayer
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        onPlaybackChange={handlePlaybackChange}
        onVideoEnded={vi.fn()}
      />
    );

    // Initial check: container exists
    const playerContainer = container.firstChild;
    expect(playerContainer).toBeDefined();

    // Toggle theme
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');

    // Rerender as React would on store update
    rerender(
      <VideoPlayer
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        onPlaybackChange={handlePlaybackChange}
        onVideoEnded={vi.fn()}
      />
    );

    // Container remains present and unchanged
    expect(container.firstChild).toBe(playerContainer);
  });
});
