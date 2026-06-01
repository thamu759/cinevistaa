import { useState, useEffect, useCallback, useRef } from 'react';
import { Shuffle, Film, Sparkles, Star, Ticket } from 'lucide-react';
import { proxyImageUrl } from '../api';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SpinWheel({ movies, onViewMovie }) {
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [ticketRise, setTicketRise] = useState(false);
  const imgRef = useRef(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
  }, [movies]);

  const draw = useCallback(() => {
    if (drawing || candidates.length === 0) return;
    setDrawing(true);
    setWinner(null);
    setShowConfetti(false);
    setShowResult(false);
    setTicketRise(false);
    setImgFailed(false);

    const w = pickRandom(candidates);

    setTimeout(() => {
      setTicketRise(true);
    }, 1800);

    setTimeout(() => {
      setDrawing(false);
      setWinner(w);
      setShowConfetti(true);
      setShowResult(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 3200);
  }, [drawing, candidates]);

  if (candidates.length === 0) {
    return (
      <div className="ldraw-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies available. Add some first!</p>
      </div>
    );
  }

  return (
    <div className="ldraw-wrap">
      {showConfetti && (
        <div className="ldraw-confetti">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="ldraw-confetti-piece" style={{
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

      <div className="ldraw-head">
        <h2 className="ldraw-title">🎟️ Lucky Draw</h2>
        <p className="ldraw-sub">One ticket wins — is it yours?</p>
      </div>

      <div className="ldraw-body">
        <div className="ldraw-drum-wrap">
          <div className="ldraw-drum">
            {drawing && !ticketRise && (
              <div className="ldraw-shake-tickets">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="ldraw-ticket-chip" style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${15 + Math.random() * 55}%`,
                    transform: `rotate(${Math.random() * 60 - 30}deg)`,
                    animationDelay: `${Math.random() * 0.8}s`,
                    animationDuration: `${0.3 + Math.random() * 0.4}s`,
                  }}>
                    <Ticket size={11} />
                  </div>
                ))}
              </div>
            )}

            {!drawing && !showResult && (
              <div className="ldraw-idle-tickets">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="ldraw-idle-ticket" style={{
                    left: `${18 + i * 8}%`,
                    top: `${25 + (i % 4) * 12}%`,
                    transform: `rotate(${i * 7 - 20}deg)`,
                  }}>
                    <Ticket size={13} />
                  </div>
                ))}
              </div>
            )}

            {ticketRise && (
              <div className="ldraw-winning-ticket">
                <Ticket size={20} />
              </div>
            )}
          </div>

          {showResult && winner && (
            <div className="ldraw-result animated-pop">
              <div className="ldraw-badge"><Sparkles size={10} /> WINNER</div>
              {imgFailed ? (
                <div className="ldraw-poster-fallback">
                  <Film size={28} />
                </div>
              ) : (
                <img
                  ref={imgRef}
                  src={winner.posterUrl?.replace(/\/w\d+/, '/w185') || winner.posterUrl}
                  alt={winner.title}
                  className="ldraw-poster"
                  onClick={() => onViewMovie?.(winner.id)}
                  onError={(e) => {
                    e.target.src = winner.posterUrl;
                    e.target.onerror = () => setImgFailed(true);
                  }}
                />
              )}
              <h3 className="ldraw-rtitle">{winner.title}</h3>
              <span className="ldraw-ryear">{getMovieYear(winner)}</span>
              <div className="ldraw-rstars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill={i < Math.round((winner.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} color={i < Math.round((winner.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} />
                ))}
                <span className="ldraw-rrating">{winner.rating?.toFixed(1)}</span>
              </div>
              <div className="ldraw-actions">
                <button className="ldraw-btn-p" onClick={() => onViewMovie?.(winner.id)}>View Details</button>
                <button className="ldraw-btn-s" onClick={draw}><Shuffle size={12} /> Draw Again</button>
              </div>
            </div>
          )}
        </div>

        {!showResult && (
          <div className="ldraw-cta">
            {drawing ? (
              <div className="ldraw-drawstate">
                <div className="ldraw-spinner" />
                <p>Mixing tickets...</p>
              </div>
            ) : (
              <button className="ldraw-drawbtn" onClick={draw}>
                <Ticket size={16} />
                <span>DRAW</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
