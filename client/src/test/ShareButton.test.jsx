import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareButton from '../components/ShareButton';

const mockMovie = {
  id: 101,
  title: 'Vettaiyan',
  posterUrl: 'https://image.tmdb.org/t/p/w500/sample-vettaiyan.jpg',
  releaseYear: 2024,
  director: 'T. J. Gnanavel',
  rating: 8.6,
};

describe('ShareButton - Modal and Platform Trigger', () => {
  it('opens popup modal with platforms and download option on click', () => {
    render(<ShareButton movie={mockMovie} label="Share" variant="text" />);

    // Initially modal is not open
    expect(screen.queryByText('Share Film Card')).not.toBeInTheDocument();

    // Click the share button
    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    // Modal is now open
    expect(screen.getByText('Share Film Card')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('X / Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Download Film Card (PNG)')).toBeInTheDocument();

    // Close the modal
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    // Modal is closed
    expect(screen.queryByText('Share Film Card')).not.toBeInTheDocument();
  });
});

