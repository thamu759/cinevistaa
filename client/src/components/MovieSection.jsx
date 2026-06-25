import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import AdsterraAd from './AdsterraAd';

export default function MovieSection({ subtitle, title, movies, onMovieClick, scrollRef, onViewAll, adZoneKey }) {
  return (
    <section className="movies-section" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          {subtitle && <p className="section-meta" style={{ marginBottom: '0.25rem' }}>{subtitle}</p>}
          <h2 className="section-title" style={{ marginBottom: 0 }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
            onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
            aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button className="hero-nav-btn" style={{ position: 'static', width: '32px', height: '32px', opacity: 1, transform: 'none' }}
            onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
            aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
          {onViewAll && (
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={onViewAll}>
              View All
            </button>
          )}
        </div>
      </div>
      {movies.length === 0 ? (
        <div className="skeleton-horizontal">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ flex: '0 0 160px' }}>
              <div className="skeleton skeleton-poster" />
              <div className="skeleton skeleton-text medium" />
              <div className="skeleton skeleton-text short" />
            </div>
          ))}
        </div>
      ) : (
        <div className="movie-grid-horizontal" ref={scrollRef}>
          {movies.flatMap((movie, idx) => {
            const items = [];
            if (adZoneKey && idx > 0 && idx % 6 === 0) {
              items.push(
                <div key={`ad-${idx}`} className="ad-card-hscroll">
                  <span className="ad-label-sm">Ad</span>
                  <AdsterraAd zoneKey={adZoneKey} width={300} height={250} />
                </div>
              );
            }
            items.push(
              <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} variant="horizontal" maxGenreTags={2} />
            );
            return items;
          })}
        </div>
      )}
    </section>
  );
}
