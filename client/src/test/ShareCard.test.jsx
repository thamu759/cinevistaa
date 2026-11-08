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

describe('ShareCard - Minimal Cinephile Card', () => {
  it('renders official new brand logo and thiraipedia.com domain', () => {
    render(<ShareCard movie={mockMovie} />);

    // Brand logo
    const brandLogoImg = screen.getByAltText('Vettaiyan');
    expect(brandLogoImg).toBeInTheDocument();

    const logo = screen.getByAltText('ThiraiPedia');
    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain('Thiraipedia%20White%20Logo%20with%20Yellow');

    // Website link
    expect(screen.getByText('thiraipedia.com')).toBeInTheDocument();
  });

  it('renders film title, release year, and director in clean typography', () => {
    render(<ShareCard movie={mockMovie} />);

    expect(screen.getByText('Vettaiyan')).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Directed by T\. J\. Gnanavel/)).toBeInTheDocument();
  });

  it('renders brand gold rating stars and 10-point score badge', () => {
    render(<ShareCard movie={mockMovie} />);

    expect(screen.getByText('8.4')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    const starEl = screen.getByTestId('star-full');
    expect(starEl).toBeInTheDocument();
  });

  it('renders review data with username, score, and authentic quote', () => {
    const mockReviewData = {
      username: 'anirudh_fan',
      rating: 9,
      comment: 'Superstar Rajinikanth commanding screen presence with intense courtroom drama.',
    };

    render(<ShareCard movie={mockMovie} reviewData={mockReviewData} />);

    expect(screen.getByText('Reviewed by @anirudh_fan')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/Superstar Rajinikanth commanding screen presence/)).toBeInTheDocument();
  });

  it('renders synopsis cleanly when no user review is provided', () => {
    const movieWithDesc = {
      ...mockMovie,
      description: 'An honest police officer battles corruption and systemic injustice.',
    };
    render(<ShareCard movie={movieWithDesc} />);

    expect(screen.getByText(/An honest police officer battles corruption/)).toBeInTheDocument();
  });
});
