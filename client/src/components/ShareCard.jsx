import { proxyImageUrl } from '../api';
import brandLogo from '../assets/Thiraipedia White Logo with Yellow.png';

const CARD_WIDTH = 420;
const CARD_HEIGHT = 620;

export default function ShareCard({ movie, reviewData, cardRef }) {
  const posterSrc = movie?.posterUrl
    ? proxyImageUrl(movie.posterUrl, 'w500')
    : '';

  const releaseYear = movie?.releaseDate
    ? movie.releaseDate.split('-')[0] || movie.releaseYear
    : movie?.releaseYear || '';

  const director = movie?.director || '';
  const genre = movie?.genre ? movie.genre.split('/')[0].trim() : '';

  const metaSubtitle = [releaseYear, director ? `Directed by ${director}` : genre]
    .filter(Boolean)
    .join('  ·  ');

  const rating = reviewData?.rating ?? (movie?.criticScore || movie?.rating || null);
  const displayScore = rating != null
    ? (typeof rating === 'number' ? rating.toFixed(rating % 1 === 0 ? 0 : 1) : rating)
    : null;

  const username = reviewData?.user || reviewData?.username || '';
  const reviewText = reviewData?.comment || reviewData?.text || '';

  return (
    <div
      ref={cardRef}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        background: 'radial-gradient(circle at 50% 12%, rgba(251, 191, 36, 0.05) 0%, transparent 60%), #08090d',
        fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 1.75rem 1.4rem',
        boxSizing: 'border-box',
        color: '#f8fafc',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Section: Poster & Film Header ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Theatrical Poster */}
        <div
          style={{
            width: 140,
            height: 210,
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#11141f',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          {posterSrc ? (
            <img
              src={posterSrc}
              alt={movie?.title || 'Film'}
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.75rem',
              }}
            >
              No Poster
            </div>
          )}
        </div>

        {/* Film Title */}
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: '1.1rem 0 0',
            textAlign: 'center',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            maxWidth: '360px',
          }}
        >
          {movie?.title || 'Untitled'}
        </h2>

        {/* Subtitle: Year · Director */}
        {metaSubtitle && (
          <p
            style={{
              fontSize: '0.82rem',
              color: '#8e95a5',
              margin: '0.35rem 0 0',
              textAlign: 'center',
              fontWeight: 400,
            }}
          >
            {metaSubtitle}
          </p>
        )}
      </div>

      {/* ── Middle Section: Rating & Review ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding: '0 0.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Rating Score */}
        {displayScore && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: reviewText ? '0.45rem' : '0',
            }}
          >
            <span
              style={{
                color: '#fbbf24',
                fontSize: '1.05rem',
                lineHeight: 1,
              }}
              data-testid="star-full"
            >
              ★
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {displayScore}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                fontWeight: 400,
              }}
            >
              / 10
            </span>
          </div>
        )}

        {/* Review Quote */}
        {reviewText ? (
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              color: '#cbd5e1',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '0 0 0.25rem',
              maxWidth: '350px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{reviewText}&rdquo;
          </p>
        ) : movie?.description ? (
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: '#8e95a5',
              textAlign: 'center',
              margin: '0 0 0.25rem',
              maxWidth: '350px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {movie.description}
          </p>
        ) : null}

        {/* Reviewer Username */}
        {username && (
          <span
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              marginTop: '0.2rem',
              textAlign: 'center',
            }}
          >
            Reviewed by @{username}
          </span>
        )}
      </div>

      {/* ── Bottom Section: Official Logo & Domain ── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.35rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <img
          src={brandLogo}
          alt="ThiraiPedia"
          crossOrigin="anonymous"
          style={{
            height: '22px',
            display: 'block',
            objectFit: 'contain',
          }}
        />
        <span
          style={{
            fontSize: '0.66rem',
            color: '#64748b',
            letterSpacing: '0.04em',
          }}
        >
          thiraipedia.com
        </span>
      </div>
    </div>
  );
}
