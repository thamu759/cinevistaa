import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Film, Gamepad2, Bookmark, Sparkles } from 'lucide-react';

const slides = [
  {
    icon: <Star size={48} />,
    title: 'Movie Reviews & Ratings',
    desc: 'Rate films out of 10, write detailed reviews, and discover what other critics are saying.',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
  {
    icon: <Film size={48} />,
    title: 'Cine Reels',
    desc: 'Swipe through the latest movie news, rumors, and breaking updates — reels style!',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
  },
  {
    icon: <Gamepad2 size={48} />,
    title: 'Fun Activities',
    desc: 'Test your knowledge with Movie Quiz, flip cards in Card Flix, guess blurry posters, and more!',
    gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  },
  {
    icon: <Bookmark size={48} />,
    title: 'Watchlist & Curated Lists',
    desc: 'Save movies to your watchlist, create curated lists, and follow other critics.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
  },
];

export default function WelcomePopup({ onClose }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

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
      <div className="welcome-modal">
        <button className="welcome-skip" onClick={onClose}>Skip</button>

        <div className="welcome-slide-wrap">
          <div
            className="welcome-slides"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((s, idx) => (
              <div key={idx} className="welcome-slide">
                <div className="welcome-icon-wrap" style={{ background: s.gradient }}>
                  {s.icon}
                </div>
                <h2 className="welcome-title">{s.title}</h2>
                <p className="welcome-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="welcome-dots">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`welcome-dot ${idx === current ? 'welcome-dot-active' : ''}`}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>

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
            {isLast ? 'Get Started' : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
