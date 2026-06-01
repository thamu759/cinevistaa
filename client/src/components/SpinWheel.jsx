import { useState, useEffect, useRef } from 'react';
import { Shuffle, Film, AlertTriangle, RotateCcw, Sparkles, Star } from 'lucide-react';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

const COLORS = [
  '#fbbf24', '#a78bfa', '#34d399', '#f472b6',
  '#60a5fa', '#fb923c', '#a78bfa', '#34d399',
  '#fbbf24', '#f472b6', '#60a5fa', '#fb923c',
];

const COLOR_BG = [
  'rgba(251,191,36,0.18)', 'rgba(167,139,250,0.18)', 'rgba(52,211,153,0.18)', 'rgba(244,114,182,0.18)',
  'rgba(96,165,250,0.18)', 'rgba(251,146,60,0.18)', 'rgba(167,139,250,0.18)', 'rgba(52,211,153,0.18)',
  'rgba(251,191,36,0.18)', 'rgba(244,114,182,0.18)', 'rgba(96,165,250,0.18)', 'rgba(251,146,60,0.18)',
];

export default function SpinWheel({ movies, onViewMovie }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
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
    setShowResult(false);

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
      setShowResult(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 4000);
  };

  const maxSegments = 20;

  if (candidates.length === 0) {
    return (
      <div className="wheel-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies with posters available. Add some movies first!</p>
      </div>
    );
  }

  const displayCandidates = candidates.slice(0, maxSegments);
  const segAngle = 360 / displayCandidates.length;
  const total = displayCandidates.length;

  return (
    <div className="wheel-page">
      {showConfetti && (
        <div className="wheel-confetti">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="wheel-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`,
                background: COLORS[Math.floor(Math.random() * COLORS.length)],
                width: `${5 + Math.random() * 10}px`,
                height: `${5 + Math.random() * 10}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      <div className="wheel-header">
        <div className="wheel-badge-icon">
          <Sparkles size={16} />
        </div>
        <h2 className="wheel-title">Spin the Wheel</h2>
        <p className="wheel-subtitle">Click SPIN and let fate choose your next movie</p>
      </div>

      <div className="wheel-body">
        <div className="wheel-left">
          <div className="wheel-pointer">
            <svg width="24" height="32" viewBox="0 0 24 32">
              <defs>
                <filter id="pShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)"/>
                </filter>
              </defs>
              <polygon points="12,32 0,0 24,0" fill="var(--color-accent-gold)" filter="url(#pShadow)"/>
              <polygon points="12,28 3,3 21,3" fill="rgba(0,0,0,0.15)"/>
            </svg>
          </div>
          <div
            ref={wheelRef}
            className={`wheel-canvas ${spinning ? 'wheel-spinning' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {displayCandidates.map((movie, i) => {
              const angle = i * segAngle;
              const half = segAngle / 2;
              const c = i % COLOR_BG.length;
              const r1 = (angle - half) * Math.PI / 180;
              const r2 = (angle + half) * Math.PI / 180;
              const x1 = 50 + 50 * Math.cos(r1);
              const y1 = 50 + 50 * Math.sin(r1);
              const x2 = 50 + 50 * Math.cos(r2);
              const y2 = 50 + 50 * Math.sin(r2);

              const textAngle = half;
              const textR = total > 15 ? 34 : total > 10 ? 32 : 30;
              const tx = 50 + textR * Math.cos((angle + half) * Math.PI / 180);
              const ty = 50 + textR * Math.sin((angle + half) * Math.PI / 180);

              return (
                <div
                  key={movie.id}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`,
                    background: `linear-gradient(180deg, ${COLOR_BG[c]}, ${c % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)'})`,
                  }}
                >
                  <span
                    className="wheel-seg-text"
                    style={{
                      position: 'absolute',
                      left: `${tx}%`,
                      top: `${ty}%`,
                      transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
                      fontSize: total > 16 ? '0.3rem' : total > 12 ? '0.36rem' : '0.42rem',
                      color: i % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {movie.title.length > (total > 14 ? 5 : 8)
                      ? movie.title.slice(0, total > 14 ? 5 : 8) + '…'
                      : movie.title}
                  </span>
                </div>
              );
            })}
            <div className="wheel-hub">
              <Shuffle size={20} />
            </div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`hd-${i}`}
                className="wheel-hub-dot"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-25px)`,
                  background: i % 3 === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                  width: i % 3 === 0 ? '5px' : '3px',
                  height: i % 3 === 0 ? '5px' : '3px',
                }}
              />
            ))}
          </div>
        </div>

        <div className="wheel-right">
          {showResult && selectedMovie ? (
            <div className="wheel-result animated-pop">
              <div className="wheel-result-tag">
                <Sparkles size={12} />
                <span>YOU GOT</span>
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
              <div className="wheel-result-rtng">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < Math.round((selectedMovie.rating || 0) / 2) ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.05)'}
                    color={i < Math.round((selectedMovie.rating || 0) / 2) ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.05)'}
                  />
                ))}
                <span className="wheel-result-rtng-num">{selectedMovie.rating?.toFixed(1)}</span>
              </div>
              <button className="btn-primary" onClick={() => onViewMovie?.(selectedMovie.id)}
                style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.45rem 1.2rem', borderRadius: '20px' }}>
                View Details
              </button>
              <button className="btn-secondary" onClick={spin} disabled={spinning}
                style={{ marginTop: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 1rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCcw size={12} /> Spin Again
              </button>
            </div>
          ) : spinning ? (
            <div className="wheel-spinning-state">
              <div className="wheel-spinner-ring-big" />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '1rem' }}>Spinning...</p>
            </div>
          ) : (
            <div className="wheel-idle">
              <div className="wheel-idle-art">
                <svg viewBox="0 0 180 180" width="150" height="150">
                  <defs>
                    <radialGradient id="idleGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(251,191,36,0.05)"/>
                      <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                    </radialGradient>
                  </defs>
                  <circle cx="90" cy="90" r="70" fill="url(#idleGrad)"/>
                  <circle cx="90" cy="90" r="60" fill="none" stroke="rgba(251,191,36,0.06)" strokeWidth="1.5"/>
                  <circle cx="90" cy="90" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                  <circle cx="90" cy="90" r="28" fill="none" stroke="rgba(251,191,36,0.04)" strokeWidth="0.8"/>
                  <circle cx="90" cy="90" r="8" fill="rgba(251,191,36,0.06)"/>
                  <circle cx="90" cy="90" r="3" fill="rgba(251,191,36,0.1)"/>
                  {[0,60,120,180,240,300].map((a, i) => {
                    const r = a * Math.PI / 180;
                    const x = 90 + 55 * Math.cos(r);
                    const y = 90 + 55 * Math.sin(r);
                    return <circle key={i} cx={x} cy={y} r="2.5" fill={`rgba(251,191,36,${0.04 + i * 0.01})`}/>;
                  })}
                  <polygon points="90,20 87,35 93,35" fill="rgba(251,191,36,0.06)"/>
                </svg>
              </div>
              <p className="wheel-idle-text">Discover a random movie,<br />one spin at a time.</p>
              <button className="wheel-spin-btn" onClick={spin}>
                <Shuffle size={18} />
                <span>SPIN THE WHEEL</span>
              </button>
            </div>
          )}
          {error && (
            <div className="wheel-error">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
