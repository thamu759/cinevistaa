import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MovieGrid, { EmptyState } from '../components/MovieGrid';

describe('MovieGrid & CineEmptyState', () => {
  it('renders EmptyState with custom title, message, and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Your watchlist is empty"
        message="Curate your personal cinema queue. Bookmark must-watch films."
        action={<button onClick={handleAction}>Explore Top Rated</button>}
      />
    );

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText('Curate your personal cinema queue. Bookmark must-watch films.')).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: 'Explore Top Rated' });
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState when MovieGrid has empty movies array', () => {
    render(
      <MovieGrid
        movies={[]}
        emptyTitle="No releases match your filters"
        emptyMessage="Try adjusting the selected year or month filters above."
        emptyAction={<button>Reset Filters</button>}
      />
    );

    expect(screen.getByText('No releases match your filters')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting the selected year or month filters above.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Filters' })).toBeInTheDocument();
  });

  it('renders loading skeleton when loading is true', () => {
    const { container } = render(
      <MovieGrid
        movies={[]}
        loading={true}
        loadingCount={4}
      />
    );

    const skeletonCards = container.querySelectorAll('.skeleton-card');
    expect(skeletonCards.length).toBe(4);
  });
});

