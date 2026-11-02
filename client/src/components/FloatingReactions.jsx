import { useState, useCallback, memo } from 'react';
import { playPopcornPop } from '../utils/cinemaAudio';

const REACTION_TYPES = [
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'whistle', emoji: '🎺', label: 'Whistle' },
  { id: 'popcorn', emoji: '🍿', label: 'Popcorn' },
  { id: 'claps', emoji: '👏', label: 'Claps' },
  { id: 'mass', emoji: '💥', label: 'Mass' },
];

function FloatingReactions({ movieId, movieTitle, compact = false }) {
  const [particles, setParticles] = useState([]);
  const [counts, setCounts] = useState(() => {
    if (!movieId || typeof window === 'undefined') return { fire: 142, whistle: 98, popcorn: 76, claps: 110, mass: 185 };
    const saved = localStorage.getItem(`tp_reacts_${movieId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Seed initial organic counts based on movieId
    const seed = String(movieId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      fire: 120 + (seed % 150),
      whistle: 80 + ((seed * 3) % 110),
      popcorn: 60 + ((seed * 5) % 90),
      claps: 95 + ((seed * 7) % 120),
      mass: 140 + ((seed * 2) % 180),
    };
  });

  const handleReact = useCallback((reactionId, emoji, e) => {
    e?.stopPropagation();
    playPopcornPop();

    // Increment count
    setCounts(prev => {
      const next = { ...prev, [reactionId]: (prev[reactionId] || 0) + 1 };
      if (movieId && typeof window !== 'undefined') {
        localStorage.setItem(`tp_reacts_${movieId}`, JSON.stringify(next));
      }
      return next;
    });

    // Spawn 3 floating particles with random trajectories
    const newParticles = Array.from({ length: 3 }).map((_, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random()}`,
      emoji,
      x: (Math.random() - 0.5) * 60,
      scale: 0.9 + Math.random() * 0.5,
      rotation: (Math.random() - 0.5) * 40,
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles after animation finishes (1.2s)
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1200);
  }, [movieId]);

  return (
    <div className={`cinema-reactions-container ${compact ? 'cinema-reactions-compact' : ''}`}>
      <div className="cinema-reactions-bar">
        <span className="cinema-reactions-title">
          <span>LIVE FAN PULSE</span>
        </span>
        <div className="cinema-reactions-buttons">
          {REACTION_TYPES.map(r => (
            <button
              key={r.id}
              type="button"
              className="cinema-reaction-btn"
              onClick={(e) => handleReact(r.id, r.emoji, e)}
              title={`${r.label} - Click to react!`}
            >
              <span className="reaction-emoji">{r.emoji}</span>
              <span className="reaction-count">{(counts[r.id] || 0).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating particles portal */}
      <div className="floating-particles-overlay" aria-hidden="true">
        {particles.map(p => (
          <span
            key={p.id}
            className="floating-emoji-particle"
            style={{
              '--particle-x': `${p.x}px`,
              '--particle-scale': p.scale,
              '--particle-rot': `${p.rotation}deg`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

export default memo(FloatingReactions);

