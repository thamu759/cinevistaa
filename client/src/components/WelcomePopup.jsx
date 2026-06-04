import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Film, Gamepad2, Bookmark, Sparkles } from 'lucide-react';

const slides = [
  {
    icon: <Star size={52} />,
    title: 'Movie Reviews & Ratings',
    desc: 'Rate films out of 10, write detailed reviews, and discover what other critics are saying.',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    particles: ['\u2726', '\u2605', '\u272A'],
  },
  {
    icon: <Film size={52} />,
    title: 'Cine Reels',
    desc: 'Swipe through the latest movie news, rumors, and breaking updates — reels style!',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    particles: ['\u25C8', '\u25C9', '\u2606'],
  },
  {
    icon: <Gamepad2 size={52} />,
    title: 'Fun Activities',
    desc: 'Test your knowledge with Movie Quiz, flip cards in Card Flix, guess blurry posters, and more!',
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    particles: ['\u25B3', '\u2666', '\u25CB'],
  },
  {
    icon: <Bookmark size={52} />,
    title: 'Watchlist & Curated Lists',
    desc: 'Save movies to your watchlist, create curated lists, and follow other critics.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
    particles: ['\u25A0', '\u2663', '\u25C6'],
  },
];

export default function WelcomePopup({ onClose }) {
  const [current, setCurrent] = useState(0);
  const [iconBounce, setIconBounce] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  useEffect(() => {
    setIconBounce(true);
    const t = setTimeout(() => setIconBounce(false), 500);
    return () => clearTimeout(t);
  }, [current]);

  useEffect(() => {
    if (isLast) {
      const pieces = [];
      for (let i = 0; i < 20; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          color: ['#f59e0b','#ef4444','#8b5cf6','#10b981','#ec4899','#3b82f6'][Math.floor(Math.random() * 6)],
          size: 4 + Math.random() * 8,
          delay: Math.random() * 0.8,
          drift: (Math.random() - 0.5) * 60,
        });
      }
      setConfetti(pieces);
    } else {
      setConfetti([]);
    }
  }, [isLast]);

  const next = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrent(prev => prev + 1);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent(prev => prev - 1);
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-bg-particles">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="welcome-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
              fontSize: `${10 + Math.random() * 14}px`,
              opacity: 0.12 + Math.random() * 0.15,
            }}
          >
            {['✦', '●', '♦', '✧', '∘', '❋'][i % 6]}
          </span>
        ))}
      </div>

      <div className="welcome-modal">
        <button className="welcome-skip" onClick={onClose}>Skip</button>

        {/* Progress bar */}
        <div className="welcome-progress">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`welcome-progress-step ${idx <= current ? 'welcome-progress-filled' : ''}`}
              style={{ background: idx <= current ? slide.gradient : undefined }}
            />
          ))}
        </div>

        <div className="welcome-slide-wrap">
          <div
            className="welcome-slides"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((s, idx) => (
              <div key={idx} className="welcome-slide">
                {/* Floating emojis */}
                <div className="welcome-float-emojis">
                  {s.particles.map((p, i) => (
                    <span
                      key={i}
                      className="welcome-emoji-float"
                      style={{
                        animationDelay: `${i * 1.5}s`,
                        left: `${20 + i * 30}%`,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div
                  className={`welcome-icon-wrap ${idx === current && iconBounce ? 'welcome-icon-bounce' : ''}`}
                  style={{ background: s.gradient }}
                >
                  <div className="welcome-icon-glow" style={{ background: s.gradient }} />
                  {s.icon}
                </div>

                <h2 className="welcome-title" style={{ color: '#fff' }}>{s.title}</h2>
                <p className="welcome-desc">{s.desc}</p>

                <div className="welcome-tagline" style={{ background: s.gradient }}>
                  {idx === 0 && "Critic's Choice"}
                  {idx === 1 && 'Trending Now'}
                  {idx === 2 && 'Play & Explore'}
                  {idx === 3 && 'Your Collection'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confetti */}
        {confetti.length > 0 && (
          <div className="welcome-confetti">
            {confetti.map(p => (
              <div
                key={p.id}
                className="welcome-confetti-piece"
                style={{
                  left: `${p.x}%`,
                  background: p.color,
                  width: p.size,
                  height: p.size,
                  animationDelay: `${p.delay}s`,
                  '--drift': `${p.drift}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="welcome-nav">
          <button
            className="welcome-nav-btn"
            onClick={prev}
            disabled={current === 0}
          >
            <ChevronLeft size={20} />
          </button>
          <button className="btn-primary welcome-cta" onClick={next}>
            {isLast ? (
              <><Sparkles size={16} /> Get Started</>
            ) : (
              <><span>Next</span> <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
