import { useState, useEffect, useCallback } from 'react';
import { Shuffle, Film, Sparkles, Star, RotateCw } from 'lucide-react';
import { proxyImageUrl } from '../api';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SpinWheel({ movies, onViewMovie }) {
  const [flipping, setFlipping] = useState(false);
  const [winner, setWinner] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
  }, [movies]);

  const flip = useCallback(() => {
    if (flipping || candidates.length === 0) return;
    setFlipping(true);
    setWinner(null);
    setShowConfetti(false);
    setShowResult(false);
    setFlipped(false);

    const w = pickRandom(candidates);

    setTimeout(() => {
      setFlipped(true);
    }, 1800);

    setTimeout(() => {
      setFlipping(false);
      setWinner(w);
      setShowConfetti(true);
      setShowResult(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 2800);
  }, [flipping, candidates]);

  if (candidates.length === 0) {
    return (
      <div className="cflip-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies available. Add some first!</p>
      </div>
    );
  }

  return (
    <div className="cflip-wrap">
      {showConfetti && (
        <div className="cflip-confetti">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="cflip-confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.2}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              background: ['#fbbf24','#f59e0b','#eab308','#fef3c7'][Math.floor(Math.random() * 4)],
              width: `${5 + Math.random() * 6}px`,
              height: `${5 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      <div className="cflip-head">
        <h2 className="cflip-title">🃏 Card Flip</h2>
        <p className="cflip-sub">Pick a card, any card!</p>
      </div>

      <div className="cflip-body">
        <div className="cflip-deck-area">
          <div className="cflip-deck">
            {!flipped && (
              <div className="cflip-stack">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="cflip-card-back"
                    style={{
                      left: `${i * 2}px`,
                      top: `${i * 2}px`,
                      zIndex: 5 - i,
                      transform: flipping ? `rotate(${(i - 2) * 1.5}deg) translateY(${flipping ? `${i * 3 - 5}px` : '0'})` : `rotate(${i * 1.5 - 4}deg)`,
                      animation: flipping ? `cflipRiffle 0.15s ${i * 0.05}s ease-in-out infinite alternate` : 'none',
                    }}
                  />
                ))}
              </div>
            )}

            <div className={`cflip-card ${flipped ? 'cflip-card-flipped' : ''}`}>
              <div className="cflip-card-inner">
                <div className="cflip-card-front">
                  <div className="cflip-card-pattern" />
                </div>
                <div className="cflip-card-back-face">
                  {winner ? (
                    <div className="cflip-card-content">
                      <img
                        src={proxyImageUrl(winner.posterUrl, 'w185')}
                        alt={winner.title}
                        className="cflip-card-img"
                        onClick={() => onViewMovie?.(winner.id)}
                      />
                      <div className="cflip-card-info">
                        <h3 className="cflip-card-title">{winner.title}</h3>
                        <span className="cflip-card-year">{getMovieYear(winner)}</span>
                        <div className="cflip-card-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10} fill={i < Math.round((winner.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.06)'} color={i < Math.round((winner.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.06)'} />
                          ))}
                          <span className="cflip-card-rating">{winner.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cflip-card-loading">
                      <div className="cflip-spinner-s" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showResult && winner && (
            <div className="cflip-result animated-pop">
              <div className="cflip-badge"><Sparkles size={10} /> YOUR CARD</div>
              <div className="cflip-actions">
                <button className="cflip-btn-p" onClick={() => onViewMovie?.(winner.id)}>View Details</button>
                <button className="cflip-btn-s" onClick={flip}><RotateCw size={12} /> Flip Again</button>
              </div>
            </div>
          )}
        </div>

        <div className="cflip-cta">
          {flipping ? (
            <div className="cflip-flipstate">
              <div className="cflip-spinner" />
              <p>Shuffling cards...</p>
            </div>
          ) : !showResult && (
            <button className="cflip-flipbtn" onClick={flip}>
              <Shuffle size={16} />
              <span>FLIP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
