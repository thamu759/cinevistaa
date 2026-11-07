import { useState, useRef } from 'react';
import { 
  Play, Plus, Check, List, Star, ThumbsUp, MessageSquare, 
  Trash2, Edit3, Send, Tv, Film, Bell, BellOff, Share2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import MovieCard from './MovieCard';
import ShareButton from './ShareButton';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2750%27 fill=%27%23e2e8f0%27/%3E%3Ccircle cx=%2750%27 cy=%2738%27 r=%2716%27 fill=%27%2394a3b8%27/%3E%3Cellipse cx=%2750%27 cy=%2780%27 rx=%2728%27 ry=%2722%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E';

const LANG_MAP = {
  TA: 'TAMIL', TAMIL: 'TAMIL',
  ML: 'MALAYALAM', MALAYALAM: 'MALAYALAM',
  TE: 'TELUGU', TELUGU: 'TELUGU',
  HI: 'HINDI', HINDI: 'HINDI',
  KN: 'KANNADA', KANNADA: 'KANNADA',
  EN: 'ENGLISH', ENGLISH: 'ENGLISH',
};
const normalizeLang = (lang) => LANG_MAP[lang?.toUpperCase()] || lang?.toUpperCase();

const DISPLAY_LANG = {
  'TAMIL': 'Tamil', 'TA': 'Tamil',
  'MALAYALAM': 'Malayalam', 'ML': 'Malayalam',
  'TELUGU': 'Telugu', 'TE': 'Telugu',
  'HINDI': 'Hindi', 'HI': 'Hindi',
  'KANNADA': 'Kannada', 'KN': 'Kannada',
  'ENGLISH': 'English', 'EN': 'English',
};
const formatLang = (lang) => DISPLAY_LANG[lang?.toUpperCase()] || lang || '—';

export default function MovieDetailsView({
  selectedMovie, activeView, watchlist, currentUser, watchProviders = [],
  userLists = [], showListMenu, movies = [], proxyImageUrl,
  onViewMovie, onToggleWatchlist, onViewActor,
  onUpvoteReview, onDeleteReview, onAddReviewReply,
  onWatchTrailer, setIsWriteReviewOpen,
  setShowListMenu, loadUserLists, navigateTo, addMovieToList,
  setAuthTab, setIsAuthModalOpen,
  userOttAlerts = [], onToggleOttAlert
}) {
  const { showToast } = useToast();
  const castScrollRef = useRef(null);
  const similarScrollRef = useRef(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [animatingReviewId, setAnimatingReviewId] = useState(null);

  const scrollCast = (direction) => {
    if (castScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      castScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollSimilar = (direction) => {
    if (similarScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      similarScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleUpvote = (reviewId) => {
    setAnimatingReviewId(reviewId);
    setTimeout(() => setAnimatingReviewId(null), 400);
    onUpvoteReview(reviewId);
  };

  const toggleReplies = (reviewId) => {
    setExpandedReplies(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  if (activeView !== 'movie-details') return null;

  if (!selectedMovie) {
    return (
      <div className="movie-details-skeleton-wrap">
        <div className="skeleton skeleton-details-backdrop" />
        <div className="main-content">
          <div className="skeleton-details-content">
            <div className="skeleton skeleton-details-poster" />
            <div className="skeleton-details-info">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text medium" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text short" />
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div className="skeleton skeleton-badge" style={{ width: 140, height: 42 }} />
                <div className="skeleton skeleton-badge" style={{ width: 140, height: 42 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parse release year
  const releaseYear = selectedMovie.releaseYear || (selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : null);

  // Parse individual genres
  const genres = selectedMovie.genre
    ? selectedMovie.genre.split('/').map(g => g.trim()).filter(Boolean)
    : [];

  // OTT status
  const isOttUpcoming = selectedMovie.ott?.releaseDate && new Date(selectedMovie.ott.releaseDate) > new Date();
  const isOttAlertSet = (userOttAlerts || []).some(a => a.movieId === selectedMovie.id);

  // Ratings calculation (Critic & Audience)
  const criticScoreVal = selectedMovie.criticScore 
    ? Number(selectedMovie.criticScore).toFixed(1) 
    : (selectedMovie.rating ? Number(selectedMovie.rating).toFixed(1) : null);
  const audienceScoreVal = selectedMovie.audienceScore 
    ? Math.round(Number(selectedMovie.audienceScore)) 
    : (selectedMovie.rating ? Math.round(Number(selectedMovie.rating) * 10) : 86);

  // Scored similar movies
  const targetGenres = genres;
  const targetYear = releaseYear;
  const scoredSimilarMovies = movies.map(m => {
    if (m.id === selectedMovie.id || !m.genre) return null;
    const mGenres = m.genre.split('/').map(g => g.trim());
    const genreOverlap = targetGenres.filter(g => mGenres.includes(g)).length;
    let score = genreOverlap * 3;
    if (selectedMovie.language && normalizeLang(m.language) === normalizeLang(selectedMovie.language)) score += 2;
    if (targetYear && m.releaseDate) {
      const mYear = new Date(m.releaseDate).getFullYear();
      if (Math.abs(mYear - targetYear) <= 2) score += 1;
    }
    if (selectedMovie.director && m.director === selectedMovie.director) score += 1;
    return { movie: m, score };
  }).filter(Boolean).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map(s => s.movie);

  return (
    <div className="movie-details-page slide-up">
      {/* CINEMATIC WIDESCREEN HERO BACKDROP */}
      <div className="movie-details-backdrop-container">
        <div
          className="movie-details-backdrop"
          style={{ backgroundImage: `url(${proxyImageUrl(selectedMovie.backdropUrl, 'original')})` }}
        />
        <div className="movie-details-backdrop-overlay" />
      </div>

      <div className="main-content movie-details-main-content">
        {/* HEADER HERO SECTION */}
        <div className="details-wrapper">
          {/* POSTER */}
          <div className="details-poster-box">
            <img 
              src={proxyImageUrl(selectedMovie.posterUrl, 'original')} 
              alt={selectedMovie.title} 
              className="details-poster-img" 
            />
            {selectedMovie.certification && (
              <span className="details-poster-cert-badge">{selectedMovie.certification}</span>
            )}
          </div>

          {/* MAIN INFO & ACTIONS */}
          <div className="details-lead-info">
            {/* EDITORIAL TITLE (Clean typography, no logo PNGs) */}
            <h1 className="details-title">{selectedMovie.title}</h1>

            {/* UNIFIED METADATA CHIPS ROW */}
            <div className="details-meta-row">
              {releaseYear && <span className="details-meta-pill">{releaseYear}</span>}
              {selectedMovie.runtime && (
                <>
                  <span className="details-meta-dot">&bull;</span>
                  <span className="details-meta-item">{selectedMovie.runtime}</span>
                </>
              )}
              {selectedMovie.language && (
                <>
                  <span className="details-meta-dot">&bull;</span>
                  <span className="details-meta-item">{formatLang(selectedMovie.language)}</span>
                </>
              )}
              {selectedMovie.certification && (
                <>
                  <span className="details-meta-dot">&bull;</span>
                  <span className="details-meta-cert">{selectedMovie.certification}</span>
                </>
              )}
              {genres.length > 0 && (
                <div className="details-genres-list desktop-only-genres">
                  {genres.map(g => (
                    <span key={g} className="details-genre-chip">{g}</span>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE GENRES (COMPACT ROW BELOW TITLE) */}
            {genres.length > 0 && (
              <div className="details-genres-list mobile-only-genres">
                {genres.map(g => (
                  <span key={g} className="details-genre-chip">{g}</span>
                ))}
              </div>
            )}

            {/* LUXURY PRESTIGE RATINGS BAR (Apple TV / Letterboxd style - Single Cohesive Tone) */}
            <div className="cinema-ratings-strip">
              {/* Critic Score */}
              <div className="rating-segment" title="Critic Score">
                <div className="rating-badge-icon">
                  <Star size={13} fill="currentColor" />
                </div>
                <div className="rating-content">
                  <div className="rating-val-row">
                    <span className="rating-number">{criticScoreVal || '—'}</span>
                    <span className="rating-sub">/10</span>
                  </div>
                  <span className="rating-label">Critic</span>
                </div>
              </div>

              <div className="rating-divider" />

              {/* Audience Score */}
              <div className="rating-segment" title="Audience Score">
                <div className="rating-badge-icon">
                  <ThumbsUp size={12} />
                </div>
                <div className="rating-content">
                  <div className="rating-val-row">
                    <span className="rating-number">{audienceScoreVal}</span>
                    <span className="rating-sub">%</span>
                  </div>
                  <span className="rating-label">Audience</span>
                </div>
              </div>

              {/* OTT Streaming (if available) */}
              {selectedMovie.ott?.platform && (
                <>
                  <div className="rating-divider" />
                  <div className="rating-segment rating-segment--ott" title="Streaming Platform">
                    <div className="rating-badge-icon">
                      <Tv size={13} />
                    </div>
                    <div className="rating-content">
                      <div className="rating-val-row">
                        <a
                          href={selectedMovie.ott.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ott-stream-link"
                        >
                          {selectedMovie.ott.platform}
                        </a>
                      </div>
                      <span className="rating-label">
                        {isOttUpcoming ? 'Upcoming' : 'Streaming'}
                        {selectedMovie.ott.releaseDate && isOttUpcoming && (
                          ` • ${new Date(selectedMovie.ott.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                        )}
                      </span>
                    </div>

                    {isOttUpcoming && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleOttAlert(selectedMovie, e); }}
                        className={`ott-alert-token ${isOttAlertSet ? 'ott-alert-token--active' : ''}`}
                        title={isOttAlertSet ? 'Remove release alert' : 'Notify me on streaming release'}
                        type="button"
                      >
                        {isOttAlertSet ? <BellOff size={11} /> : <Bell size={11} />}
                        <span>{isOttAlertSet ? 'Set' : 'Alert'}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="details-action-buttons">
              <button className="btn-action-primary" onClick={onWatchTrailer}>
                <Play size={16} fill="currentColor" /> Watch Trailer
              </button>

              <div className={`details-secondary-actions-bar ${!currentUser ? 'guest-user' : ''}`}>
                <div className="hero-actions-btn-wrapper">
                  <button
                    className={`btn-action-secondary ${watchlist.includes(selectedMovie.id) ? 'btn-action-secondary--active' : ''}`}
                    onClick={(e) => onToggleWatchlist(selectedMovie.id, e)}
                    title={watchlist.includes(selectedMovie.id) ? 'In Watchlist' : 'Add to Watchlist'}
                  >
                    {watchlist.includes(selectedMovie.id) ? <Check size={16} /> : <Plus size={16} />}
                    <span>{watchlist.includes(selectedMovie.id) ? 'Saved' : 'Watchlist'}</span>
                  </button>
                </div>

                {currentUser && (
                  <div className="hero-actions-btn-wrapper">
                    <button 
                      className="btn-action-secondary" 
                      onClick={() => { loadUserLists(); setShowListMenu(prev => !prev); }}
                      title="Add to Custom List"
                    >
                      <List size={16} />
                      <span>Lists</span>
                    </button>
                    {showListMenu && (
                      <div className="hero-actions-dropdown">
                        {userLists.length === 0 ? (
                          <div style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                            No lists yet. Create one from the Lists page.
                          </div>
                        ) : (
                          userLists.map(l => (
                            <div 
                              key={l.id} 
                              onClick={async () => {
                                try {
                                  await addMovieToList(l.id, selectedMovie.id);
                                  setShowListMenu(false);
                                } catch (e) { showToast(e.message, 'error'); }
                              }} 
                              className="actions-dropdown-item"
                            >
                              {l.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {showListMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowListMenu(false)} />}
                  </div>
                )}

                <ShareButton
                  title={selectedMovie.title}
                  text={`Check out ${selectedMovie.title} on thiraipedia`}
                  movie={selectedMovie}
                  variant="text"
                  label="Share"
                  className="btn-action-secondary"
                  wrapperClassName="hero-actions-btn-wrapper"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN CONTENT GRID */}
        <div className="details-layout-content">
          {/* LEFT PANEL: SYNOPSIS & CAST */}
          <div className="details-left-panel">
            {/* SYNOPSIS */}
            <div className="details-synopsis-section">
              <h3 className="details-section-title">Synopsis</h3>
              <p className="synopsis-text">{selectedMovie.description || 'No synopsis available for this title.'}</p>
            </div>

            {/* CAST & CREW */}
            {selectedMovie.cast && selectedMovie.cast.length > 0 && (
              <div className="details-cast-section">
                <div className="details-cast-header">
                  <h3 className="details-section-title">Top Billed Cast</h3>
                  {selectedMovie.cast.length > 2 && (
                    <div className="cast-scroll-controls">
                      <button 
                        onClick={() => scrollCast('left')} 
                        className="cast-nav-arrow" 
                        aria-label="Previous cast"
                        type="button"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button 
                        onClick={() => scrollCast('right')} 
                        className="cast-nav-arrow" 
                        aria-label="Next cast"
                        type="button"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="cast-grid" ref={castScrollRef}>
                  {selectedMovie.cast.map((member, i) => (
                    <div 
                      key={i} 
                      className="cast-member-card" 
                      onClick={() => onViewActor(member.name)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cast-avatar-box">
                        <img 
                          src={member.avatarUrl || DEFAULT_AVATAR} 
                          alt={member.name} 
                          className="cast-avatar-img" 
                          loading="lazy" 
                        />
                      </div>
                      <div className="cast-meta">
                        <p className="cast-name">{member.name}</p>
                        <p className="cast-role">{member.role ? `as ${member.role}` : 'Cast'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: PRODUCTION DETAILS */}
          <div className="details-right-panel">
            <div className="film-specs-box">
              <div className="film-specs-header">
                <h3 className="details-section-title">Film Details</h3>
                <span className="specs-indicator" />
              </div>

              <div className="film-specs-rows">
                <div className="tech-row">
                  <span className="tech-lbl">Director</span>
                  <span 
                    className={`tech-val tech-val--highlight ${selectedMovie.director ? 'tech-val--clickable' : ''}`}
                    onClick={() => selectedMovie.director ? onViewActor(selectedMovie.director) : null}
                  >
                    {selectedMovie.director || '—'}
                  </span>
                </div>

                <div className="tech-row">
                  <span className="tech-lbl">Writer</span>
                  <span 
                    className={`tech-val tech-val--highlight ${selectedMovie.writer ? 'tech-val--clickable' : ''}`}
                    onClick={() => selectedMovie.writer ? onViewActor(selectedMovie.writer) : null}
                  >
                    {selectedMovie.writer || '—'}
                  </span>
                </div>

                <div className="tech-row">
                  <span className="tech-lbl">Studio</span>
                  <span className="tech-val">{selectedMovie.studio || '—'}</span>
                </div>

                <div className="tech-row">
                  <span className="tech-lbl">Release Date</span>
                  <span className="tech-val">{selectedMovie.releaseDate || '—'}</span>
                </div>

                <div className="tech-row">
                  <span className="tech-lbl">Original Language</span>
                  <span className="tech-val">{formatLang(selectedMovie.language)}</span>
                </div>

                {selectedMovie.runtime && (
                  <div className="tech-row">
                    <span className="tech-lbl">Runtime</span>
                    <span className="tech-val">{selectedMovie.runtime}</span>
                  </div>
                )}

                <div className="tech-row">
                  <span className="tech-lbl">Where to Watch</span>
                  <div className="tech-val">
                    {watchProviders.length > 0 ? (
                      <span className="watch-provider-text">
                        {watchProviders.map(p => p.name).join(', ')}
                      </span>
                    ) : (
                      <div className="where-to-watch-row">
                        <span className="watch-icon" title="Digital Broadcast"><Tv size={13} /></span>
                        <span className="watch-icon" title="Theatrical / Home Media"><Film size={13} /></span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedMovie.ott?.platform && (
                  <div className="tech-row tech-row--ott">
                    <span className="tech-lbl">Streaming On</span>
                    <div className="tech-val ott-spec-val">
                      <a 
                        href={selectedMovie.ott.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ott-platform-link"
                      >
                        {selectedMovie.ott.platform}
                      </a>

                      {selectedMovie.ott.releaseDate && isOttUpcoming && (
                        <span className="ott-release-pill">
                          from {new Date(selectedMovie.ott.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}

                      {isOttUpcoming && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleOttAlert(selectedMovie, e); }}
                          className={`ott-alert-btn ${isOttAlertSet ? 'ott-alert-btn--active' : ''}`}
                          title={isOttAlertSet ? 'Remove release alert' : 'Notify me when streaming starts'}
                        >
                          {isOttAlertSet ? <BellOff size={12} /> : <Bell size={12} />}
                          <span>{isOttAlertSet ? 'Alert Set' : 'Notify Me'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COMMUNITY & CRITICAL REVIEWS SECTION */}
        <section className="community-reviews-section">
          {(() => {
            const reviewsList = selectedMovie.reviews || [];
            const reviewsCount = reviewsList.length;
            const avgCommunityRating = reviewsCount > 0
              ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewsCount).toFixed(1)
              : null;

            return (
              <>
                <div className="reviews-section-header">
                  <div className="reviews-header-left">
                    <div className="reviews-heading-row">
                      <h2 className="reviews-heading">Community Reviews & Ratings</h2>
                      {avgCommunityRating && (
                        <div className="reviews-community-badge" title="Community Average Rating">
                          <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
                          <span className="community-score-num">{avgCommunityRating}</span>
                          <span className="community-score-denom">/10</span>
                        </div>
                      )}
                    </div>
                    <p className="reviews-subheading">
                      {reviewsCount > 0 
                        ? `Based on ${reviewsCount} ${reviewsCount === 1 ? 'cinephile review' : 'cinephile reviews'} • Real audience reactions` 
                        : `Be the first cinephile to share your thoughts on ${selectedMovie.title}`}
                    </p>
                  </div>

                  <button 
                    className="btn-action-primary write-review-btn" 
                    onClick={() => { 
                      if (!currentUser) { 
                        setAuthTab('login'); 
                        setIsAuthModalOpen(true); 
                      } else { 
                        setIsWriteReviewOpen(true); 
                      } 
                    }}
                    type="button"
                  >
                    <Edit3 size={15} /> Write a Review
                  </button>
                </div>

                <div className="user-reviews-list">
                  {reviewsList.length > 0 ? (
                    reviewsList.map(review => (
                      <article key={review.id} className="user-review-card">
                        <div className="review-card-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar-box">
                              <img
                                src={review.avatarUrl || DEFAULT_AVATAR}
                                alt={review.user}
                                className="reviewer-avatar"
                                loading="lazy"
                              />
                            </div>
                            <div className="reviewer-meta">
                              <div className="reviewer-name-row">
                                <h4 className="review-user-name">{review.user}</h4>
                                {review.role && (
                                  <span className={`reviewer-role-badge ${review.role.toLowerCase() === 'critic' ? 'critic' : ''}`}>
                                    {review.role}
                                  </span>
                                )}
                              </div>
                              <p className="review-user-sub">
                                {review.timestamp || 'Verified Cinephile'}
                              </p>
                            </div>
                          </div>

                          <div className="review-score-badge" title={`Rated ${Number(review.rating).toFixed(1)} out of 10`}>
                            <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                            <span className="review-score-num">{Number(review.rating).toFixed(1)}</span>
                            <span className="review-score-denom">/10</span>
                          </div>
                        </div>

                        <p className="review-text">{review.text}</p>

                        <div className="review-actions-bar">
                          <button 
                            className={`review-action-btn ${review.likedBy?.includes(currentUser?.username) ? 'liked' : ''} ${animatingReviewId === review.id ? 'animate-upvote' : ''}`} 
                            onClick={() => handleUpvote(review.id)}
                            type="button"
                            title="Helpful Review"
                          >
                            <ThumbsUp size={13} fill={review.likedBy?.includes(currentUser?.username) ? 'currentColor' : 'none'} /> 
                            <span>{review.likedBy?.includes(currentUser?.username) ? 'Helpful' : 'Helpful'} ({review.likes || 0})</span>
                          </button>

                          <button 
                            className="review-action-btn" 
                            onClick={() => { 
                              if (!currentUser) { 
                                setAuthTab('login'); 
                                setIsAuthModalOpen(true); 
                              } else { 
                                toggleReplies(review.id); 
                              } 
                            }}
                            type="button"
                            title="View or Join Discussion"
                          >
                            <MessageSquare size={13} /> 
                            <span>
                              {expandedReplies[review.id] 
                                ? 'Hide Discussion' 
                                : (review.replies?.length ? `Discussion (${review.replies.length})` : 'Reply')}
                            </span>
                          </button>

                          {(currentUser && (review.user === currentUser.username || currentUser.role === 'admin')) && (
                            <button 
                              className="review-action-btn review-delete-btn" 
                              onClick={() => onDeleteReview(review.id)} 
                              type="button"
                              title="Delete your review"
                            >
                              <Trash2 size={13} /> <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {expandedReplies[review.id] && (
                          <div className="review-replies-section">
                            {(review.replies || []).length > 0 && (
                              <div className="review-replies-list">
                                {review.replies.map(reply => (
                                  <div key={reply.id} className="review-reply-item">
                                    <img
                                      src={reply.avatarUrl || DEFAULT_AVATAR}
                                      alt={reply.author}
                                      className="reply-avatar"
                                      loading="lazy"
                                    />
                                    <div className="reply-body">
                                      <div className="reply-header">
                                        <span className="reply-author">{reply.author}</span>
                                        {reply.timestamp && <span className="reply-time">• {reply.timestamp}</span>}
                                      </div>
                                      <p className="reply-text">{reply.body}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="review-reply-input-row">
                              <textarea
                                className="reply-input"
                                placeholder="Share your thoughts on this review..."
                                rows={1}
                                value={replyTexts[review.id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                              />
                              <button
                                className="btn-action-primary reply-send-btn"
                                disabled={!replyTexts[review.id]?.trim()}
                                onClick={async () => {
                                  await onAddReviewReply(review.id, replyTexts[review.id]);
                                  setReplyTexts(prev => ({ ...prev, [review.id]: '' }));
                                }}
                                type="button"
                                title="Post Reply"
                              >
                                <Send size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="reviews-empty-state">
                      <div className="empty-reviews-icon-circle">
                        <MessageSquare size={24} className="empty-reviews-icon" />
                      </div>
                      <h3 className="empty-reviews-title">No reviews logged yet</h3>
                      <p className="empty-reviews-sub">
                        Have you watched {selectedMovie.title}? Be the first to share your rating and review with fellow cinephiles!
                      </p>
                      <button 
                        className="btn-action-primary empty-review-cta"
                        onClick={() => {
                          if (!currentUser) {
                            setAuthTab('login');
                            setIsAuthModalOpen(true);
                          } else {
                            setIsWriteReviewOpen(true);
                          }
                        }}
                        type="button"
                      >
                        <Edit3 size={15} /> Write the First Review
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </section>

        {/* SIMILAR MOVIES SECTION */}
        {scoredSimilarMovies.length > 0 && (
          <section className="similar-movies-section">
            <div className="similar-movies-header">
              <div className="similar-movies-title-wrap">
                <h3 className="details-section-title">More Like This</h3>
                <p className="similar-subheading">Curated titles sharing cinematic tone & era</p>
              </div>
              {scoredSimilarMovies.length > 4 && (
                <div className="similar-scroll-controls">
                  <button 
                    onClick={() => scrollSimilar('left')} 
                    className="cast-nav-arrow" 
                    aria-label="Previous similar movies" 
                    type="button"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button 
                    onClick={() => scrollSimilar('right')} 
                    className="cast-nav-arrow" 
                    aria-label="Next similar movies" 
                    type="button"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
            <div className="similar-movies-track" ref={similarScrollRef}>
              {scoredSimilarMovies.map(movie => {
                const year = movie.releaseYear || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null);
                return (
                  <div 
                    key={movie.id} 
                    className="similar-mini-card" 
                    onClick={() => onViewMovie(movie.id)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onViewMovie(movie.id);
                      }
                    }}
                    role="button" 
                    tabIndex={0}
                    aria-label={`View details for ${movie.title}`}
                  >
                    <div className="similar-poster-box">
                      <img 
                        src={proxyImageUrl(movie.posterUrl, 'w300')} 
                        alt={movie.title} 
                        className="similar-poster-img" 
                        loading="lazy" 
                      />
                      {movie.rating ? (
                        <div className="similar-rating-chip">
                          <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
                          <span>{Number(movie.rating).toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="similar-card-meta">
                      <h4 className="similar-card-title" title={movie.title}>{movie.title}</h4>
                      {year && <span className="similar-card-year">{year}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
