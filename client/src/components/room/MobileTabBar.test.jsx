import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileTabBar } from './MobileTabBar';

describe('MobileTabBar Component', () => {
  it('renders tabs and badges correctly', () => {
    const onSelectTab = vi.fn();
    render(
      <MobileTabBar 
        activeTab="video" 
        onSelectTab={onSelectTab} 
        memberCount={3} 
        chatCount={5} 
      />
    );

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Guests (3)')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Chat'));
    expect(onSelectTab).toHaveBeenCalledWith('chat');
  });
});
