import { useState, useEffect, useRef } from 'react';
import { Shuffle, Film, AlertTriangle, RotateCcw } from 'lucide-react';

const SEGMENT_COLORS = [
  'rgba(251,191,36,0.2)', 'rgba(99,102,241,0.2)',
  'rgba(52,211,153,0.2)', 'rgba(239,68,68,0.2)',
  'rgba(168,85,247,0.2)', 'rgba(14,165,233,0.2)',
  'rgba(236,72,153,0.2)', 'rgba(234,179,8,0.2)',
];

const BORDER_COLORS = [
  'rgba(251,191,36,0.4)', 'rgba(99,102,241,0.4)',
  'rgba(52,211,153,0.4)', 'rgba(239,68,68,0.4)',
  'rgba(168,85,247,0.4)', 'rgba(14,165,233,0.4)',
  'rgba(236,72,153,0.4)', 'rgba(234,179,8,0.4)',
];

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

export default function SpinWheel({ movies, onViewMovie }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
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

    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    const winnerIndex = candidates.indexOf(winner);
    const segAngle = 360 / candidates.length;

    const targetAngle = 360 * (5 + Math.floor(Math.random() * 5)) - (winnerIndex * segAngle + segAngle / 2);
    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setSelectedMovie(winner);
    }, 4000);
  };

  const segAngle = candidates.length > 0 ? 360 / candidates.length : 0;

  if (candidates.length === 0) {
    return (
      <div className="spin-wheel-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies with posters available. Add some movies first!</p>
      </div>
    );
  }

  const maxSegments = 24;
  const displayCandidates = candidates.slice(0, maxSegments);
  const displaySegAngle = 360 / displayCandidates.length;

  return (
    <div className="spin-wheel-container">
      <div className="spin-wheel-header">
        <h2>🎰 Spin the Wheel</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Feeling lucky? Spin to discover your next watch!
        </p>
      </div>

      <div className="spin-wheel-body">
        <div className="spin-wheel-area">
          <div className="spin-wheel-pointer">
            <div className="spin-wheel-pointer-inner" />
          </div>
          <div
            ref={wheelRef}
            className="spin-wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {displayCandidates.map((movie, i) => {
              const angle = i * displaySegAngle;
              const colorIdx = i % SEGMENT_COLORS.length;
              return (
                <div
                  key={movie.id}
                  className="spin-wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - displaySegAngle / 2) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - displaySegAngle / 2) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + displaySegAngle / 2) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + displaySegAngle / 2) * Math.PI / 180)}%)`,
                    background: SEGMENT_COLORS[colorIdx],
                  }}
                >
                  <span
                    className="spin-wheel-label"
                    style={{
                      transform: `rotate(${displaySegAngle / 2}deg)`,
                      fontSize: displaySegAngle < 20 ? '0.35rem' : displaySegAngle < 30 ? '0.4rem' : '0.45rem',
                    }}
                  >
                    {movie.title}
                  </span>
                </div>
              );
            })}
            <div className="spin-wheel-center">
              <Shuffle size={24} />
            </div>
          </div>
        </div>

        <div className="spin-wheel-sidebar">
          {selectedMovie ? (
            <div className="spin-wheel-result">
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-accent-gold)', fontSize: '0.85rem' }}>
                ✨ You got!
              </h3>
              <img
                src={selectedMovie.posterUrl?.replace(/w300/, 'w150') || selectedMovie.posterUrl}
                alt={selectedMovie.title}
                className="spin-wheel-result-poster"
                onClick={() => onViewMovie?.(selectedMovie.id)}
                style={{ cursor: 'pointer' }}
              />
              <h4 className="spin-wheel-result-title">{selectedMovie.title}</h4>
              <p className="spin-wheel-result-year">{getMovieYear(selectedMovie)}</p>
              <div className="spin-wheel-result-rating">
                <span>★ {selectedMovie.rating?.toFixed(1) || '—'}</span>
              </div>
              <button
                className="btn-primary"
                onClick={() => onViewMovie?.(selectedMovie.id)}
                style={{ marginTop: '0.75rem', fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
              >
                View Details
              </button>
              <button
                className="btn-secondary"
                onClick={spin}
                disabled={spinning}
                style={{ marginTop: '0.4rem', fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <RotateCcw size={14} /> Spin Again
              </button>
            </div>
          ) : (
            <div className="spin-wheel-idle">
              <Film size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                {spinning ? 'Spinning...' : 'Click the button to spin!'}
              </p>
              {!spinning && (
                <button
                  className="btn-primary"
                  onClick={spin}
                  style={{ marginTop: '0.75rem', fontSize: '0.9rem', padding: '0.5rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Shuffle size={18} /> SPIN!
                </button>
              )}
              {error && (
                <div className="spin-wheel-error">
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
