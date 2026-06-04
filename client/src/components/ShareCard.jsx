import { proxyImageUrl } from '../api';

const CARD_W = 600;
const CARD_H = 800;
const STORY_W = 540;
const STORY_H = 960;

const baseStyles = {
  card: {
    container: {
      width: CARD_W, height: CARD_H, position: 'relative', overflow: 'hidden',
      fontFamily: "'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background: '#0f0f1a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem', boxSizing: 'border-box',
    },
    bgPoster: {
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      objectFit: 'cover', opacity: 0.15, filter: 'blur(20px)', transform: 'scale(1.1)',
    },
    gradientOverlay: {
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg,rgba(15,15,26,0.3) 0%,rgba(15,15,26,0.85) 50%,rgba(15,15,26,1) 100%)',
    },
    goldenPattern: {
      position: 'absolute', inset: 0, zIndex: 1,
      background: 'radial-gradient(circle at 25% 35%,rgba(251,191,36,0.1) 0%,transparent 55%),radial-gradient(circle at 75% 65%,rgba(251,191,36,0.08) 0%,transparent 50%)',
    },
    posterOuter: {
      position: 'relative', zIndex: 2, borderRadius: 14, padding: 2,
      background: 'linear-gradient(135deg,rgba(251,191,36,0.4),rgba(251,191,36,0.15))',
      marginBottom: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    },
    posterWrap: { width: 220, height: 330, borderRadius: 12, overflow: 'hidden' },
    poster: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    title: {
      position: 'relative', zIndex: 2, fontSize: '1.6rem', fontWeight: 800,
      color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: '0.5rem', maxWidth: '80%',
    },
    meta: {
      position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center',
      gap: '0.75rem', marginBottom: '0.75rem',
    },
    year: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 },
    genre: {
      fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', padding: '0.15rem 0.5rem',
      borderRadius: 4, background: 'rgba(255,255,255,0.06)',
    },
    rating: {
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      position: 'relative', zIndex: 2, marginBottom: '1rem',
    },
    star: { color: '#f5c518', fontSize: '1.3rem' },
    score: { fontSize: '1.1rem', fontWeight: 700, color: '#fff' },
    scoreMax: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 },
    branding: {
      position: 'absolute', bottom: '1.5rem', zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    brandLogoImg: { height: 28, display: 'block' },
  },
  story: {
    container: {
      width: STORY_W, height: STORY_H, position: 'relative', overflow: 'hidden',
      fontFamily: "'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background: '#0f0f1a', boxSizing: 'border-box',
    },
    bgPoster: {
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      objectFit: 'cover', opacity: 0.06, filter: 'blur(40px)',
    },
    gradientOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
      background: 'linear-gradient(180deg,transparent 0%,rgba(15,15,26,0.3) 30%,rgba(15,15,26,0.92) 70%,#0f0f1a 100%)',
    },
    goldenPattern: {
      position: 'absolute', inset: 0, zIndex: 1,
      background: 'radial-gradient(circle at 50% 80%,rgba(251,191,36,0.06) 0%,transparent 60%)',
    },
    posterWrap: {
      position: 'absolute', top: 0, left: 0, right: 0, height: '58%', overflow: 'hidden',
    },
    poster: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    title: {
      position: 'absolute', bottom: '30%', left: 0, right: 0, zIndex: 2,
      fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center',
      lineHeight: 1.25, padding: '0 2rem',
    },
    meta: {
      position: 'absolute', bottom: '22%', left: 0, right: 0, zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    },
    year: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 },
    genre: {
      fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', padding: '0.15rem 0.5rem',
      borderRadius: 4, background: 'rgba(255,255,255,0.06)',
    },
    rating: {
      position: 'absolute', bottom: '15%', left: 0, right: 0, zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    },
    star: { color: '#f5c518', fontSize: '1.5rem' },
    score: { fontSize: '1.3rem', fontWeight: 700, color: '#fff' },
    scoreMax: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 },
    branding: {
      position: 'absolute', bottom: '2rem', left: 0, right: 0, zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    brandLogoImg: { height: 24, display: 'block' },
  },
};

export default function ShareCard({ movie, cardRef, variant = 'card' }) {
  const s = baseStyles[variant] || baseStyles.card;
  const posterSrc = movie?.posterUrl ? proxyImageUrl(movie.posterUrl, variant === 'story' ? 'original' : 'w500') : '';
  const releaseYear = movie?.releaseDate ? movie.releaseDate.split('-')[0] || movie.releaseYear : movie?.releaseYear || '';
  const genre = movie?.genre ? movie.genre.split('/')[0].trim() : '';

  return (
    <div ref={cardRef} style={s.container}>
      {posterSrc && <img src={posterSrc} alt="" style={s.bgPoster} crossOrigin="anonymous" />}
      <div style={s.gradientOverlay} />
      <div style={s.goldenPattern} />

      {variant === 'story' ? (
        <>
          <div style={s.posterWrap}>
            {posterSrc ? (
              <img src={posterSrc} alt={movie?.title} style={s.poster} crossOrigin="anonymous" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
            )}
          </div>
          <div style={s.title}>{movie?.title || 'Untitled'}</div>
          <div style={s.meta}>
            {releaseYear && <span style={s.year}>{releaseYear}</span>}
            {genre && <span style={s.genre}>{genre}</span>}
          </div>
          <div style={s.rating}>
            <span style={s.star}>★</span>
            <span style={s.score}>{movie?.criticScore?.toFixed(1) || movie?.rating?.toFixed(1) || '—'}</span>
            <span style={s.scoreMax}>/10</span>
          </div>
        </>
      ) : (
        <>
          <div style={s.posterOuter}>
            <div style={s.posterWrap}>
              {posterSrc ? (
                <img src={posterSrc} alt={movie?.title} style={s.poster} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                  No Poster
                </div>
              )}
            </div>
          </div>
          <div style={s.title}>{movie?.title || 'Untitled'}</div>
          <div style={s.meta}>
            {releaseYear && <span style={s.year}>{releaseYear}</span>}
            {genre && <span style={s.genre}>{genre}</span>}
          </div>
          <div style={s.rating}>
            <span style={s.star}>★</span>
            <span style={s.score}>{movie?.criticScore?.toFixed(1) || movie?.rating?.toFixed(1) || '—'}</span>
            <span style={s.scoreMax}>/10</span>
          </div>
        </>
      )}

      <div style={s.branding}>
        <img src="https://res.cloudinary.com/di0j4psxz/image/upload/v1780591749/New_Project_3_cn7had.png" alt="ThiraiPedia" style={s.brandLogoImg} />
      </div>
    </div>
  );
}
