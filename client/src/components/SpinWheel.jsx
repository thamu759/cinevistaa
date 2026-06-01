import { useState, useEffect, useRef, useCallback } from 'react';
import { Shuffle, Film, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { proxyImageUrl } from '../api';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REEL_N = 60;
const ITEM_H = 140;

export default function SpinWheel({ movies, onViewMovie }) {
  const [spinning, setSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pulled, setPulled] = useState(false);

  const [reels, setReels] = useState({ 0: [], 1: [], 2: [] });
  const [offs, setOffs] = useState({ 0: 0, 1: 0, 2: 0 });

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
    if (eligible.length > 0) {
      setReels({
        0: Array.from({ length: REEL_N }, () => pickRandom(eligible)),
        1: Array.from({ length: REEL_N }, () => pickRandom(eligible)),
        2: Array.from({ length: REEL_N }, () => pickRandom(eligible)),
      });
    }
  }, [movies]);

  const spin = useCallback(() => {
    if (spinning || candidates.length === 0) return;
    setSpinning(true);
    setSelectedMovie(null);
    setShowConfetti(false);
    setShowResult(false);
    setPulled(true);

    const winner = pickRandom(candidates);
    const r0 = Array.from({ length: REEL_N }, () => pickRandom(candidates));
    const r1 = Array.from({ length: REEL_N }, () => pickRandom(candidates));
    const r2 = Array.from({ length: REEL_N }, () => pickRandom(candidates));
    r1[REEL_N - 1] = winner;

    setReels({ 0: r0, 1: r1, 2: r2 });
    setOffs({ 0: 0, 1: 0, 2: 0 });

    const final = (REEL_N - 1) * ITEM_H;
    setTimeout(() => {
      setOffs({ 0: final, 1: final, 2: final });
      setPulled(false);
    }, 50);

    setTimeout(() => {
      setSpinning(false);
      setSelectedMovie(winner);
      setShowConfetti(true);
      setShowResult(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 3500);
  }, [spinning, candidates]);

  if (candidates.length === 0) {
    return (
      <div className="mslot-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies available. Add some first!</p>
      </div>
    );
  }

  const renderReel = (items, offset) => (
    <div className="mslot-window">
      <div
        className="mslot-track"
        style={{
          transform: `translateY(-${Math.min(offset, items.length * ITEM_H)}px)`,
          transition: spinning ? 'transform 2.8s cubic-bezier(0.08, 0.65, 0.12, 0.98)' : 'none',
        }}
      >
        {items.map((m, i) => (
          <div key={`m-${m.id}-${i}`} className="mslot-item">
            <img
              src={proxyImageUrl(m.posterUrl, 'w92')}
              alt={i === REEL_N - 1 && !spinning ? m.title : ''}
              className="mslot-img"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mslot-wrap">
      {showConfetti && (
        <div className="mslot-confetti">
          {Array.from({ length: 45 }).map((_, i) => (
            <div key={i} className="mslot-confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              background: ['#fbbf24','#f59e0b','#eab308','#fef3c7'][Math.floor(Math.random() * 4)],
              width: `${5 + Math.random() * 7}px`,
              height: `${5 + Math.random() * 7}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      <div className="mslot-head">
        <div className="mslot-lamps">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mslot-lamp" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <h2 className="mslot-title">🎰 Movie Machine</h2>
        <p className="mslot-sub">Three reels — luck picks your movie!</p>
      </div>

      <div className="mslot-body">
        <div className="mslot-reels">
          <div className="mslot-reels-inner">
            <div className="mslot-glass" />
            <div className="mslot-reels-row">
              {renderReel(reels[0], offs[0])}
              {renderReel(reels[1], offs[1])}
              {renderReel(reels[2], offs[2])}
            </div>
            <div className="mslot-shade-top" />
            <div className="mslot-shade-bot" />
          </div>
        </div>

        <div className="mslot-side">
          <div className={`mslot-lever ${pulled ? 'mslot-lever-pull' : ''}`} onClick={spinning ? undefined : spin}>
            <div className="mslot-lever-base">
              <div className="mslot-lever-stem" />
              <div className="mslot-lever-ball">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" fill="url(#lg)" />
                  <defs><radialGradient id="lg"><stop offset="0%" stopColor="#fef3c7"/><stop offset="100%" stopColor="#f59e0b"/></radialGradient></defs>
                </svg>
              </div>
            </div>
            <span className="mslot-lever-label">PULL</span>
          </div>

          <div className="mslot-info">
            {showResult && selectedMovie ? (
              <div className="mslot-result animated-pop">
                <div className="mslot-badge"><Sparkles size={10} /> WINNER</div>
                <img src={proxyImageUrl(selectedMovie.posterUrl, 'w150')} alt={selectedMovie.title} className="mslot-poster" onClick={() => onViewMovie?.(selectedMovie.id)} />
                <h3 className="mslot-rtitle">{selectedMovie.title}</h3>
                <span className="mslot-ryear">{getMovieYear(selectedMovie)}</span>
                <div className="mslot-rstars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round((selectedMovie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} color={i < Math.round((selectedMovie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} />
                  ))}
                  <span className="mslot-rrating">{selectedMovie.rating?.toFixed(1)}</span>
                </div>
                <div className="mslot-actions">
                  <button className="mslot-btn-p" onClick={() => onViewMovie?.(selectedMovie.id)}>View Details</button>
                  <button className="mslot-btn-s" onClick={spin} disabled={spinning}><Shuffle size={12} /> Again</button>
                </div>
              </div>
            ) : spinning ? (
              <div className="mslot-spinstate">
                <div className="mslot-spinner" />
                <p>Spinning...</p>
              </div>
            ) : (
              <div className="mslot-idle">
                <div className="mslot-idle-art">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <rect x="10" y="22" width="80" height="56" rx="6" fill="none" stroke="rgba(251,191,36,0.08)" strokeWidth="1.5"/>
                    <rect x="16" y="30" width="18" height="40" rx="3" fill="rgba(251,191,36,0.03)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                    <rect x="41" y="30" width="18" height="40" rx="3" fill="rgba(251,191,36,0.03)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                    <rect x="66" y="30" width="18" height="40" rx="3" fill="rgba(251,191,36,0.03)" stroke="rgba(251,191,36,0.06)" strokeWidth="1"/>
                  </svg>
                </div>
                <p className="mslot-idle-txt">Pull the lever to start!</p>
                <button className="mslot-spinbtn" onClick={spin}><Shuffle size={14} /> <span>SPIN</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
