import { memo, useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { proxyImageUrl } from '../api';
import { playProjectorClick } from '../utils/cinemaAudio';

function MovieCard({ movie, onClick, variant = 'grid', maxGenreTags }) {
  const cardRef = useRef(null);
  const className = variant === 'horizontal' ? 'movie-card-horizontal' : 'movie-card';
  const genreTags = movie.genre
    ? movie.genre.split('/').slice(0, maxGenreTags).map(tag => tag.trim())
    : [];

  const handleMouseMove = useCallback((e) => {
    // Only apply 3D tilt on devices that support hover (not mobile/touch)
    if (!window.matchMedia('(hover: hover)').matches) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg tilt
    const rotateY = ((x - centerX) / centerX) * 9;

    card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--sheen-x', `${((x / rect.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--sheen-y', `${((y / rect.height) * 100).toFixed(1)}%`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    playProjectorClick();
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
    card.style.removeProperty('--sheen-x');
    card.style.removeProperty('--sheen-y');
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${className} cinematic-3d-card`}
      onClick={() => onClick(movie.id)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="movie-card-poster-wrapper">
        <img
          src={proxyImageUrl(movie.posterUrl, 'w300')}
          alt={movie.title}
          className="movie-card-poster"
          loading="lazy"
        />
        <div className="card-holographic-sheen" />
        <div className="movie-card-rating">
          <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
          <span>{(movie.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-genre-tags">
          {genreTags.map(tag => (
            <span key={tag} className="genre-tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(MovieCard);
