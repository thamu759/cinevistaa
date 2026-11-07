import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CineShowcasePromo from '../components/CineShowcasePromo';

describe('CineShowcasePromo', () => {
  const mockMovies = [
    {
      id: 'movie-1',
      title: 'Master',
      rating: 9.2,
      releaseYear: 2021,
      language: 'Tamil',
      posterUrl: 'https://example.com/master.jpg',
      reviews: [
        { id: 'r1', text: 'Stellar cinematography and performances' },
        { id: 'r2', text: 'Loved the interval sequence' }
      ]
    },
    {
      id: 'movie-2',
      title: 'Inception',
      rating: 8.8,
      releaseYear: 2010,
      language: 'English',
      posterUrl: 'https://example.com/inception.jpg',
      reviews: [
        { id: 'r3', text: 'Mind bending dream layers' }
      ]
    },
    {
      id: 'movie-3',
      title: 'Jai Bhim',
      rating: 8.7,
      releaseYear: 2021,
      language: 'Tamil',
      posterUrl: 'https://example.com/jaibhim.jpg',
      reviews: []
    },
    {
      id: 'movie-4',
      title: 'Super Deluxe',
      rating: 8.4,
      releaseYear: 2019,
      language: 'Tamil',
      posterUrl: 'https://example.com/superdeluxe.jpg',
      reviews: [
        { id: 'r4', text: 'Eclectic masterpiece' }
      ]
    }
  ];

  const mockUsers = [
    { id: 'u1', username: 'critic_alpha' },
    { id: 'u2', username: 'cinema_lens' },
    { id: 'u3', username: 'noir_scribe' }
  ];

  it('renders authentic community metrics computed from real movie and review data', () => {
    const { container } = render(
      <CineShowcasePromo
        movies={mockMovies}
        allUsers={mockUsers}
        currentUser={null}
      />
    );

    // Headline and branding badge
    expect(screen.getByText('Community')).toBeDefined();
    expect(screen.getByText(/Track films you watch. Save what you love./i)).toBeDefined();

    // Metrics validation via metric cards
    const metricCards = container.querySelectorAll('.cine-promo-metric-card');
    expect(metricCards.length).toBe(4);

    // 1. Films: 4+
    expect(within(metricCards[0]).getByText('4+')).toBeDefined();
    expect(within(metricCards[0]).getByText('Films')).toBeDefined();

    // 2. Reviews: 2 + 1 + 0 + 1 = 4+
    expect(within(metricCards[1]).getByText('4+')).toBeDefined();
    expect(within(metricCards[1]).getByText('Reviews')).toBeDefined();

    // 3. Avg Score: (9.2 + 8.8 + 8.7 + 8.4) / 4 = 8.8
    expect(within(metricCards[2]).getByText('8.8')).toBeDefined();
    expect(within(metricCards[2]).getByText('Avg score')).toBeDefined();

    // 4. Members: 3+
    expect(within(metricCards[3]).getByText('3+')).toBeDefined();
    expect(within(metricCards[3]).getByText('Members')).toBeDefined();
  });

  it('renders the 3D poster fan with the top 3 rated movies and fires onMovieClick', () => {
    const handleMovieClick = vi.fn();
    const { container } = render(
      <CineShowcasePromo
        movies={mockMovies}
        allUsers={mockUsers}
        currentUser={null}
        onMovieClick={handleMovieClick}
      />
    );

    // Top 3 are Master (9.2), Inception (8.8), and Jai Bhim (8.7)
    expect(screen.getByText('Master')).toBeDefined();
    expect(screen.getByText('Inception')).toBeDefined();
    expect(screen.getByText('Jai Bhim')).toBeDefined();
    // 4th movie Super Deluxe should NOT be in the top 3 fan
    expect(screen.queryByText('Super Deluxe')).toBeNull();

    // 3 cards in fan stage
    const fanCards = container.querySelectorAll('.promo-fan-card');
    expect(fanCards.length).toBe(3);

    // Center card (Master #1)
    const masterCard = screen.getByLabelText(/Master/i);
    expect(masterCard).toBeDefined();
    fireEvent.click(masterCard);
    expect(handleMovieClick).toHaveBeenCalledWith('movie-1');

    // Also supports Enter key navigation
    fireEvent.keyDown(masterCard, { key: 'Enter', code: 'Enter' });
    expect(handleMovieClick).toHaveBeenCalledTimes(2);
  });

  it('shows guest CTAs and handles join and explore clicks when logged out', () => {
    const handleJoinClick = vi.fn();
    const handleExploreClick = vi.fn();

    render(
      <CineShowcasePromo
        movies={mockMovies}
        allUsers={mockUsers}
        currentUser={null}
        onJoinClick={handleJoinClick}
        onExploreClick={handleExploreClick}
      />
    );

    const joinBtn = screen.getByRole('button', { name: /Create account/i });
    const exploreBtn = screen.getByRole('button', { name: /Explore top rated/i });

    expect(joinBtn).toBeDefined();
    expect(exploreBtn).toBeDefined();

    fireEvent.click(joinBtn);
    expect(handleJoinClick).toHaveBeenCalledTimes(1);

    fireEvent.click(exploreBtn);
    expect(handleExploreClick).toHaveBeenCalledTimes(1);
  });

  it('shows member CTAs and handles diary and lists clicks when logged in', () => {
    const handleDiaryClick = vi.fn();
    const handleListsClick = vi.fn();

    render(
      <CineShowcasePromo
        movies={mockMovies}
        allUsers={mockUsers}
        currentUser={{ id: 'critic-99', username: 'kurosawa_fan' }}
        onDiaryClick={handleDiaryClick}
        onListsClick={handleListsClick}
      />
    );

    const diaryBtn = screen.getByRole('button', { name: /View your profile/i });
    const listsBtn = screen.getByRole('button', { name: /Browse lists/i });

    expect(diaryBtn).toBeDefined();
    expect(listsBtn).toBeDefined();

    fireEvent.click(diaryBtn);
    expect(handleDiaryClick).toHaveBeenCalledTimes(1);

    fireEvent.click(listsBtn);
    expect(handleListsClick).toHaveBeenCalledTimes(1);
  });

  it('handles empty movie list gracefully without crashing', () => {
    const { container } = render(
      <CineShowcasePromo
        movies={[]}
        allUsers={[]}
        currentUser={null}
      />
    );

    const metricCards = container.querySelectorAll('.cine-promo-metric-card');
    expect(metricCards.length).toBe(4);
    expect(within(metricCards[0]).getByText('0+')).toBeDefined();
    expect(within(metricCards[0]).getByText('Films')).toBeDefined();
    expect(within(metricCards[1]).getByText('0+')).toBeDefined();
    expect(within(metricCards[1]).getByText('Reviews')).toBeDefined();
  });
});
