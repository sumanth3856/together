import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchAndQueuePanel } from './SearchAndQueuePanel';
import { useRoomStore } from '../../store/useRoomStore';

describe('SearchAndQueuePanel Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useRoomStore.setState({
      socketId: 'sock-1',
      roomState: {
        roomId: '123456',
        hostId: 'user-1',
        members: [{ userId: 'user-1', socketIds: ['sock-1'], nickname: 'Host' }],
        videoQueue: [
          { id: 'q-1', youtubeId: 'vid-1', title: 'Queue Video 1', addedBy: 'Host', thumbnail: '' }
        ]
      }
    });
  });

  it('renders search and queue tabs correctly', () => {
    render(<SearchAndQueuePanel />);
    expect(screen.getByTestId('tab-search')).toBeInTheDocument();
    expect(screen.getByTestId('tab-queue')).toHaveTextContent('Queue (1)');
  });

  it('switches between search and queue tabs', () => {
    render(<SearchAndQueuePanel />);
    fireEvent.click(screen.getByTestId('tab-queue'));
    expect(screen.getByTestId('queue-list-container')).toBeInTheDocument();
    expect(screen.getByText('Queue Video 1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-search'));
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('performs YouTube search and renders results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { youtubeId: 'test-123', title: 'Test YouTube Video', author: 'Test Channel', duration: '3:45', thumbnail: 'thumb.jpg' }
        ]
      })
    });

    const onAddVideo = vi.fn();
    render(<SearchAndQueuePanel onAddVideo={onAddVideo} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test video' } });
    fireEvent.click(screen.getByTestId('search-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText('Test YouTube Video')).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId('add-queue-test-123');
    fireEvent.click(addBtn);
    expect(onAddVideo).toHaveBeenCalledWith(expect.objectContaining({ youtubeId: 'test-123', title: 'Test YouTube Video' }));
  });

  it('handles direct external video URL submission', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Sample MP4 Video', url: 'https://example.com/sample.mp4' })
    });

    const onAddVideo = vi.fn();
    render(<SearchAndQueuePanel onAddVideo={onAddVideo} />);

    const directInput = screen.getByTestId('direct-url-input');
    fireEvent.change(directInput, { target: { value: 'https://example.com/sample.mp4' } });
    fireEvent.click(screen.getByTestId('direct-url-submit-btn'));

    await waitFor(() => {
      expect(onAddVideo).toHaveBeenCalledWith(expect.objectContaining({
        videoUrl: 'https://example.com/sample.mp4',
        title: 'Sample MP4 Video'
      }));
    });
  });

  it('handles playing and removing items from queue', () => {
    const onPlayVideo = vi.fn();
    const onRemoveVideo = vi.fn();
    render(<SearchAndQueuePanel onPlayVideo={onPlayVideo} onRemoveVideo={onRemoveVideo} />);

    fireEvent.click(screen.getByTestId('tab-queue'));

    const playBtn = screen.getByTestId('queue-play-0');
    fireEvent.click(playBtn);
    expect(onPlayVideo).toHaveBeenCalledWith(expect.objectContaining({ id: 'q-1', title: 'Queue Video 1' }));

    const removeBtn = screen.getByTestId('queue-remove-0');
    fireEvent.click(removeBtn);
    expect(onRemoveVideo).toHaveBeenCalledWith('q-1');
  });
});
