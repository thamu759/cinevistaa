import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Film, Gamepad2, Bookmark } from 'lucide-react';

const slides = [
  {
    icon: <Star size={40} />,
    title: 'Movie Reviews & Ratings',
    desc: 'Rate films out of 10, write detailed reviews, and discover what other critics are saying.',
  },
  {
    icon: <Film size={40} />,
    title: 'Cine Reels',
    desc: 'Swipe through the latest movie news, rumors, and breaking updates — reels style!',
  },
  {
    icon: <Gamepad2 size={40} />,
    title: 'Fun Activities',
    desc: 'Test your knowledge with Movie Quiz, flip cards in Card Flix, guess blurry posters, and more!',
  },
  {
    icon: <Bookmark size={40} />,
    title: 'Watchlist & Curated Lists',
    desc: 'Save movies to your watchlist, create curated lists, and follow other critics.',
  },
];

export default function WelcomePopup({ onClose }) {
  const [current, setCurrent] = useState(0);
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
                <div className="welcome-icon-wrap">{s.icon}</div>
                <h2 className="welcome-title">{s.title}</h2>
                <p className="welcome-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="welcome-nav">
          <button
            className="welcome-nav-btn"
            onClick={prev}
            disabled={current === 0}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="welcome-dots">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`welcome-dot ${idx === current ? 'welcome-dot-active' : ''}`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
          <button className="welcome-nav-btn welcome-nav-next" onClick={next}>
            {isLast ? null : <ChevronRight size={18} />}
            {isLast ? 'Done' : null}
          </button>
        </div>
      </div>
    </div>
  );
}
