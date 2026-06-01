import { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Trophy, Star, RotateCcw, Calendar, User, RefreshCw, Sparkles, Zap } from 'lucide-react';
import ShareButton from './ShareButton';

const QUESTIONS_PER_GAME = 7;

const TYPES = [
  { key: 'rating', label: 'Guess the Rating', icon: Star },
  { key: 'year', label: 'Guess the Year', icon: Calendar },
  { key: 'director', label: 'Who Directed?', icon: User },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  return shuffle(arr).slice(0, count);
}

function generateQuestions(movies) {
  const eligible = movies.filter(m => m.rating != null && m.rating > 0);
  if (eligible.length < 4) return [];

  const selected = pickRandom(eligible, QUESTIONS_PER_GAME);
  const pool = shuffle(eligible);

  return selected.map(movie => {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    let question, options, correctAnswer;

    if (type.key === 'rating') {
      question = `What is the rating of "${movie.title}"?`;
      correctAnswer = movie.rating.toFixed(1);
      const wrongs = pool
        .filter(m => m.id !== movie.id && m.rating != null)
        .map(m => m.rating.toFixed(1));
      const uniqueWrongs = [...new Set(wrongs)].filter(w => w !== correctAnswer);
      const distractors = shuffle(uniqueWrongs).slice(0, 3);
      options = shuffle([correctAnswer, ...distractors]);
    } else if (type.key === 'year') {
      const year = getMovieYear(movie);
      question = `In which year was "${movie.title}" released?`;
      correctAnswer = year;
      const wrongs = pool
        .filter(m => m.id !== movie.id)
        .map(m => getMovieYear(m))
        .filter(y => y && y !== correctAnswer);
      const uniqueWrongs = [...new Set(wrongs)].filter(Boolean);
      const distractors = shuffle(uniqueWrongs).slice(0, 3);
      options = shuffle([correctAnswer, ...distractors]);
    } else {
      question = `Who directed "${movie.title}"?`;
      correctAnswer = movie.director || 'Unknown';
      const wrongs = pool
        .filter(m => m.id !== movie.id && m.director)
        .map(m => m.director)
        .filter(d => d && d !== correctAnswer);
      const uniqueWrongs = [...new Set(wrongs)].filter(Boolean);
      const distractors = shuffle(uniqueWrongs).slice(0, 3);
      if (distractors.length < 3) {
        const fill = ['Vetrimaaran', 'Mani Ratnam', 'S. S. Rajamouli', 'Lokesh Kanagaraj', 'Atlee', 'Shankar'].filter(d => d !== correctAnswer && !distractors.includes(d));
        distractors.push(...shuffle(fill).slice(0, 3 - distractors.length));
      }
      options = shuffle([correctAnswer, ...distractors]);
    }

    return {
      movieId: movie.id,
      posterUrl: movie.posterUrl,
      question,
      options,
      correctAnswer,
      type: type.key,
    };
  });
}

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

export default function QuizGame({ movies, onViewMovie }) {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [scorePop, setScorePop] = useState(false);
  const cardRef = useRef(null);

  const startGame = useCallback(() => {
    const qs = generateQuestions(movies);
    if (qs.length < 3) return;
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
    setStreak(0);
    setShowConfetti(false);
    setScorePop(false);
  }, [movies]);

  useEffect(() => {
    if (movies.length > 0) startGame();
  }, [movies, startGame]);

  const handleAnswer = (option) => {
    if (selected !== null || gameOver) return;
    setSelected(option);
    const q = questions[currentQ];
    const isCorrect = option === q.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);
    if (isCorrect) {
      setScore(prev => prev + 1);
      setScorePop(true);
      setTimeout(() => setScorePop(false), 400);
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      const pct = Math.round(((selected === questions[currentQ].correctAnswer ? score + 1 : score) / questions.length) * 100);
      setGameOver(true);
      if (pct >= 60) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
      return;
    }
    setCurrentQ(prev => prev + 1);
    setSelected(null);
    setShowResult(false);
  };

  if (questions.length < 3) {
    return (
      <div className="quiz-empty">
        <Brain size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>Not enough movies to generate a quiz. Add more movies!</p>
      </div>
    );
  }

  if (gameOver) {
    const finalScore = selected === questions[currentQ]?.correctAnswer ? score + 1 : score;
    const pct = Math.round((finalScore / questions.length) * 100);

    const confettiColors = ['#fbbf24', '#f59e0b', '#eab308', '#fef3c7', '#fcd34d'];

    return (
      <div className="quiz-wrap">
        <div className="cflip-bg-glow" />
        <div className="cflip-bg-grid" />

        {showConfetti && (
          <div className="cflip-confetti">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className="cflip-confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                background: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }} />
            ))}
          </div>
        )}

        <div className="quiz-game-over">
          <div className="quiz-go-trophy">
            <Trophy size={44} />
          </div>
          <h2>Quiz Complete!</h2>
          <div className="quiz-score-badge">
            {finalScore} <span className="quiz-score-total">/ {questions.length}</span>
          </div>
          <div className="quiz-pct">{pct}%</div>
          <div className="quiz-streak-info">
            <Zap size={14} /> Best streak: {bestStreak}
          </div>
          <div className="quiz-result-msg">
            {pct >= 80 ? '🎉 Movie Master! You really know your cinema!' :
             pct >= 50 ? '👏 Good job! Keep watching and learning!' :
             '🎬 Time to watch more movies! Try again!'}
          </div>
          <button className="quiz-btn-play" onClick={startGame}>
            <RefreshCw size={16} /> Play Again
          </button>
          <div style={{ marginTop: '1rem' }}>
            <ShareButton
              title="Movie Quiz — thiraipedia"
              text={`I scored ${finalScore}/${questions.length} (${pct}%) on the Movie Quiz! Can you beat my score?`}
              variant="text"
              label="Share Score"
            />
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const TypeIcon = TYPES.find(t => t.key === q.type)?.icon || Star;

  return (
    <div className="quiz-wrap">
      <div className="cflip-bg-glow" />
      <div className="cflip-bg-grid" />

      <div className="quiz-container" ref={cardRef}>
        <div className="quiz-header">
          <div className="quiz-brand">
            <div className="quiz-brand-icon">
              <Brain size={20} />
            </div>
            <span>Movie Quiz</span>
          </div>
          <div className="quiz-stats">
            <span className="quiz-stat">
              <Trophy size={13} />
              <span className={`quiz-stat-score ${scorePop ? 'quiz-stat-pop' : ''}`}>{score}</span>
              <span className="quiz-stat-total">/{questions.length}</span>
            </span>
            <span className="quiz-stat">
              <Zap size={13} /> {streak}
            </span>
            <span className="quiz-stat">
              {currentQ + 1}/{questions.length}
            </span>
          </div>
        </div>

        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="quiz-card animated-pop">
          <div className="quiz-card-top">
            {q.posterUrl && (
              <img
                src={q.posterUrl?.replace(/w300/, 'w150') || q.posterUrl}
                alt={q.question}
                className="quiz-poster"
              />
            )}
            <div className="quiz-type-badge">
              <TypeIcon size={11} />
              <span>{TYPES.find(t => t.key === q.type)?.label}</span>
            </div>
          </div>

          <h3 className="quiz-question">{q.question}</h3>

          <div className="quiz-options">
            {q.options.map((opt, i) => {
              let cls = 'quiz-option';
              if (selected !== null) {
                if (opt === q.correctAnswer) cls += ' quiz-option-correct';
                else if (opt === selected) cls += ' quiz-option-wrong';
                else cls += ' quiz-option-disabled';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(opt)}
                  disabled={selected !== null}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="quiz-option-text">{opt}</span>
                  {selected !== null && opt === q.correctAnswer && (
                    <span className="quiz-option-icon quiz-option-icon-correct">
                      <Sparkles size={12} />
                    </span>
                  )}
                  {selected !== null && opt === selected && opt !== q.correctAnswer && (
                    <span className="quiz-option-icon quiz-option-icon-wrong">✕</span>
                  )}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="quiz-feedback animated-pop-fast">
              <div className={`quiz-feedback-badge ${selected === q.correctAnswer ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}>
                {selected === q.correctAnswer ? (
                  <>✅ Correct! {streak > 1 && <span className="quiz-streak-badge">🔥 x{streak}</span>}</>
                ) : (
                  <>❌ Oops! Answer: <strong>{q.correctAnswer}</strong></>
                )}
              </div>
              <button className="quiz-btn-next" onClick={nextQuestion}>
                {currentQ + 1 >= questions.length ? 'See Results' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
