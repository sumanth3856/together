import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import { useRoomStore } from '../../store/useRoomStore';

// Mock react-player
vi.mock('react-player', () => ({
  default: React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getCurrentTime: () => 0,
      getDuration: () => 120,
      seekTo: vi.fn(),
    }));
    return (
      <div data-testid="mock-react-player" data-url={props.url} data-playing={props.playing}>
        <button onClick={() => props.onPlay?.()} data-testid="mock-play">Play</button>
        <button onClick={() => props.onPause?.()} data-testid="mock-pause">Pause</button>
        <button onClick={() => props.onProgress?.({ playedSeconds: 25 })} data-testid="mock-progress">Progress</button>
        <button onClick={() => props.onEnded?.()} data-testid="mock-ended">End</button>
        <button onClick={() => props.onError?.(new Error('play() failed'))} data-testid="mock-error">Error</button>
      </div>
    );
  }),
}));

describe('VideoPlayer Component', () => {
  beforeEach(() => {
    useRoomStore.setState({
      socketId: 'sock-1',
      roomState: {
        roomId: '123456',
        hostId: 'user-1',
        playback: { isPlaying: false, currentTime: 0, updatedAt: Date.now() },
        settings: { allowMemberControls: true },
        members: [{ userId: 'user-1', socketIds: ['sock-1'], nickname: 'Sai' }],
      },
    });
  });

  it('renders empty state placeholder when no videoUrl is provided', () => {
    render(<VideoPlayer videoUrl="" />);
    expect(screen.getByTestId('video-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Search or paste a link to start watching')).toBeInTheDocument();
  });

  it('renders ReactPlayer with formatted YouTube URL when 11-char ID is passed', () => {
    render(<VideoPlayer videoUrl="dQw4w9WgXcQ" />);
    const player = screen.getByTestId('mock-react-player');
    expect(player).toBeInTheDocument();
    expect(player.getAttribute('data-url')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('renders ReactPlayer with direct URL for external MP4/Vimeo links', () => {
    const directUrl = 'https://example.com/video.mp4';
    render(<VideoPlayer videoUrl={directUrl} />);
    const player = screen.getByTestId('mock-react-player');
    expect(player.getAttribute('data-url')).toBe(directUrl);
  });

  it('handles playback change callbacks from player events', () => {
    const onPlaybackChange = vi.fn();
    const onVideoEnded = vi.fn();
    render(
      <VideoPlayer 
        videoUrl="https://example.com/video.mp4" 
        onPlaybackChange={onPlaybackChange} 
        onVideoEnded={onVideoEnded} 
      />
    );

    fireEvent.click(screen.getByTestId('mock-play'));
    expect(onPlaybackChange).toHaveBeenCalledWith({ isPlaying: true, currentTime: 0 });

    fireEvent.click(screen.getByTestId('mock-pause'));
    expect(onPlaybackChange).toHaveBeenCalledWith({ isPlaying: false, currentTime: 0 });

    fireEvent.click(screen.getByTestId('mock-ended'));
    expect(onVideoEnded).toHaveBeenCalled();
  });

  it('handles autoplay errors safely without crashing the player', () => {
    render(<VideoPlayer videoUrl="https://example.com/video.mp4" />);
    fireEvent.click(screen.getByTestId('mock-error'));
    // Error state should NOT show for play() failed
    expect(screen.queryByTestId('video-error-state')).not.toBeInTheDocument();
  });
});
