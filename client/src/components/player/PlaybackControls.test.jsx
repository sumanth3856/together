import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls Component', () => {
  const defaultProps = {
    currentTime: 65,
    duration: 300,
    volume: 75,
    isMuted: false,
    localPlaying: false,
    onManualPlayPause: vi.fn(),
    onSeekChange: vi.fn(),
    onVolumeChange: vi.fn(),
    onMuteToggle: vi.fn(),
    locked: false,
  };

  it('renders correctly with formatted timestamps and controls', () => {
    render(<PlaybackControls {...defaultProps} />);
    
    // 65 secs -> 1:05
    expect(screen.getByText('1:05')).toBeInTheDocument();
    // 300 secs -> 5:00
    expect(screen.getByText('5:00')).toBeInTheDocument();
    
    // Play button
    expect(screen.getByTitle('Play (Space)')).toBeInTheDocument();
    // Volume button
    expect(screen.getByTitle('Mute (M)')).toBeInTheDocument();
  });

  it('triggers onManualPlayPause when play/pause button is clicked', () => {
    const onManualPlayPause = vi.fn();
    const { rerender } = render(<PlaybackControls {...defaultProps} onManualPlayPause={onManualPlayPause} />);
    
    const playBtn = screen.getByTitle('Play (Space)');
    fireEvent.click(playBtn);
    expect(onManualPlayPause).toHaveBeenCalledTimes(1);

    // Re-render as playing
    rerender(<PlaybackControls {...defaultProps} localPlaying={true} onManualPlayPause={onManualPlayPause} />);
    const pauseBtn = screen.getByTitle('Pause (Space)');
    fireEvent.click(pauseBtn);
    expect(onManualPlayPause).toHaveBeenCalledTimes(2);
  });

  it('handles mute toggle and volume slider changes', () => {
    const onMuteToggle = vi.fn();
    const onVolumeChange = vi.fn();
    render(
      <PlaybackControls 
        {...defaultProps} 
        onMuteToggle={onMuteToggle} 
        onVolumeChange={onVolumeChange} 
      />
    );

    const muteBtn = screen.getByTitle('Mute (M)');
    fireEvent.click(muteBtn);
    expect(onMuteToggle).toHaveBeenCalledTimes(1);

    const volumeSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(volumeSlider, { target: { value: '50' } });
    expect(onVolumeChange).toHaveBeenCalled();
  });

  it('handles seek dragging and releasing', () => {
    const onSeekChange = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeekChange={onSeekChange} />);

    const seekSlider = screen.getAllByRole('slider')[1];
    fireEvent.mouseDown(seekSlider);
    fireEvent.change(seekSlider, { target: { value: '150' } });
    fireEvent.mouseUp(seekSlider);

    expect(onSeekChange).toHaveBeenCalled();
  });

  it('disables controls when locked is true', () => {
    render(<PlaybackControls {...defaultProps} locked={true} />);
    
    const playBtn = screen.getByTitle('Controls locked by host');
    expect(playBtn).toBeDisabled();

    const seekSlider = screen.getAllByRole('slider')[1];
    expect(seekSlider).toBeDisabled();
  });
});
