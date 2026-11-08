import { proxyImageUrl } from '../api';
import brandLogo from '../assets/Thiraipedia White Logo with Yellow.png';

const CARD_WIDTH = 580;
const CARD_HEIGHT = 840;

export default function ShareCard({ movie, reviewData, cardRef }) {
  const posterSrc = movie?.posterUrl
    ? proxyImageUrl(movie.posterUrl, 'w500')
    : '';

  const releaseYear = movie?.releaseDate
    ? movie.releaseDate.split('-')[0] || movie.releaseYear
    : movie?.releaseYear || '';

  const genre = movie?.genre
    ? movie.genre.split('/').slice(0, 2).map(g => g.trim().toUpperCase()).join(' • ')
    : '';

  const director = movie?.director ? `DIR. ${movie.director.toUpperCase()}` : '';
  const score = movie?.criticScore || movie?.rating || null;
  const userRating = reviewData?.rating || null;

  return (
    <div
      ref={cardRef}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 2.25rem 1.75rem',
        boxSizing: 'border-box',
        color: '#f8fafc',
      }}
    >
      {/* Blurred Ambient Poster Glow */}
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: '-30px',
            width: 'calc(100% + 60px)',
            height: 'calc(100% + 60px)',
            objectFit: 'cover',
            opacity: 0.22,
            filter: 'blur(50px) saturate(190%) brightness(0.28)',
            transform: 'scale(1.15)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Luxury Vignette & Radial Light Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 10%, rgba(212, 175, 55, 0.18) 0%, transparent 60%), radial-gradient(ellipse at 85% 90%, rgba(99, 102, 241, 0.1) 0%, transparent 55%), linear-gradient(180deg, rgba(7,9,14,0.4) 0%, rgba(7,9,14,0.72) 40%, rgba(7,9,14,0.98) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative Outer Border Inset */}
      <div
        style={{
          position: 'absolute',
          inset: '10px',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '20px',
          pointerEvents: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* ── TOP HEADER / ARCHIVE BADGE ── */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#fbbf24',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {reviewData ? 'CRITIC VERDICT' : 'CINEMA LOG'}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 600 }}>
            THIRAIPEDIA ARCHIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>
          <span>PASS #2026</span>
          <span style={{ color: 'var(--color-accent-gold, #fbbf24)' }}>•</span>
          <span>EST. 2026</span>
        </div>
      </header>

      {/* ── HERO POSTER PRESENTATION ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '0.5rem',
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            padding: '3px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.55) 0%, rgba(255, 255, 255, 0.15) 45%, rgba(0, 0, 0, 0.6) 100%)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          }}
        >
          <div
            style={{
              width: 210,
              height: 315,
              borderRadius: '13px',
              overflow: 'hidden',
              background: '#12151e',
              position: 'relative',
            }}
          >
            {posterSrc ? (
              <img
                src={posterSrc}
                alt={movie?.title}
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
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                No Poster Artwork
              </div>
            )}
          </div>

          {/* Floating Gold Rating Badge on Poster Corner */}
          {score && (
            <div
              style={{
                position: 'absolute',
                bottom: '-12px',
                right: '-12px',
                background: 'linear-gradient(135deg, #181c28, #0b0d14)',
                border: '1.5px solid rgba(251, 191, 36, 0.5)',
                borderRadius: '50px',
                padding: '0.35rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              }}
            >
              <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>★</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                {score.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── FILM TITLE & METADATA ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          maxWidth: '92%',
          marginTop: '0.6rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            margin: '0 0 0.45rem',
            textShadow: '0 2px 16px rgba(0,0,0,0.7)',
          }}
        >
          {movie?.title || 'Untitled Cinema'}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            color: '#94a3b8',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {releaseYear && <span>{releaseYear}</span>}
          {releaseYear && genre && <span>•</span>}
          {genre && <span style={{ color: '#e2e8f0' }}>{genre}</span>}
          {director && <span>•</span>}
          {director && <span style={{ color: '#fbbf24' }}>{director}</span>}
        </div>
      </section>

      {/* ── USER REVIEW OR CRITIC VERDICT SECTION ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '510px',
          margin: '0.5rem 0 0.25rem',
        }}
      >
        {reviewData ? (
          <div
            style={{
              background: 'rgba(17, 21, 31, 0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              borderRadius: '14px',
              padding: '0.85rem 1.2rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>LOGGED BY</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                  @{reviewData.username || 'critic'}
                </span>
                <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>✓</span>
              </div>

              {userRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#fbbf24', fontSize: '0.95rem' }}>★</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24' }}>
                    {userRating}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>/10</span>
                </div>
              )}
            </div>

            {reviewData.comment && (
              <p
                style={{
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  color: '#cbd5e1',
                  fontStyle: 'italic',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                &ldquo;{reviewData.comment}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(15, 18, 28, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                CRITIC SCORE
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.15rem' }}>
                {movie?.criticScore ? `${movie.criticScore.toFixed(1)} ★` : '—'}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                COMMUNITY
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', marginTop: '0.15rem' }}>
                {movie?.rating ? `${movie.rating.toFixed(1)} ★` : '—'}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                STATUS
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e', marginTop: '0.2rem' }}>
                VERIFIED
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── FOOTER & OFFICIAL BRAND LOGO ── */}
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Ticket Perforation Dashed Line */}
        <div
          style={{
            width: '100%',
            height: '1px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.18)',
          }}
        />

        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.15rem',
          }}
        >
          {/* Official New Logo: White with Yellow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={brandLogo}
              alt="ThiraiPedia"
              crossOrigin="anonymous"
              style={{
                height: '32px',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Tagline / Website */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
              THIRAIPEDIA.COM
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
              Track films you watch. Save what you love.
            </div>
          </div>
        </div>

        {/* Decorative Cinema Barcode Strip */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: 0.28,
            paddingTop: '0.2rem',
          }}
        >
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '14px' }}>
            {[3, 1, 4, 1, 5, 2, 6, 2, 4, 1, 3, 5, 1, 2, 4, 2, 6, 1, 3, 2, 5, 1, 4, 3, 2, 6, 1, 4, 2, 5, 1, 3, 6, 2, 4].map((w, idx) => (
              <span
                key={idx}
                style={{
                  width: `${w}px`,
                  height: '100%',
                  background: '#ffffff',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>

          <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', fontFamily: 'monospace', color: '#ffffff' }}>
            {movie?.id ? `LOG-${String(movie.id).padStart(6, '0')}` : 'PASS-772910'}
          </span>
        </div>
      </footer>
    </div>
  );
}
