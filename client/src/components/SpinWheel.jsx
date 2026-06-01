import { useState, useEffect, useRef } from 'react';
import { Shuffle, Film, AlertTriangle, RotateCcw, Sparkles, Star } from 'lucide-react';

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

const SEG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA',
  '#FF8A5C', '#2ED573', '#F368E0', '#0ABDE3',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#01A3A4',
];

const SEG_BG = [
  'rgba(255,107,107,0.25)', 'rgba(78,205,196,0.25)', 'rgba(255,230,109,0.25)', 'rgba(167,139,250,0.25)',
  'rgba(255,138,92,0.25)', 'rgba(46,213,115,0.25)', 'rgba(243,104,224,0.25)', 'rgba(10,189,227,0.25)',
  'rgba(255,159,243,0.25)', 'rgba(84,160,255,0.25)', 'rgba(95,39,205,0.25)', 'rgba(1,163,164,0.25)',
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

  const maxSegments = 16;

  if (candidates.length === 0) {
    return (
      <div className="wheel-empty">
        <Film size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No movies available. Add some first!</p>
      </div>
    );
  }

  const display = candidates.slice(0, maxSegments);
  const segAngle = 360 / display.length;

  return (
    <div className="cwheel-wrap">
      {showConfetti && (
        <div className="wheel-confetti" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="wheel-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`,
                background: SEG_COLORS[Math.floor(Math.random() * SEG_COLORS.length)],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: ['50%', '2px', '4px'][Math.floor(Math.random() * 3)],
              }}
            />
          ))}
        </div>
      )}

      <div className="cwheel-head">
        <h2 className="cwheel-title">🎰 Spin the Wheel</h2>
        <p className="cwheel-sub">Give it a spin — let luck pick your movie!</p>
      </div>

      <div className="cwheel-body">
        <div className="cwheel-left">
          <div className="cwheel-pointer">
            <svg width="28" height="34" viewBox="0 0 28 34">
              <polygon points="14,34 2,0 26,0" fill="#FF6B6B" stroke="#fff" strokeWidth="1.5"/>
              <circle cx="14" cy="10" r="4" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div
            ref={wheelRef}
            className={`cwheel-canvas ${spinning ? 'cwheel-spin' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {display.map((movie, i) => {
              const angle = i * segAngle;
              const half = segAngle / 2;
              const c = i % SEG_BG.length;
              const r1 = (angle - half) * Math.PI / 180;
              const r2 = (angle + half) * Math.PI / 180;
              const x1 = 50 + 50 * Math.cos(r1);
              const y1 = 50 + 50 * Math.sin(r1);
              const x2 = 50 + 50 * Math.cos(r2);
              const y2 = 50 + 50 * Math.sin(r2);
              const midR = (angle) * Math.PI / 180;
              const tx = 50 + 33 * Math.cos(midR);
              const ty = 50 + 33 * Math.sin(midR);

              return (
                <div
                  key={movie.id}
                  className="cwheel-seg"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`,
                    background: SEG_BG[c],
                    border: `0.5px solid ${SEG_COLORS[c]}`,
                  }}
                >
                  <span
                    className="cwheel-txt"
                    style={{
                      position: 'absolute',
                      left: `${tx}%`,
                      top: `${ty}%`,
                      transform: `translate(-50%, -50%) rotate(${half}deg)`,
                      color: SEG_COLORS[c],
                      fontWeight: 700,
                      fontSize: display.length > 12 ? '0.32rem' : display.length > 8 ? '0.38rem' : '0.44rem',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    {movie.title.length > (display.length > 10 ? 5 : 7)
                      ? movie.title.slice(0, display.length > 10 ? 5 : 7) + '…'
                      : movie.title}
                  </span>
                </div>
              );
            })}
            <div className="cwheel-hub">
              <Shuffle size={20} />
            </div>
            <div className="cwheel-hub-ring" />
          </div>
        </div>

        <div className="cwheel-right">
          {showResult && selectedMovie ? (
            <div className="cwheel-rwrap animated-pop">
              <div className="cwheel-rtag">
                <Sparkles size={11} />
                <span>YOU GOT!</span>
              </div>
              <div className="cwheel-rposter-wrap">
                <img
                  src={selectedMovie.posterUrl?.replace(/w300/, 'w150') || selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="cwheel-rposter"
                  onClick={() => onViewMovie?.(selectedMovie.id)}
                />
                <div className="cwheel-rglow" />
              </div>
              <h3 className="cwheel-rtitle">{selectedMovie.title}</h3>
              <p className="cwheel-ryear">{getMovieYear(selectedMovie)}</p>
              <div className="cwheel-rstars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill={i < Math.round((selectedMovie.rating || 0) / 2) ? '#FF6B6B' : 'rgba(255,255,255,0.06)'}
                    color={i < Math.round((selectedMovie.rating || 0) / 2) ? '#FF6B6B' : 'rgba(255,255,255,0.06)'}
                  />
                ))}
                <span className="cwheel-rnum">{selectedMovie.rating?.toFixed(1)}</span>
              </div>
              <button className="cwheel-btn-p" onClick={() => onViewMovie?.(selectedMovie.id)}>
                View Details
              </button>
              <button className="cwheel-btn-s" onClick={spin} disabled={spinning}>
                <RotateCcw size={12} /> Spin Again
              </button>
            </div>
          ) : spinning ? (
            <div className="cwheel-spinstate">
              <div className="cwheel-spinner" />
              <p>Spinning...</p>
            </div>
          ) : (
            <div className="cwheel-idle">
              <div className="cwheel-idle-svg">
                <svg viewBox="0 0 160 160" width="130" height="130">
                  <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,107,107,0.1)" strokeWidth="2"/>
                  <circle cx="80" cy="80" r="45" fill="none" stroke="rgba(78,205,196,0.08)" strokeWidth="1.5"/>
                  <circle cx="80" cy="80" r="28" fill="none" stroke="rgba(255,230,109,0.06)" strokeWidth="1"/>
                  <circle cx="80" cy="80" r="10" fill="rgba(255,107,107,0.08)"/>
                  <circle cx="80" cy="80" r="4" fill="rgba(255,107,107,0.15)"/>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
                    const r = a * Math.PI / 180;
                    const x = 80 + 52 * Math.cos(r);
                    const y = 80 + 52 * Math.sin(r);
                    const colors = ['rgba(255,107,107,0.1)', 'rgba(78,205,196,0.1)', 'rgba(255,230,109,0.1)', 'rgba(167,139,250,0.1)'];
                    return <circle key={i} cx={x} cy={y} r="3.5" fill={colors[i % 4]}/>;
                  })}
                  <polygon points="80,15 77,26 83,26" fill="rgba(255,107,107,0.15)"/>
                </svg>
              </div>
              <p className="cwheel-idle-txt">Click SPIN and let fate decide!</p>
              <button className="cwheel-spinbtn" onClick={spin}>
                <Shuffle size={18} />
                <span>SPIN!</span>
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
