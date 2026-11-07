import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Share2, ChevronLeft, ChevronUp, ChevronDown, Film } from 'lucide-react';
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

const getYouTubeEmbedUrl = (url) => {
  const match = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export default function CineUpdates({ updates = [], onLike, onShare, currentUser, onBack, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedAnim, setLikedAnim] = useState(null);
  const [doubleTapHeart, setDoubleTapHeart] = useState(null);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const lastTapRef = useRef(0);
  const isScrollingRef = useRef(false);

  const update = updates[currentIndex];

  const scrollToIndex = useCallback((index) => {
    if (index < 0 || index >= updates.length) return;
    const target = slideRefs.current[index];
    if (target) {
      isScrollingRef.current = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentIndex(index);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 450);
    }
  }, [updates.length]);

  const goNext = useCallback(() => {
    scrollToIndex(currentIndex + 1);
  }, [currentIndex, scrollToIndex]);

  const goPrev = useCallback(() => {
    scrollToIndex(currentIndex - 1);
  }, [currentIndex, scrollToIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onBack]);

  // Smooth wheel navigation for desktop with inertial throttle
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isThrottled = false;
    const handleWheel = (e) => {
      e.preventDefault();
      if (isThrottled) return;

      if (Math.abs(e.deltaY) > 20) {
        isThrottled = true;
        if (e.deltaY > 0) {
          scrollToIndex(currentIndex + 1);
        } else {
          scrollToIndex(currentIndex - 1);
        }
        setTimeout(() => {
          isThrottled = false;
        }, 420);
      }
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, [currentIndex, scrollToIndex]);

  // IntersectionObserver for native hardware-accelerated scroll-snap tracking
  useEffect(() => {
    const track = trackRef.current;
    if (!track || updates.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx) && !isScrollingRef.current) {
              setCurrentIndex(idx);
            }
          }
        });
      },
      {
        root: track,
        threshold: 0.5,
      }
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [updates]);

  const handleLike = (id) => {
    setLikedAnim(id);
    setTimeout(() => setLikedAnim(null), 350);
    onLike?.(id);
  };

  const handleSlideClick = (e, item) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('iframe')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleLike(item.id);
      setDoubleTapHeart(item.id);
      setTimeout(() => setDoubleTapHeart(null), 700);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} — ${item.body}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      onShare?.(item);
    }
  };

  if (!updates || updates.length === 0) {
    return (
      <div className="cine-reels-container" ref={containerRef}>
        <div className="cine-reels-header">
          <button className="cine-reels-back" onClick={onBack} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <div className="cine-reels-title">
            <span className="cine-reels-brand">Cine Pulse</span>
          </div>
        </div>
        <div className="cine-empty-state" style={{ margin: 'auto' }}>
          <div className="cine-empty-state-icon">
            <Film size={26} />
          </div>
          <h3 className="cine-empty-state-title">No Cine Pulse Updates Yet</h3>
          <p className="cine-empty-state-desc">Stay tuned for breaking Kollywood cinema news, rumors, and release scoops.</p>
          <div className="cine-empty-state-action">
            <button className="btn-secondary" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem' }}>
              <ChevronLeft size={16} /> Back to Cinema Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cine-reels-container" ref={containerRef}>
      {/* Header */}
      <div className="cine-reels-header">
        <button className="cine-reels-back" onClick={onBack} aria-label="Close Cine Pulse">
          <ChevronLeft size={22} />
        </button>
        <div className="cine-reels-title">
          <span className="cine-reels-brand">Cine Pulse</span>
          <span className="cine-reels-count">{currentIndex + 1} / {updates.length}</span>
        </div>
      </div>

      {/* Story Dots Progress */}
      <div className="cine-reels-progress">
        {updates.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`cine-reels-dot ${i === currentIndex ? 'cine-reels-dot-active' : ''}`}
            onClick={() => scrollToIndex(i)}
            aria-label={`Jump to update ${i + 1}`}
          />
        ))}
      </div>

      {/* Stage Wrapper */}
      <div className="cine-reels-stage">
        {/* Main reel content */}
        <div className="cine-reels-content">
          <div className="cine-reels-scroll-track" ref={trackRef}>
            {updates.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <section
                  key={item.id}
                  ref={(el) => { slideRefs.current[idx] = el; }}
                  data-index={idx}
                  className={`cine-reel-slide ${isCurrent ? 'cine-reel-active' : ''}`}
                  onClick={(e) => handleSlideClick(e, item)}
                >
                  {/* Background - rich cinematic gradient */}
                  <div
                    className="cine-reel-bg"
                    style={{
                      background: `
                        radial-gradient(ellipse at 30% 20%, ${CATEGORY_COLORS[item.category] || '#6366f1'}44 0%, transparent 60%),
                        radial-gradient(ellipse at 70% 80%, ${CATEGORY_COLORS[item.category] || '#6366f1'}22 0%, transparent 50%),
                        linear-gradient(180deg, #0a0a14 0%, #12121e 40%, #1a1a2e 100%)
                      `
                    }}
                  >
                    {item.videoUrl ? (() => {
                      const embed = getYouTubeEmbedUrl(item.videoUrl);
                      if (embed) {
                        return isCurrent ? (
                          <iframe
                            className="cine-reel-bg-video"
                            src={`${embed}?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&playlist=${encodeURIComponent(embed.split('/').pop())}`}
                            title={item.title}
                            style={{ border: 0 }}
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="cine-reel-bg-img" style={{ background: '#0a0a14' }} />
                        );
                      }
                      return (
                        <video
                          className="cine-reel-bg-video"
                          src={item.videoUrl}
                          autoPlay={isCurrent}
                          muted
                          loop
                          playsInline
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      );
                    })() : (
                      <img
                        src={item.imageUrl ? proxyImageUrl(item.imageUrl, 'w500') : `https://picsum.photos/seed/${item.id}/800/1200`}
                        alt=""
                        className="cine-reel-bg-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        loading={Math.abs(idx - currentIndex) <= 1 ? 'eager' : 'lazy'}
                      />
                    )}
                    <div className="cine-reel-overlay" />
                  </div>

                  {/* Double-tap heart burst */}
                  <div className={`cine-reel-doubletap-heart ${doubleTapHeart === item.id ? 'cine-reel-doubletap-active' : ''}`}>
                    <Heart size={80} fill="#ef4444" color="#ef4444" />
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
                      type="button"
                      className={`cine-reel-action-btn ${likedAnim === item.id ? 'cine-reel-like-pop' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(item.id);
                      }}
                      title="Like"
                      aria-label="Like this update"
                    >
                      <Heart
                        size={26}
                        fill={item.likedBy?.includes(currentUser?.username) ? '#ef4444' : 'none'}
                        color={item.likedBy?.includes(currentUser?.username) ? '#ef4444' : '#fff'}
                      />
                      <span>{item.likes || 0}</span>
                    </button>
                    <button
                      type="button"
                      className="cine-reel-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      title="Share"
                      aria-label="Share this update"
                    >
                      <Share2 size={24} color="#fff" />
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Desktop nav buttons */}
        <button
          type="button"
          className="cine-reels-nav cine-reels-nav-up"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous update"
        >
          <ChevronUp size={24} />
        </button>
        <button
          type="button"
          className="cine-reels-nav cine-reels-nav-down"
          onClick={goNext}
          disabled={currentIndex >= updates.length - 1}
          aria-label="Next update"
        >
          <ChevronDown size={24} />
        </button>
      </div>
    </div>
  );
}
