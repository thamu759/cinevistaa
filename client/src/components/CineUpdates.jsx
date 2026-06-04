import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Share2, ChevronUp, ChevronDown, MessageSquare, ChevronLeft, Film } from 'lucide-react';
import { proxyImageUrl } from '../api';

const CATEGORY_COLORS = {
  'Breaking': '#ef4444',
  'Rumor': '#f59e0b',
  'News': '#3b82f6',
  'Update': '#10b981',
  'Box Office': '#8b5cf6',
  'Interview': '#ec4899',
  'Review': '#14b8a6',
};

export default function CineUpdates({ updates = [], onLike, onShare, currentUser, onBack, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [likedAnim, setLikedAnim] = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const containerRef = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const update = updates[currentIndex];

  const goNext = useCallback(() => {
    if (isTransitioning || currentIndex >= updates.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [currentIndex, updates.length, isTransitioning]);

  const goPrev = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [currentIndex, isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setTouchStart(e.touches[0].clientY);
    setTouchDelta(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    e.preventDefault();
    const delta = touchStart - e.touches[0].clientY;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    const absDelta = Math.abs(touchDelta);
    const velocity = absDelta / 150;
    if (absDelta > 50 || velocity > 0.5) {
      if (touchDelta > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const handleLike = (id) => {
    setLikedAnim(id);
    setTimeout(() => setLikedAnim(null), 350);
    onLike?.(id);
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} — ${item.body}`,
          url: window.location.href
        });
      } catch {}
    } else {
      onShare?.(item);
    }
  };

  if (!updates || updates.length === 0) {
    return (
      <div className="cine-reels-empty">
        <Film size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Cine Updates Yet</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Check back later for the latest movie news and rumors!</p>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: '1.5rem' }}>
          <ChevronLeft size={16} /> Back to Home
        </button>
      </div>
    );
  }

  const translateY = touchStart ? -touchDelta : 0;

  return (
    <div
      className="cine-reels-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="cine-reels-header">
        <button className="cine-reels-back" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="cine-reels-title">
          <span className="cine-reels-brand">Cine Updates</span>
          <span className="cine-reels-count">{currentIndex + 1} / {updates.length}</span>
        </div>
      </div>

      {/* Main reel content */}
      <div
        className="cine-reels-content"
        style={{ transform: touchStart ? `translateY(${translateY}px)` : undefined }}
      >
        {updates.map((item, idx) => (
          <div
            key={item.id}
            className={`cine-reel-slide ${idx === currentIndex ? 'cine-reel-active' : ''} ${idx < currentIndex ? 'cine-reel-above' : ''} ${idx > currentIndex ? 'cine-reel-below' : ''}`}
            style={{ 
              transition: touchStart ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease',
              opacity: idx === currentIndex ? 1 : 0,
              transform: idx === currentIndex ? 'translateY(0) scale(1)' : idx < currentIndex ? 'translateY(-100%) scale(0.95)' : 'translateY(100%) scale(0.95)'
            }}
          >
            {/* Background - rich cinematic gradient */}
            <div className="cine-reel-bg" style={{
              background: `
                radial-gradient(ellipse at 30% 20%, ${CATEGORY_COLORS[item.category] || '#6366f1'}44 0%, transparent 60%),
                radial-gradient(ellipse at 70% 80%, ${CATEGORY_COLORS[item.category] || '#6366f1'}22 0%, transparent 50%),
                linear-gradient(180deg, #0a0a14 0%, #12121e 40%, #1a1a2e 100%)
              `
            }}>
              <img
                src={item.imageUrl ? proxyImageUrl(item.imageUrl, 'w500') : `https://picsum.photos/seed/${item.id}/800/1200`}
                alt=""
                className="cine-reel-bg-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="cine-reel-overlay" />
            </div>

            {/* Content */}
            <div className="cine-reel-body">
              <div className="cine-reel-tag" style={{ background: CATEGORY_COLORS[item.category] || '#6366f1' }}>
                {item.category || 'News'}
              </div>

              {item.movieName && (
                <div className="cine-reel-movie-name">{item.movieName}</div>
              )}

              <h2 className="cine-reel-headline">{item.title}</h2>
              <p className="cine-reel-text">{item.body}</p>

              <div className="cine-reel-timestamp">{item.timestamp}</div>
            </div>

            {/* Action buttons */}
            <div className="cine-reel-actions">
              <button
                className={`cine-reel-action-btn ${likedAnim === item.id ? 'cine-reel-like-pop' : ''}`}
                onClick={() => handleLike(item.id)}
                title="Like"
              >
                <Heart
                  size={26}
                  fill={item.likedBy?.includes(currentUser?.username) ? '#ef4444' : 'none'}
                  color={item.likedBy?.includes(currentUser?.username) ? '#ef4444' : '#fff'}
                />
                <span>{item.likes || 0}</span>
              </button>
              <button
                className="cine-reel-action-btn"
                onClick={() => handleShare(item)}
                title="Share"
              >
                <Share2 size={24} color="#fff" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Swipe hint */}
      {showSwipeHint && updates.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeOut 3s forwards', pointerEvents: 'none'
        }}>
          <ChevronUp size={16} /> Swipe for more <ChevronDown size={16} />
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      {currentIndex < updates.length - 1 && (
        <button className="cine-reels-nav cine-reels-nav-down" onClick={goNext} aria-label="Next update">
          <ChevronDown size={24} />
        </button>
      )}
      {currentIndex > 0 && (
        <button className="cine-reels-nav cine-reels-nav-up" onClick={goPrev} aria-label="Previous update">
          <ChevronUp size={24} />
        </button>
      )}

      {/* Progress dots */}
      <div className="cine-reels-progress">
        {updates.map((_, idx) => (
          <div
            key={idx}
            className={`cine-reels-dot ${idx === currentIndex ? 'cine-reels-dot-active' : ''}`}
            onClick={() => { if (!isTransitioning) { setIsTransitioning(true); setCurrentIndex(idx); setTimeout(() => setIsTransitioning(false), 400); } }}
          />
        ))}
      </div>
    </div>
  );
}
