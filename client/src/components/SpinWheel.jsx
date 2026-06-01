import { useState, useEffect, useRef } from 'react';
import { Shuffle, Film, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

export default function SpinWheel({ movies, onViewMovie }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const wheelRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
  }, [movies]);

  const spin = () => {
    if (spinning || candidates.length === 0) return;
    setError('');
    setSpinning(true);
    setSelectedMovie(null);
    setShowConfetti(false);

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    const winnerIndex = candidates.indexOf(winner);
    const segAngle = 360 / candidates.length;

    const targetAngle = 360 * (5 + Math.floor(Math.random() * 5)) - (winnerIndex * segAngle + segAngle / 2);
    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setSelectedMovie(winner);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 4000);
  };

  const maxSegments = 24;

  if (candidates.length === 0) {
    return (
      <div className="wheel-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies with posters available. Add some movies first!</p>
      </div>
    );
  }

  const displayCandidates = candidates.slice(0, maxSegments);
  const displaySegAngle = 360 / displayCandidates.length;
  const totalSegments = displayCandidates.length;

  return (
    <div className="wheel-page">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="wheel-confetti">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="wheel-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                background: ['#fbbf24', '#a5b4fc', '#34d399', '#f472b6', '#fb923c'][Math.floor(Math.random() * 5)],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      <div className="wheel-header">
        <span className="wheel-emoji">🎰</span>
        <h2 className="wheel-title">Spin the Wheel</h2>
        <p className="wheel-subtitle">Feeling lucky? Spin to discover your next watch!</p>
      </div>

      <div className="wheel-body">
        <div className="wheel-left">
          <div className="wheel-pointer">
            <svg width="28" height="36" viewBox="0 0 28 36">
              <polygon points="14,36 0,0 28,0" fill="var(--color-accent-gold)" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
            </svg>
          </div>
          <div
            ref={wheelRef}
            className={`wheel-canvas ${spinning ? 'wheel-spinning' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {displayCandidates.map((movie, i) => {
              const angle = i * displaySegAngle;
              const colors = [
                'rgba(251,191,36,0.15)', 'rgba(99,102,241,0.15)',
                'rgba(52,211,153,0.15)', 'rgba(239,68,68,0.15)',
                'rgba(168,85,247,0.15)', 'rgba(14,165,233,0.15)',
                'rgba(236,72,153,0.15)', 'rgba(234,179,8,0.15)',
              ];
              const borderColors = [
                'rgba(251,191,36,0.25)', 'rgba(99,102,241,0.25)',
                'rgba(52,211,153,0.25)', 'rgba(239,68,68,0.25)',
                'rgba(168,85,247,0.25)', 'rgba(14,165,233,0.25)',
                'rgba(236,72,153,0.25)', 'rgba(234,179,8,0.25)',
              ];
              const c = i % colors.length;
              const halfAngle = displaySegAngle / 2;
              const x1 = 50 + 50 * Math.cos((angle - halfAngle) * Math.PI / 180);
              const y1 = 50 + 50 * Math.sin((angle - halfAngle) * Math.PI / 180);
              const x2 = 50 + 50 * Math.cos((angle + halfAngle) * Math.PI / 180);
              const y2 = 50 + 50 * Math.sin((angle + halfAngle) * Math.PI / 180);
              return (
                <div
                  key={movie.id}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`,
                    background: colors[c],
                    borderRight: `1px solid ${borderColors[c]}`,
                  }}
                >
                  <span
                    className="wheel-segment-text"
                    style={{
                      transform: `rotate(${halfAngle}deg) translateY(-${totalSegments > 12 ? 30 : 25}px)`,
                      fontSize: totalSegments > 18 ? '0.32rem' : totalSegments > 12 ? '0.38rem' : '0.44rem',
                    }}
                  >
                    {movie.title.length > (totalSegments > 18 ? 6 : totalSegments > 12 ? 8 : 10)
                      ? movie.title.slice(0, totalSegments > 18 ? 6 : 8) + '…'
                      : movie.title}
                  </span>
                </div>
              );
            })}
            <div className="wheel-hub">
              <Shuffle size={22} />
            </div>
            {/* decorative dots around hub */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`dot-${i}`}
                className="wheel-hub-dot"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-22px)`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="wheel-right">
          {selectedMovie ? (
            <div className="wheel-result animated-pop">
              <div className="wheel-result-badge">
                <Sparkles size={14} />
                <span>YOU GOT!</span>
              </div>
              <div className="wheel-result-poster-wrap">
                <img
                  src={selectedMovie.posterUrl?.replace(/w300/, 'w150') || selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="wheel-result-poster"
                  onClick={() => onViewMovie?.(selectedMovie.id)}
                />
                <div className="wheel-result-glow" />
              </div>
              <h3 className="wheel-result-title">{selectedMovie.title}</h3>
              <p className="wheel-result-year">{getMovieYear(selectedMovie)}</p>
              <div className="wheel-result-stars">
                {'★'.repeat(Math.round(selectedMovie.rating || 0))}
                <span className="wheel-result-rating-num"> {selectedMovie.rating?.toFixed(1)}</span>
              </div>
              <button className="btn-primary" onClick={() => onViewMovie?.(selectedMovie.id)}
                style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.4rem 1rem' }}>
                View Details
              </button>
              <button className="btn-secondary" onClick={spin} disabled={spinning}
                style={{ marginTop: '0.35rem', fontSize: '0.78rem', padding: '0.4rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCcw size={14} /> Spin Again
              </button>
            </div>
          ) : (
            <div className="wheel-idle">
              <div className="wheel-idle-art">
                <svg viewBox="0 0 200 160" width="160" height="128">
                  <circle cx="100" cy="80" r="55" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2"/>
                  <circle cx="100" cy="80" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5"/>
                  <circle cx="100" cy="80" r="12" fill="rgba(251,191,36,0.05)"/>
                  <circle cx="100" cy="80" r="4" fill="rgba(251,191,36,0.08)"/>
                  <line x1="100" y1="25" x2="100" y2="80" stroke="rgba(251,191,36,0.04)" strokeWidth="1.5"/>
                  <line x1="100" y1="80" x2="150" y2="80" stroke="rgba(245,158,11,0.04)" strokeWidth="1.5"/>
                  <line x1="100" y1="80" x2="60" y2="120" stroke="rgba(251,191,36,0.03)" strokeWidth="1"/>
                  <line x1="100" y1="80" x2="140" y2="120" stroke="rgba(245,158,11,0.03)" strokeWidth="1"/>
                  <polygon points="100,16 96,28 104,28" fill="rgba(251,191,36,0.06)"/>
                  <circle cx="155" cy="40" r="2.5" fill="rgba(251,191,36,0.06)"/>
                  <circle cx="45" cy="35" r="2" fill="rgba(245,158,11,0.04)"/>
                  <circle cx="165" cy="110" r="1.5" fill="rgba(251,191,36,0.04)"/>
                  <circle cx="35" cy="105" r="3" fill="rgba(245,158,11,0.04)"/>
                </svg>
              </div>
              <p className="wheel-idle-text">
                {spinning ? 'Spinning... Hold tight!' : 'Tap SPIN to discover a random movie!'}
              </p>
              {!spinning && (
                <button className="wheel-spin-btn" onClick={spin}>
                  <Shuffle size={20} />
                  <span>SPIN!</span>
                </button>
              )}
              {spinning && (
                <div className="wheel-spin-loader">
                  <div className="wheel-spinner-ring" />
                </div>
              )}
              {error && (
                <div className="wheel-error">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
