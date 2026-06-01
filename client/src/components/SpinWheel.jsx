import { useState, useEffect, useRef } from 'react';
import { Shuffle, Film, AlertTriangle, Sparkles, Star, RotateCw } from 'lucide-react';
import { proxyImageUrl } from '../api';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REEL_ITEMS = 60;

export default function SpinWheel({ movies, onViewMovie }) {
  const [spinning, setSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [reelCandidates, setReelCandidates] = useState([]);
  const [reelOffset, setReelOffset] = useState(0);
  const [leverPulled, setLeverPulled] = useState(false);
  const reelRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
    if (eligible.length > 0) {
      const init = Array.from({ length: REEL_ITEMS }, () => pickRandom(eligible));
      setReelCandidates(init);
    }
  }, [movies]);

  const spin = () => {
    if (spinning || candidates.length === 0) return;
    setSpinning(true);
    setSelectedMovie(null);
    setShowConfetti(false);
    setShowResult(false);
    setLeverPulled(true);

    const winner = pickRandom(candidates);
    const pool = [];
    for (let i = 0; i < REEL_ITEMS; i++) {
      pool.push(pickRandom(candidates));
    }
    const winnerIdx = REEL_ITEMS - 1 - Math.floor(Math.random() * 4);
    pool[winnerIdx] = winner;
    setReelCandidates(pool);
    setReelOffset(0);

    const totalH = pool.length * 140;
    setTimeout(() => {
      setReelOffset(totalH - 140 * 3);
      setLeverPulled(false);
    }, 50);

    setTimeout(() => {
      setSpinning(false);
      setSelectedMovie(winner);
      setShowConfetti(true);
      setShowResult(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 3500);
  };

  if (candidates.length === 0) {
    return (
      <div className="slot-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies available. Add some first!</p>
      </div>
    );
  }

  return (
    <div className="slot-wrap">
      {showConfetti && (
        <div className="slot-confetti">
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={i}
              className="slot-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                background: ['#fbbf24','#f59e0b','#eab308','#fef3c7'][Math.floor(Math.random() * 4)],
                width: `${5 + Math.random() * 7}px`,
                height: `${5 + Math.random() * 7}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      <div className="slot-head">
        <div className="slot-lamps">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="slot-lamp" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <h2 className="slot-title">🎰 Movie Machine</h2>
        <p className="slot-sub">Pull the lever — let luck decide!</p>
      </div>

      <div className="slot-body">
        <div className="slot-reel-area">
          <div className="slot-glass" />
          <div className="slot-reel-viewport">
            <div
              ref={reelRef}
              className="slot-reel-track"
              style={{
                transform: `translateY(-${Math.min(reelOffset, reelCandidates.length * 140)}px)`,
                transition: spinning ? 'transform 3s cubic-bezier(0.08, 0.65, 0.12, 0.98)' : 'none',
              }}
            >
              {reelCandidates.map((m, i) => (
                <div key={`${m.id}-${i}`} className="slot-reel-item">
                  <img
                    src={proxyImageUrl(m.posterUrl, 'w92')}
                    alt=""
                    className="slot-reel-img"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="slot-reel-shade-top" />
          <div className="slot-reel-shade-bot" />
          <div className="slot-reel-border-l" />
          <div className="slot-reel-border-r" />
        </div>

        <div className="slot-side">
          <div className={`slot-lever ${leverPulled ? 'slot-lever-pull' : ''}`} onClick={spinning ? undefined : spin}>
            <div className="slot-lever-base">
              <div className="slot-lever-stem" />
              <div className="slot-lever-ball">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="#f59e0b" strokeWidth="1.5" fill="url(#lg)" />
                  <defs><radialGradient id="lg"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#f59e0b"/></radialGradient></defs>
                </svg>
              </div>
            </div>
            <span className="slot-lever-label">PULL</span>
          </div>

          <div className="slot-info">
            {showResult && selectedMovie ? (
              <div className="slot-result animated-pop">
                <div className="slot-result-badge">
                  <Sparkles size={10} /> WINNER
                </div>
                <img
                  src={proxyImageUrl(selectedMovie.posterUrl, 'w150')}
                  alt={selectedMovie.title}
                  className="slot-result-poster"
                  onClick={() => onViewMovie?.(selectedMovie.id)}
                />
                <h3 className="slot-result-title">{selectedMovie.title}</h3>
                <span className="slot-result-year">{getMovieYear(selectedMovie)}</span>
                <div className="slot-result-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < Math.round((selectedMovie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'}
                      color={i < Math.round((selectedMovie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'}
                    />
                  ))}
                  <span className="slot-result-rating">{selectedMovie.rating?.toFixed(1)}</span>
                </div>
                <div className="slot-result-actions">
                  <button className="slot-btn-p" onClick={() => onViewMovie?.(selectedMovie.id)}>
                    View Details
                  </button>
                  <button className="slot-btn-s" onClick={spin} disabled={spinning}>
                    <RotateCw size={12} /> Again
                  </button>
                </div>
              </div>
            ) : spinning ? (
              <div className="slot-spinstate">
                <div className="slot-spinner" />
                <p>Spinning...</p>
              </div>
            ) : (
              <div className="slot-idle">
                <div className="slot-idle-art">
                  <svg viewBox="0 0 100 100" width="90" height="90">
                    <rect x="10" y="20" width="80" height="60" rx="6" fill="none" stroke="rgba(251,191,36,0.08)" strokeWidth="1.5"/>
                    <rect x="18" y="28" width="18" height="22" rx="3" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                    <rect x="41" y="28" width="18" height="22" rx="3" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                    <rect x="64" y="28" width="18" height="22" rx="3" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                    <circle cx="37" cy="43" r="4" fill="rgba(251,191,36,0.06)"/>
                    <circle cx="50" cy="43" r="4" fill="rgba(251,191,36,0.06)"/>
                    <circle cx="63" cy="43" r="4" fill="rgba(251,191,36,0.06)"/>
                    <rect x="18" y="55" width="64" height="14" rx="3" fill="rgba(251,191,36,0.02)" stroke="rgba(251,191,36,0.04)" strokeWidth="1"/>
                  </svg>
                </div>
                <p className="slot-idle-txt">Pull the lever to start!</p>
                <button className="slot-spinbtn" onClick={spin}>
                  <Shuffle size={16} />
                  <span>SPIN</span>
                </button>
              </div>
            )}
            {!spinning && !showResult && (
              <p className="slot-hint">{candidates.length} movies loaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
