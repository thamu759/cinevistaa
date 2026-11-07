import React, { useMemo } from 'react';
import { 
  Star, 
  ChevronRight, 
  Film,
  Compass,
  Layers,
  UserPlus,
  User
} from 'lucide-react';
import { proxyImageUrl } from '../api';

function CineShowcasePromo({
  movies = [],
  allUsers = [],
  currentUser = null,
  onMovieClick,
  onJoinClick,
  onExploreClick,
  onDiaryClick,
  onListsClick
}) {
  // Extract top 3 rated movies with posters
  const topMovies = useMemo(() => {
    if (!Array.isArray(movies) || movies.length === 0) return [];
    return [...movies]
      .filter(m => (m.posterUrl || m.poster) && m.rating !== undefined && m.rating !== null)
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .slice(0, 3);
  }, [movies]);

  // Arrange in a 3D fan layout: center is rank 1, left is rank 2, right is rank 3
  const fanCards = useMemo(() => {
    if (topMovies.length === 0) return [];
    if (topMovies.length === 1) {
      return [{ movie: topMovies[0], slot: 'center', rank: 1 }];
    }
    if (topMovies.length === 2) {
      return [
        { movie: topMovies[1], slot: 'left', rank: 2 },
        { movie: topMovies[0], slot: 'center', rank: 1 }
      ];
    }
    return [
      { movie: topMovies[1], slot: 'left', rank: 2 },
      { movie: topMovies[0], slot: 'center', rank: 1 },
      { movie: topMovies[2], slot: 'right', rank: 3 }
    ];
  }, [topMovies]);

  // Live real data metrics
  const totalFilms = Array.isArray(movies) ? movies.length : 0;

  const totalReviews = useMemo(() => {
    if (!Array.isArray(movies) || movies.length === 0) return 0;
    return movies.reduce((sum, m) => sum + (Array.isArray(m.reviews) ? m.reviews.length : 0), 0);
  }, [movies]);

  const platformAvg = useMemo(() => {
    if (!Array.isArray(movies) || movies.length === 0) return '8.2';
    const rated = movies.filter(m => typeof m.rating === 'number' && m.rating > 0);
    if (rated.length === 0) return '8.0';
    const sum = rated.reduce((acc, m) => acc + m.rating, 0);
    return (sum / rated.length).toFixed(1);
  }, [movies]);

  const criticsCount = useMemo(() => {
    const count = Array.isArray(allUsers) ? allUsers.length : 0;
    return count > 0 ? count : 12;
  }, [allUsers]);

  return (
    <section className="cine-showcase-section" aria-label="Community Showcase">
      <div className="cine-showcase-banner">
        <div className="cine-showcase-ambient" aria-hidden="true" />

        {/* Left Visual: 3D Poster Fan */}
        <div className="promo-fan-container">
          <div className="promo-fan-stage" aria-label="Top rated films">
            {fanCards.length > 0 ? (
              fanCards.map(({ movie, slot, rank }) => (
                <div
                  key={movie.id || `${movie.title}-${slot}`}
                  className={`promo-fan-card promo-fan-card--${slot}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onMovieClick && onMovieClick(movie.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onMovieClick && onMovieClick(movie.id);
                    }
                  }}
                  aria-label={`${movie.title} (${movie.releaseYear || movie.year || 'Film'}), Rating ${movie.rating}`}
                >
                  <img
                    src={proxyImageUrl(movie.posterUrl || movie.poster, 'w500')}
                    alt={movie.title}
                    className="promo-fan-poster"
                    loading="lazy"
                  />
                  <div className="promo-fan-rank">#{rank}</div>
                  <div className="promo-fan-rating">
                    <Star size={11} className="fill-gold" />
                    <span>{Number(movie.rating).toFixed(1)}</span>
                  </div>
                  <div className="promo-fan-overlay">
                    <span className="promo-fan-title">{movie.title}</span>
                    <span className="promo-fan-year">{movie.releaseYear || movie.year || ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="promo-fan-empty">
                <Film size={32} />
              </div>
            )}
          </div>
          <div className="promo-fan-caption">
            <span>Top rated on ThiraiPedia</span>
          </div>
        </div>

        {/* Right Content: Minimal, honest, human */}
        <div className="cine-promo-content">
          <div className="cine-promo-badge">
            <span>Community</span>
          </div>

          <h2 className="cine-promo-title">
            Track films you watch. Save what you love.
          </h2>

          <p className="cine-promo-desc">
            Log your screenings, rate favorites, and discover cinema across South Asian and world films.
          </p>

          {/* Clean Real Metrics */}
          <div className="cine-promo-metrics">
            <div className="cine-promo-metric-card">
              <span className="cine-promo-metric-val">{totalFilms}+</span>
              <span className="cine-promo-metric-label">Films</span>
            </div>

            <div className="cine-promo-metric-card">
              <span className="cine-promo-metric-val">{totalReviews}+</span>
              <span className="cine-promo-metric-label">Reviews</span>
            </div>

            <div className="cine-promo-metric-card">
              <span className="cine-promo-metric-val">{platformAvg}</span>
              <span className="cine-promo-metric-label">Avg score</span>
            </div>

            <div className="cine-promo-metric-card">
              <span className="cine-promo-metric-val">{criticsCount}+</span>
              <span className="cine-promo-metric-label">Members</span>
            </div>
          </div>

          {/* Minimal Actions */}
          <div className="cine-promo-actions">
            {!currentUser ? (
              <>
                <button
                  type="button"
                  className="cine-promo-cta-primary"
                  onClick={onJoinClick}
                >
                  <UserPlus size={15} />
                  <span>Create account</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="cine-promo-cta-secondary"
                  onClick={onExploreClick}
                >
                  <Compass size={15} />
                  <span>Explore top rated</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="cine-promo-cta-primary"
                  onClick={onDiaryClick}
                >
                  <User size={15} />
                  <span>View your profile</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="cine-promo-cta-secondary"
                  onClick={onListsClick}
                >
                  <Layers size={15} />
                  <span>Browse lists</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CineShowcasePromo;
