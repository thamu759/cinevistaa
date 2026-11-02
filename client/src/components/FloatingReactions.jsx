import { useState, useCallback, memo } from 'react';
import { Flame, Sparkles, Trophy, Award, Heart } from 'lucide-react';
import { playPopcornPop } from '../utils/cinemaAudio';

const LUXURY_PULSE_TAGS = [
  { id: 'masterpiece', icon: Flame, label: 'Masterpiece', color: '#f59e0b' },
  { id: 'visuals', icon: Sparkles, label: 'Visual Brilliance', color: '#a855f7' },
  { id: 'blockbuster', icon: Trophy, label: 'Box Office Titan', color: '#eab308' },
  { id: 'performance', icon: Award, label: 'Peak Acting', color: '#38bdf8' },
  { id: 'cult', icon: Heart, label: 'Cult Classic', color: '#f43f5e' },
];

function FloatingReactions({ movieId, compact = false }) {
  const [particles, setParticles] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [counts, setCounts] = useState(() => {
    if (!movieId || typeof window === 'undefined') {
      return { masterpiece: 184, visuals: 142, blockbuster: 228, performance: 165, cult: 198 };
    }
    const saved = localStorage.getItem(`tp_pulse_${movieId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const seed = String(movieId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      masterpiece: 140 + (seed % 120),
      visuals: 110 + ((seed * 3) % 90),
      blockbuster: 190 + ((seed * 5) % 150),
      performance: 125 + ((seed * 7) % 110),
      cult: 155 + ((seed * 2) % 130),
    };
  });

  const handlePulse = useCallback((tagId, tagColor, e) => {
    e?.stopPropagation();
    playPopcornPop();
    setActiveTag(tagId);
    setTimeout(() => setActiveTag(null), 600);

    setCounts(prev => {
      const next = { ...prev, [tagId]: (prev[tagId] || 0) + 1 };
      if (movieId && typeof window !== 'undefined') {
        localStorage.setItem(`tp_pulse_${movieId}`, JSON.stringify(next));
      }
      return next;
    });

    // Spawn subtle gold sparkle particles instead of cartoon emojis
    const newParticles = Array.from({ length: 4 }).map((_, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random()}`,
      color: tagColor,
      x: (Math.random() - 0.5) * 50,
      size: 4 + Math.random() * 5,
    }));

    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1000);
  }, [movieId]);

  return (
    <div className={`luxury-pulse-wrapper ${compact ? 'luxury-pulse--compact' : ''}`}>
      <div className="luxury-pulse-bar">
        <div className="luxury-pulse-brand">
          <span className="pulse-indicator-dot" />
          <span className="pulse-brand-title">AUDIENCE ACCLAIM</span>
        </div>

        <div className="luxury-pulse-pills">
          {LUXURY_PULSE_TAGS.map(t => {
            const Icon = t.icon;
            const isPulsing = activeTag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`luxury-pulse-btn ${isPulsing ? 'luxury-pulse-btn--active' : ''}`}
                onClick={(e) => handlePulse(t.id, t.color, e)}
                style={{ '--tag-accent': t.color }}
              >
                <Icon size={14} className="pulse-btn-icon" />
                <span className="pulse-btn-label">{t.label}</span>
                <span className="pulse-btn-count">{(counts[t.id] || 0).toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle rising sparkle particles */}
      <div className="luxury-sparkles-overlay" aria-hidden="true">
        {particles.map(p => (
          <span
            key={p.id}
            className="luxury-sparkle-dot"
            style={{
              '--sparkle-x': `${p.x}px`,
              '--sparkle-color': p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(FloatingReactions);
