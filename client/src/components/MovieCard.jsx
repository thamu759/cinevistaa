import { memo } from 'react';
import { Star } from 'lucide-react';
import { proxyImageUrl } from '../api';

function MovieCard({ movie, onClick, variant = 'grid', maxGenreTags }) {
  const className = variant === 'horizontal' ? 'movie-card-horizontal' : 'movie-card';
  const genreTags = movie.genre
    ? movie.genre.split('/').slice(0, maxGenreTags).map(tag => tag.trim())
    : [];

  return (
    <div className={className} onClick={() => onClick(movie.id)}>
      <div className="movie-card-poster-wrapper">
        <img
          src={proxyImageUrl(movie.posterUrl, 'w300')}
          alt={movie.title}
          className="movie-card-poster"
          loading="lazy"
        />
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
