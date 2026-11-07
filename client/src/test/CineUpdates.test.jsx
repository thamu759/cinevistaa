import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CineUpdates from '../components/CineUpdates';

const sampleUpdates = [
  {
    id: 'u1',
    title: 'Thalapathy 69 Official Announcement',
    body: 'The highly anticipated final film begins filming in Chennai next week.',
    category: 'Breaking',
    movieName: 'Thalapathy 69',
    timestamp: '2 hours ago',
    likes: 42,
    likedBy: ['user1'],
  },
  {
    id: 'u2',
    title: 'Coolie Audio Launch Date Confirmed',
    body: 'Anirudh musical extravaganza set to take place in Nehru Stadium.',
    category: 'Update',
    movieName: 'Coolie',
    timestamp: '5 hours ago',
    likes: 18,
    likedBy: [],
  },
  {
    id: 'u3',
    title: 'Kaithi 2 Script Finished',
    body: 'Lokesh Kanagaraj completes the pre-production work for the LCU entry.',
    category: 'News',
    movieName: 'Kaithi 2',
    timestamp: '1 day ago',
    likes: 30,
    likedBy: [],
  },
];

describe('CineUpdates & Cine Pulse Reel Experience', () => {
  it('renders elegant empty state when no updates exist', () => {
    const handleBack = vi.fn();
    render(<CineUpdates updates={[]} onBack={handleBack} />);

    expect(screen.getByText('No Cine Pulse Updates Yet')).toBeInTheDocument();
    expect(screen.getByText('Back to Cinema Home')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Cinema Home'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders updates with titles, categories, bodies, and progress indicators', () => {
    render(
      <CineUpdates
        updates={sampleUpdates}
        currentUser={{ username: 'testuser' }}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Cine Pulse')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText('Thalapathy 69 Official Announcement')).toBeInTheDocument();
    expect(screen.getByText('Breaking')).toBeInTheDocument();
    expect(screen.getByText('Coolie Audio Launch Date Confirmed')).toBeInTheDocument();
  });

  it('navigates next and previous using desktop chevron buttons', () => {
    // Mock scrollIntoView in jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(
      <CineUpdates
        updates={sampleUpdates}
        currentUser={{ username: 'testuser' }}
        onBack={vi.fn()}
      />
    );

    const prevBtn = screen.getByLabelText('Previous update');
    const nextBtn = screen.getByLabelText('Next update');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('calls onLike when like action button is clicked', () => {
    const handleLike = vi.fn();
    render(
      <CineUpdates
        updates={sampleUpdates}
        currentUser={{ username: 'testuser' }}
        onLike={handleLike}
        onBack={vi.fn()}
      />
    );

    const likeButtons = screen.getAllByLabelText('Like this update');
    fireEvent.click(likeButtons[0]);

    expect(handleLike).toHaveBeenCalledWith('u1');
  });

  it('handles Escape key to trigger onBack', () => {
    const handleBack = vi.fn();
    render(
      <CineUpdates
        updates={sampleUpdates}
        currentUser={{ username: 'testuser' }}
        onBack={handleBack}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});

