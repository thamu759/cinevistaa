import { proxyImageUrl } from '../api';

const CARD_WIDTH = 600;
const CARD_HEIGHT = 800;

const styles = {
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: '#0f0f1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    boxSizing: 'border-box',
  },
  bgPoster: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.15,
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
  },
  gradientOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(15,15,26,0.3) 0%, rgba(15,15,26,0.85) 50%, rgba(15,15,26,1) 100%)',
  },
  goldenPattern: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    opacity: 0.12,
    backgroundImage: `
      repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(251,191,36,0.15) 40px, rgba(251,191,36,0.15) 41px),
      repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(251,191,36,0.15) 40px, rgba(251,191,36,0.15) 41px),
      radial-gradient(circle at 30% 40%, rgba(251,191,36,0.08) 0%, transparent 50%),
      radial-gradient(circle at 70% 60%, rgba(251,191,36,0.08) 0%, transparent 50%)
    `,
  },
  posterWrap: {
    position: 'relative',
    zIndex: 2,
    width: 220,
    height: 330,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 2px rgba(251,191,36,0.25)',
    marginBottom: '1.5rem',
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  title: {
    position: 'relative',
    zIndex: 2,
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: '0.5rem',
    maxWidth: '80%',
  },
  meta: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  year: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 500,
  },
  genre: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    padding: '0.15rem 0.5rem',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.06)',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    position: 'relative',
    zIndex: 2,
    marginBottom: '1rem',
  },
  star: {
    color: '#f5c518',
    fontSize: '1.3rem',
  },
  score: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
  },
  scoreMax: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 400,
  },
  branding: {
    position: 'absolute',
    bottom: '1.5rem',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImg: {
    height: 28,
    display: 'block',
  },
};

export default function ShareCard({ movie, cardRef }) {
  const posterSrc = movie?.posterUrl
    ? proxyImageUrl(movie.posterUrl, 'w500')
    : '';

  const releaseYear = movie?.releaseDate
    ? movie.releaseDate.split('-')[0] || movie.releaseYear
    : movie?.releaseYear || '';

  const genre = movie?.genre ? movie.genre.split('/')[0].trim() : '';

  return (
    <div ref={cardRef} style={styles.container}>
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          style={styles.bgPoster}
          crossOrigin="anonymous"
        />
      )}
      <div style={styles.gradientOverlay} />
      <div style={styles.goldenPattern} />

      <div style={styles.posterWrap}>
        {posterSrc ? (
          <img src={posterSrc} alt={movie?.title} style={styles.poster} crossOrigin="anonymous" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
            No Poster
          </div>
        )}
      </div>

      <div style={styles.title}>{movie?.title || 'Untitled'}</div>

      <div style={styles.meta}>
        {releaseYear && <span style={styles.year}>{releaseYear}</span>}
        {genre && <span style={styles.genre}>{genre}</span>}
      </div>

      <div style={styles.rating}>
        <span style={styles.star}>★</span>
        <span style={styles.score}>
          {movie?.criticScore?.toFixed(1) || movie?.rating?.toFixed(1) || '—'}
        </span>
        <span style={styles.scoreMax}>/10</span>
      </div>

      <div style={styles.branding}>
        <img
          src="https://res.cloudinary.com/di0j4psxz/image/upload/v1780591749/New_Project_3_cn7had.png"
          alt="ThiraiPedia"
          style={styles.brandLogoImg}
        />
      </div>
    </div>
  );
}
