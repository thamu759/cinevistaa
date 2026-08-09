import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Trophy, Star, RefreshCw, Zap, CheckCircle2, XCircle, ScanEye, Clapperboard, Check, X } from 'lucide-react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function BlindFrame({ movies, onViewMovie }) {
  const [candidates, setCandidates] = useState([]);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [blur, setBlur] = useState(20);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scorePop, setScorePop] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
  }, [movies]);

  const startRound = useCallback(() => {
    if (candidates.length < 4) return;
    const movie = pickRandom(candidates);
    setCurrent(movie);
    setBlur(20);
    setSelected(null);
    setShowResult(false);
    setRevealed(false);
    setTimer(0);

    const wrongOptions = shuffle(candidates.filter(m => m.id !== movie.id)).slice(0, 3).map(m => m.title);
    setOptions(shuffle([movie.title, ...wrongOptions]));
  }, [candidates]);

  useEffect(() => {
    if (candidates.length >= 4) startRound();
  }, [candidates, startRound]);

  useEffect(() => {
    if (selected || !current) return;
    const interval = setInterval(() => {
      setBlur(prev => {
        const next = prev - 1.2;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
      setTimer(t => t + 1);
    }, 800);
    return () => clearInterval(interval);
  }, [selected, current]);

  const handlePick = (title) => {
    if (selected) return;
    setSelected(title);
    const correct = title === current.title;
    if (correct) {
      const bonus = Math.max(0, Math.floor((20 - blur) / 4));
      setScore(s => s + 1 + bonus);
      setScorePop(true);
      setTimeout(() => setScorePop(false), 400);
    }
    setShowResult(true);
    setRevealed(true);
    setBlur(0);
  };

  const nextRound = () => {
    if (round + 1 >= 7) {
      setGameOver(true);
      return;
    }
    setRound(r => r + 1);
    startRound();
  };

  const restart = () => {
    setScore(0);
    setRound(0);
    setGameOver(false);
    setSelected(null);
    setShowResult(false);
    setRevealed(false);
    setBlur(20);
    setTimer(0);
    startRound();
  };

  if (candidates.length < 4) {
    return (
      <div className="cflip-empty">
        <Eye size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>Not enough movies. Add more with posters!</p>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="quiz-wrap">
        <div className="cflip-bg-glow" />
        <div className="cflip-bg-grid" />
        <div className="quiz-game-over">
          <div className="quiz-go-trophy">
            <EyeOff size={40} />
          </div>
          <h2>Blind Frame Complete!</h2>
          <div className="quiz-score-badge">
            {score} <span className="quiz-score-total">pts</span>
          </div>
          <div className="quiz-pct">{Math.round((score / (7 * 8)) * 100)}% accuracy</div>
          <div className="quiz-result-msg" style={{ marginTop: '0.75rem' }}>
            {score >= 40 ? (
              <><ScanEye size={16} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} /> Eagle eye! You see through the blur!</>
            ) : score >= 20 ? (
              <><Eye size={16} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} /> Good vision! Almost there!</>
            ) : (
              <><Clapperboard size={16} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} /> Time to watch more movies!</>
            )}
          </div>
          <button className="quiz-btn-play" onClick={restart}>
            <RefreshCw size={16} /> Play Again
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="quiz-wrap">
      <div className="cflip-bg-glow" />
      <div className="cflip-bg-grid" />
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-brand">
            <div className="quiz-brand-icon">
              <Eye size={20} />
            </div>
            <span>Blind Frame</span>
          </div>
          <div className="quiz-stats">
            <span className="quiz-stat">
              <Trophy size={13} />
              <span className={`quiz-stat-score ${scorePop ? 'quiz-stat-pop' : ''}`}>{score}</span>
            </span>
            <span className="quiz-stat">
              <Zap size={13} /> {Math.round((20 - blur) / 1.2)}s
            </span>
            <span className="quiz-stat">
              Round {round + 1}/7
            </span>
          </div>
        </div>

        <div className="quiz-progress-bar" style={{ marginBottom: '1rem' }}>
          <div className="quiz-progress-fill" style={{ width: `${((round + 1) / 7) * 100}%` }} />
        </div>

        <div className="bf-frame">
          <div className="bf-img-wrap">
            <img
              src={current.posterUrl}
              alt=""
              className="bf-img"
              style={{ filter: `blur(${blur}px)` }}
            />
            <div className="bf-img-glow" />
            {!revealed && (
              <div className="bf-hint">
                Blur clearing... {Math.round((20 - blur) / 1.2)}s
              </div>
            )}
          </div>
        </div>

        <div className="bf-options">
          {options.map((title, i) => {
            let cls = 'bf-option';
            if (selected) {
              if (title === current.title) cls += ' bf-option-correct';
              else if (title === selected) cls += ' bf-option-wrong';
              else cls += ' bf-option-disabled';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handlePick(title)}
                disabled={!!selected}
              >
                <span className="bf-option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="bf-option-text">{title}</span>
                {selected && title === current.title && <span className="bf-option-check"><Check size={14} /></span>}
                {selected && title === selected && title !== current.title && <span className="bf-option-cross"><X size={14} /></span>}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="quiz-feedback animated-pop-fast">
            <div className={`quiz-feedback-badge ${selected === current.title ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}>
              {selected === current.title
                ? <><CheckCircle2 size={16} /> Spot on! +{1 + Math.max(0, Math.floor((20 - blur) / 4))} pts</>
                : <><XCircle size={16} /> That was <strong>{current.title}</strong></>}
            </div>
            <div className="bf-after">
              <button className="quiz-btn-next" onClick={() => onViewMovie?.(current.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text-muted)' }}>
                View Details
              </button>
              <button className="quiz-btn-next" onClick={nextRound}>
                {round + 1 >= 7 ? 'See Results' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
