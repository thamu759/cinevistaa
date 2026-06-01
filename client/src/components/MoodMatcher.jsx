import { useState, useEffect, useCallback } from 'react';
import { Smile, Frown, Zap, Heart, Skull, Sparkles, Shuffle, Star, Play, RotateCw } from 'lucide-react';

const MOODS = [
  { key: 'happy', icon: Smile, label: 'Happy', emoji: '😊', color: '#fbbf24' },
  { key: 'sad', icon: Frown, label: 'Sad', emoji: '😢', color: '#818cf8' },
  { key: 'thriller', icon: Zap, label: 'Thriller', emoji: '⚡', color: '#f472b6' },
  { key: 'romantic', icon: Heart, label: 'Romantic', emoji: '❤️', color: '#fb7185' },
  { key: 'scary', icon: Skull, label: 'Scary', emoji: '👻', color: '#a78bfa' },
  { key: 'inspiring', icon: Sparkles, label: 'Inspiring', emoji: '✨', color: '#34d399' },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMovieYear(m) {
  return m.releaseYear || m.releaseDate?.split('-')[0] || '';
}

export default function MoodMatcher({ movies, onViewMovie }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [movie, setMovie] = useState(null);
  const [showMovie, setShowMovie] = useState(false);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    const eligible = movies.filter(m => m.posterUrl);
    setCandidates(eligible);
  }, [movies]);

  const pickMovie = useCallback((mood) => {
    if (candidates.length === 0) return;
    setSelectedMood(mood);
    setShowMovie(false);
    setPicked(false);
    setTimeout(() => {
      const m = pickRandom(candidates);
      setMovie(m);
      setShowMovie(true);
      setPicked(true);
    }, 500);
  }, [candidates]);

  if (candidates.length === 0) {
    return (
      <div className="cflip-empty">
        <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>Not enough movies. Add some first!</p>
      </div>
    );
  }

  return (
    <div className="quiz-wrap">
      <div className="cflip-bg-glow" />
      <div className="cflip-bg-grid" />
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-brand">
            <div className="quiz-brand-icon">
              <Sparkles size={20} />
            </div>
            <span>Mood Matcher</span>
          </div>
          <p className="cflip-sub">How are you feeling today?</p>
        </div>

        <div className="mm-moods">
          {MOODS.map(mood => {
            const Icon = mood.icon;
            const isActive = selectedMood?.key === mood.key;
            return (
              <button
                key={mood.key}
                className={`mm-mood-btn ${isActive ? 'mm-mood-active' : ''}`}
                style={{
                  '--mood-color': mood.color,
                  borderColor: isActive ? mood.color : 'var(--color-border)',
                  background: isActive ? `${mood.color}15` : 'rgba(255,255,255,0.02)',
                }}
                onClick={() => pickMovie(mood)}
                disabled={picked && !showMovie}
              >
                <Icon size={22} style={{ color: mood.color }} />
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>

        {selectedMood && !showMovie && (
          <div className="mm-loading">
            <div className="cflip-spinner" />
            <p>Finding a {selectedMood.label.toLowerCase()} movie...</p>
          </div>
        )}

        {showMovie && movie && (
          <div className="mm-result animated-pop">
            <div className="mm-mood-tag" style={{ background: `${selectedMood.color}15`, borderColor: `${selectedMood.color}30`, color: selectedMood.color }}>
              {selectedMood.emoji} Feeling {selectedMood.label}
            </div>
            <div className="mm-card">
              <div className="mm-poster-wrap" onClick={() => onViewMovie?.(movie.id)}>
                <img src={movie.posterUrl} alt={movie.title} className="mm-poster" />
                <div className="mm-poster-overlay" />
              </div>
              <div className="mm-info">
                <h3 className="mm-title">{movie.title}</h3>
                <span className="mm-year">{getMovieYear(movie)}</span>
                <div className="mm-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10} fill={i < Math.round((movie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} color={i < Math.round((movie.rating || 0) / 2) ? '#fbbf24' : 'rgba(255,255,255,0.04)'} />
                  ))}
                  <span className="mm-rating">{movie.rating?.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="mm-actions">
              <button className="quiz-btn-next" onClick={() => onViewMovie?.(movie.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text-muted)' }}>
                <Play size={12} /> View Details
              </button>
              <button className="quiz-btn-next" onClick={() => pickMovie(selectedMood)}>
                <Shuffle size={12} /> Another One
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
