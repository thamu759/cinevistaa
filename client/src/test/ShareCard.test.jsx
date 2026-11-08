import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareCard from '../components/ShareCard';

const mockMovie = {
  id: 101,
  title: 'Vettaiyan',
  posterUrl: 'https://image.tmdb.org/t/p/w500/sample-vettaiyan.jpg',
  releaseYear: 2024,
  genre: 'Action / Drama',
  director: 'T. J. Gnanavel',
  criticScore: 8.4,
  rating: 8.6,
};

describe('ShareCard - Luxury Cinema Pass', () => {
  it('renders official new brand logo and cinema pass header', () => {
    render(<ShareCard movie={mockMovie} />);

    // Brand logo
    const brandLogoImg = screen.getByAltText('ThiraiPedia');
    expect(brandLogoImg).toBeInTheDocument();
    expect(brandLogoImg.src).toContain('Thiraipedia%20White%20Logo%20with%20Yellow');

    // Header & website
    expect(screen.getByText('CINEMA LOG')).toBeInTheDocument();
    expect(screen.getByText('THIRAIPEDIA ARCHIVE')).toBeInTheDocument();
    expect(screen.getByText('THIRAIPEDIA.COM')).toBeInTheDocument();
  });

  it('renders movie title, release year, genres, and director', () => {
    render(<ShareCard movie={mockMovie} />);

    expect(screen.getByText('Vettaiyan')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('ACTION • DRAMA')).toBeInTheDocument();
    expect(screen.getByText('DIR. T. J. GNANAVEL')).toBeInTheDocument();
  });

  it('renders general movie share with critic and community scores', () => {
    render(<ShareCard movie={mockMovie} />);

    expect(screen.getByText('CRITIC SCORE')).toBeInTheDocument();
    expect(screen.getByText('8.4 ★')).toBeInTheDocument();
    expect(screen.getByText('COMMUNITY')).toBeInTheDocument();
    expect(screen.getByText('8.6 ★')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  it('renders review data with reviewer username, rating, and quote', () => {
    const mockReviewData = {
      username: 'anirudh_fan',
      rating: 9,
      comment: 'Superstar Rajinikanth commanding screen presence with intense courtroom drama.',
    };

    render(<ShareCard movie={mockMovie} reviewData={mockReviewData} />);

    expect(screen.getByText('CRITIC VERDICT')).toBeInTheDocument();
    expect(screen.getByText('@anirudh_fan')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/Superstar Rajinikanth commanding screen presence/)).toBeInTheDocument();
  });

  it('renders cinema pass log serial number', () => {
    render(<ShareCard movie={mockMovie} />);

    expect(screen.getByText('LOG-000101')).toBeInTheDocument();
  });
});
