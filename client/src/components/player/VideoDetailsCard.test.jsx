import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoDetailsCard } from './VideoDetailsCard';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';

describe('VideoDetailsCard Component', () => {
  beforeEach(() => {
    useRoomStore.setState({
      roomState: {
        roomId: '483921',
        currentVideo: { title: 'Amazing Nature 4K', youtubeId: 'nature-1' },
        playback: { isPlaying: true },
        members: [{ userId: 'u1' }, { userId: 'u2' }],
      }
    });
  });

  it('renders video info and live member count', () => {
    render(<VideoDetailsCard />);
    expect(screen.getByText('Amazing Nature 4K')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('2 Watching')).toBeInTheDocument();
  });

  it('copies share link to clipboard on button click', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<VideoDetailsCard />);
    const copyBtn = screen.getByText('Copy Share Link');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('?room=483921'));
    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
  });

  it('handles manual YouTube URL submission', () => {
    const onLoadVideo = vi.fn();
    const setToast = vi.fn();
    useUIStore.setState({ setToastNotification: setToast });

    render(<VideoDetailsCard onLoadVideo={onLoadVideo} />);

    const input = screen.getByPlaceholderText('Paste YouTube, SoundCloud, or Video URL...');
    const submitBtn = screen.getByText('Load');

    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
    fireEvent.click(submitBtn);

    expect(onLoadVideo).toHaveBeenCalledWith({ youtubeId: 'dQw4w9WgXcQ' });
    expect(setToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
});
