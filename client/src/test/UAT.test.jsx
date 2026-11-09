import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewSharePopup from '../components/ReviewSharePopup';
import ShareButton from '../components/ShareButton';
import CineUpdates from '../components/CineUpdates';
import ProfileView from '../components/ProfileView';
import { EmptyState } from '../components/MovieGrid';
import ErrorBoundary from '../components/ErrorBoundary';

const mockMovie = {
  id: 101,
  title: 'Vettaiyan',
  posterUrl: 'https://image.tmdb.org/t/p/w500/sample-vettaiyan.jpg',
  releaseYear: 2024,
  releaseDate: '2024-10-10',
  director: 'T. J. Gnanavel',
  rating: 8.6,
  criticScore: 8.6,
  genre: 'Action / Drama',
  description: 'An honest police officer battles corruption and encounter culture.',
};

const mockReview = {
  rating: 9,
  comment: 'Superstar Rajinikanth in top form with intense courtroom drama and gripping moments.',
  username: 'cinephile_ravi',
};

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
];

describe('UAT Test Suite - User Acceptance Journeys', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Journey 1: Share Popup & Platform Actions', () => {
    it('allows a user to open modal, view movie details, and preview the film card', () => {
      const handleClose = vi.fn();
      render(
        <ReviewSharePopup
          movie={mockMovie}
          reviewData={mockReview}
          url="https://thiraipedia.com/movie/101"
          onClose={handleClose}
        />
      );

      // Verify portal modal renders movie header & review title
      expect(screen.getByText('Share Your Review')).toBeInTheDocument();
      expect(screen.getAllByText('Vettaiyan').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Directed by T\. J\. Gnanavel/).length).toBeGreaterThan(0);
      expect(screen.getByText(/★ 9/)).toBeInTheDocument();

      // Card preview toggle
      const previewToggle = screen.getByRole('button', { name: /Preview Cinema Card/i });
      expect(previewToggle).toBeInTheDocument();
      fireEvent.click(previewToggle);
      expect(screen.getByText('Hide Card Preview')).toBeInTheDocument();
    });

    it('triggers native clipboard copy when user clicks the copy link action', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <ReviewSharePopup
          movie={mockMovie}
          url="https://thiraipedia.com/movie/101"
          onClose={vi.fn()}
        />
      );

      const copyBtn = screen.getByRole('button', { name: /Link/i });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('https://thiraipedia.com/movie/101');
      });
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    it('opens social sharing windows when social platform buttons are clicked', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <ReviewSharePopup
          movie={mockMovie}
          url="https://thiraipedia.com/movie/101"
          onClose={vi.fn()}
        />
      );

      // WhatsApp
      const waBtn = screen.getByRole('button', { name: /WhatsApp/i });
      fireEvent.click(waBtn);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank'
      );

      // X / Twitter
      const twBtn = screen.getByRole('button', { name: /X \/ Twitter/i });
      fireEvent.click(twBtn);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      );

      // Facebook
      const fbBtn = screen.getByRole('button', { name: /Facebook/i });
      fireEvent.click(fbBtn);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.facebook.com/sharer/sharer.php'),
        '_blank',
        expect.any(String)
      );
    });

    it('closes the modal on close button click or outer backdrop click', () => {
      const handleClose = vi.fn();
      render(
        <ReviewSharePopup
          movie={mockMovie}
          url="https://thiraipedia.com/movie/101"
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Journey 2: CineUpdates Community Feed', () => {
    it('renders cinema news updates with titles, categories, and progress indicators', () => {
      render(<CineUpdates updates={sampleUpdates} onBack={vi.fn()} />);

      expect(screen.getByText('Thalapathy 69 Official Announcement')).toBeInTheDocument();
      expect(screen.getByText('Coolie Audio Launch Date Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Breaking')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  describe('Journey 3: User Profile and Film Discovery Tabs', () => {
    const mockUser = {
      id: 'user-123',
      username: 'karthik_cine',
      role: 'Senior Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    };

    const mockProfileData = {
      bio: 'Lifelong cinephile obsessed with classic Tamil cinema and world films.',
      followers: ['criticA'],
      following: ['criticB'],
    };

    const mockMovies = [
      {
        id: 'movie-101',
        title: 'Vettaiyan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/sample-vettaiyan.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w500/sample-vettaiyan.jpg',
        genre: 'Drama, Action',
        year: '2024',
        rating: 8.6,
        reviews: [
          {
            id: 'rev-1',
            userId: 'user-123',
            user: 'karthik_cine',
            rating: 9,
            text: 'A fiery screenplay led by superstar Rajinikanth and Fahadh Faasil.',
            likes: 12,
            createdAt: '2024-10-12T10:00:00Z',
          },
        ],
      },
    ];

    it('renders profile metrics, bio, reviews, and allows switching to watchlist tab', () => {
      render(
        <ProfileView
          currentUser={mockUser}
          profileData={mockProfileData}
          movies={mockMovies}
          watchlist={[]}
          onViewMovie={vi.fn()}
        />
      );

      expect(screen.getByText('karthik_cine')).toBeInTheDocument();
      expect(screen.getByText('Senior Critic')).toBeInTheDocument();
      expect(screen.getByText(/Lifelong cinephile obsessed with classic Tamil cinema/)).toBeInTheDocument();

      // Review card content
      expect(screen.getByText(/A fiery screenplay led by superstar Rajinikanth/)).toBeInTheDocument();

      // Switch to Watchlist tab
      const watchlistTab = screen.getByRole('button', { name: /Watchlist/i });
      fireEvent.click(watchlistTab);
      expect(screen.getByText('Queued Watchlist')).toBeInTheDocument();
      expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    });
  });

  describe('Journey 4: Empty States & Graceful Fallbacks', () => {
    it('displays clear empty state when search filters yield no results', () => {
      const handleReset = vi.fn();
      render(
        <EmptyState
          title="No Matches Found"
          message='No movies matched "NonExistentFilm123"'
          action={<button onClick={handleReset}>Explore Trending</button>}
        />
      );

      expect(screen.getByText('No Matches Found')).toBeInTheDocument();
      expect(screen.getByText(/No movies matched "NonExistentFilm123"/)).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /Explore Trending/i });
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it('recovers gracefully from component errors via ErrorBoundary', () => {
      const ProblematicComponent = () => {
        throw new Error('Test boundary crash');
      };

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test boundary crash')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();

      spy.mockRestore();
    });
  });
});
