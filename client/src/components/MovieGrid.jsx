import { memo } from 'react';
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
    <div className="cine-empty-state">
      <div className="cine-empty-state-icon">
        <Icon size={28} />
      </div>
      {title && <h3 className="cine-empty-state-title">{title}</h3>}
      {message && <p className="cine-empty-state-desc">{message}</p>}
      {action && <div className="cine-empty-state-action">{action}</div>}
    </div>
  );
}

function MovieGrid({ movies, onMovieClick, loading, loadingCount = 8, emptyTitle, emptyMessage, emptyAction, visibleCount, onLoadMore, totalCount }) {
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

export default memo(MovieGrid);
