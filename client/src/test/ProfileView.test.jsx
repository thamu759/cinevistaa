import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfileView from '../components/ProfileView';

describe('ProfileView', () => {
  const mockUser = {
    id: 'user-123',
    username: 'cinemaniac',
    role: 'Senior Critic',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockProfileData = {
    bio: 'Cinema is a mirror of humanity.',
    followers: ['criticA', 'criticB'],
    following: ['criticC']
  };

  const mockMovies = [
    {
      id: 'movie-1',
      title: 'Aadukalam',
      posterUrl: 'https://example.com/aadukalam.jpg',
      backdropUrl: 'https://example.com/aadukalam-backdrop.jpg',
      genre: 'Drama, Action',
      year: '2011',
      rating: 8.5,
      reviews: [
        {
          id: 'rev-1',
          userId: 'user-123',
          user: 'cinemaniac',
          rating: 9,
          text: 'Brilliant rustic narrative and stellar performance by Dhanush.',
          likes: 4,
          createdAt: '2025-01-10T10:00:00Z'
        }
      ]
    },
    {
      id: 'movie-2',
      title: 'Super Deluxe',
      posterUrl: 'https://example.com/super-deluxe.jpg',
      backdropUrl: 'https://example.com/super-deluxe-backdrop.jpg',
      genre: 'Neo-Noir, Thriller',
      year: '2019',
      rating: 8.9,
      reviews: []
    }
  ];

  it('renders authentic user details, metrics, and taste DNA chips', () => {
    const { container } = render(
      <ProfileView
        currentUser={mockUser}
        profileData={mockProfileData}
        movies={mockMovies}
        watchlist={['movie-2']}
        userLists={[]}
        allUsers={[]}
        onViewMovie={vi.fn()}
      />
    );

    // Identity check
    expect(screen.getByText('cinemaniac')).toBeInTheDocument();
    expect(screen.getByText('@cinemaniac')).toBeInTheDocument();
    expect(screen.getByText('Senior Critic')).toBeInTheDocument();
    expect(screen.getByText('"Cinema is a mirror of humanity."')).toBeInTheDocument();

    // Taste DNA chips
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();

    // Metrics labels
    expect(screen.getByText('Films Logged')).toBeInTheDocument();
    expect(screen.getByText('In Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('9.0 ★')).toBeInTheDocument();

    // Values inside metric cards
    const metricVals = container.querySelectorAll('.profile-metric-val');
    expect(metricVals[0].textContent).toBe('1'); // Films Logged
    expect(metricVals[1].textContent).toBe('1'); // Watchlist
    expect(metricVals[2].textContent).toBe('9.0 ★'); // Average Rating
    expect(metricVals[3].textContent).toBe('0'); // Curated Lists

    // No AI slop check: zero fake critique accuracy
    expect(screen.queryByText(/Critique Accuracy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Interstellar/i)).not.toBeInTheDocument();
  });

  it('renders the user real review and allows switching to watchlist tab', () => {
    const handleViewMovie = vi.fn();

    render(
      <ProfileView
        currentUser={mockUser}
        profileData={mockProfileData}
        movies={mockMovies}
        watchlist={['movie-2']}
        userLists={[]}
        allUsers={[]}
        onViewMovie={handleViewMovie}
      />
    );

    // Review content should be visible under default Reviews tab
    const movieTitles = screen.getAllByText('Aadukalam');
    expect(movieTitles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('"Brilliant rustic narrative and stellar performance by Dhanush."')).toBeInTheDocument();

    // Switch to Watchlist tab
    const watchlistTab = screen.getByRole('button', { name: /Watchlist/i });
    fireEvent.click(watchlistTab);

    // Watchlist header should now be visible
    expect(screen.getByText('Queued Watchlist')).toBeInTheDocument();
    const superDeluxeTitles = screen.getAllByText('Super Deluxe');
    expect(superDeluxeTitles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders elegant empty state when user has no reviews', () => {
    render(
      <ProfileView
        currentUser={mockUser}
        profileData={mockProfileData}
        movies={[
          {
            id: 'movie-1',
            title: 'Test Film',
            posterUrl: 'https://example.com/test.jpg',
            reviews: []
          }
        ]}
        watchlist={[]}
        userLists={[]}
        allUsers={[]}
      />
    );

    expect(screen.getByText('Your cinema diary is quiet')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // Honest dash
  });
});
