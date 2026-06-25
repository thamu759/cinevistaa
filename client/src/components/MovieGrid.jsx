import { Film } from 'lucide-react';
import MovieCard from './MovieCard';

export function LoadingGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-poster" />
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Film, title, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
      <Icon size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
      {title && <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>{title}</p>}
      {message && <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>}
      {action}
    </div>
  );
}

export default function MovieGrid({ movies, onMovieClick, loading, loadingCount = 8, emptyTitle, emptyMessage, emptyAction, visibleCount, onLoadMore, totalCount }) {
  if (loading) return <LoadingGrid count={loadingCount} />;

  const displayMovies = visibleCount ? movies.slice(0, visibleCount) : movies;

  if (displayMovies.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <>
      <div className="movie-grid">
        {displayMovies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} />
        ))}
      </div>
      {onLoadMore && totalCount > visibleCount && (
        <div className="load-more-btn-container">
          <button className="btn-outline load-more-btn" onClick={onLoadMore}>
            Load More ({totalCount - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}
