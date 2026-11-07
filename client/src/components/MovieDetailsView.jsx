import { useState } from 'react';
import { 
  Play, Plus, Check, List, Star, ThumbsUp, MessageSquare, 
  Trash2, Edit3, Send, Tv, Film, Bell, BellOff, Share2
} from 'lucide-react';
import MovieLogo from './MovieLogo';
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
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [animatingReviewId, setAnimatingReviewId] = useState(null);

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
          {/* TOP LEAD ROW: POSTER + METADATA & TITLE */}
          <div className="details-header-lead">
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

            <div className="details-lead-info">
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

              {/* MOVIE LOGO / EDITORIAL TITLE */}
              <div className="details-logo-container">
                <MovieLogo movie={selectedMovie} />
              </div>

              {/* MOBILE GENRES (COMPACT ROW BELOW TITLE) */}
              {genres.length > 0 && (
                <div className="details-genres-list mobile-only-genres">
                  {genres.map(g => (
                    <span key={g} className="details-genre-chip">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INTERACTIVE COLUMN: ACTION BUTTONS & METRICS */}
          <div className="details-interactive-col">
            {/* ACTION BUTTONS (ERGONOMIC MOBILE & DESKTOP STANDARD) */}
            <div className="details-action-buttons">
              <button className="btn-action-primary" onClick={onWatchTrailer}>
                <Play size={16} fill="currentColor" /> Watch Trailer
              </button>

              <div className="details-secondary-actions-bar">
                <button
                  className={`btn-action-secondary ${watchlist.includes(selectedMovie.id) ? 'btn-action-secondary--active' : ''}`}
                  onClick={(e) => onToggleWatchlist(selectedMovie.id, e)}
                  title={watchlist.includes(selectedMovie.id) ? 'In Watchlist' : 'Add to Watchlist'}
                >
                  {watchlist.includes(selectedMovie.id) ? <Check size={16} /> : <Plus size={16} />}
                  <span>{watchlist.includes(selectedMovie.id) ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

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
                  variant="icon"
                />
              </div>
            </div>

            {/* PRESTIGE CRITIQUE METRICS (LETTERBOXD / ROTTEN TOMATOES STANDARD) */}
            <div className="details-metrics-row">
              {/* Critic Score */}
              <div className="details-metric-card">
                <div className="metric-card-top">
                  <span className="metric-card-label">Critic Consensus</span>
                  <span className="metric-source-badge verified">Verified</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-value-row">
                    <Star size={15} className="metric-star-icon" fill="currentColor" />
                    <span className="metric-primary-num">
                      {selectedMovie.criticScore ? selectedMovie.criticScore.toFixed(1) : (selectedMovie.rating ? selectedMovie.rating.toFixed(1) : '—')}
                    </span>
                    <span className="metric-scale">/10</span>
                  </div>
                  <span className="metric-card-subtext">
                    {(selectedMovie.criticScore || selectedMovie.rating || 0) >= 8.0 
                      ? 'Universal Acclaim' 
                      : (selectedMovie.criticScore || selectedMovie.rating || 0) >= 7.0 
                      ? 'Generally Favorable' 
                      : 'Mixed Consensus'}
                  </span>
                </div>
              </div>

              {/* Audience Score */}
              <div className="details-metric-card">
                <div className="metric-card-top">
                  <span className="metric-card-label">Audience Approval</span>
                  <span className="metric-source-badge audience">Community</span>
                </div>
                <div className="metric-card-body">
                  <div className="metric-value-row">
                    <ThumbsUp size={14} className="metric-thumbs-icon" />
                    <span className="metric-primary-num">
                      {selectedMovie.audienceScore ? `${selectedMovie.audienceScore}%` : '88%'}
                    </span>
                  </div>
                  <span className="metric-card-subtext">
                    {selectedMovie.reviews && selectedMovie.reviews.length > 0
                      ? `${selectedMovie.reviews.length} community ${selectedMovie.reviews.length === 1 ? 'review' : 'reviews'}`
                      : 'Verified cinephiles'}
                  </span>
                </div>
              </div>

              {/* OTT Streaming Direct Banner (if available) */}
              {selectedMovie.ott?.platform && (
                <div className="details-metric-card ott-preview-card">
                  <div className="metric-card-top">
                    <span className="metric-card-label">Official Stream</span>
                    <span className={`metric-source-badge ${isOttUpcoming ? 'upcoming' : 'streaming'}`}>
                      {isOttUpcoming ? 'Upcoming' : 'Streaming Now'}
                    </span>
                  </div>
                  <div className="metric-card-body ott-body-layout">
                    <div className="metric-value-row">
                      <Tv size={15} className="metric-tv-icon" />
                      <a
                        href={selectedMovie.ott.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="metric-ott-link"
                      >
                        {selectedMovie.ott.platform}
                      </a>
                    </div>
                    {selectedMovie.ott.releaseDate && isOttUpcoming && (
                      <span className="ott-mobile-date">
                        from {new Date(selectedMovie.ott.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {isOttUpcoming && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleOttAlert(selectedMovie, e); }}
                        className={`ott-alert-pill ${isOttAlertSet ? 'ott-alert-pill--active' : ''}`}
                        title={isOttAlertSet ? 'Remove release alert' : 'Notify me on streaming release'}
                      >
                        {isOttAlertSet ? <BellOff size={11} /> : <Bell size={11} />}
                        <span>{isOttAlertSet ? 'Alert Set' : 'Notify'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              <p className="synopsis-text">{selectedMovie.description}</p>
            </div>

            {/* CAST & CREW */}
            {selectedMovie.cast && selectedMovie.cast.length > 0 && (
              <div className="details-cast-section">
                <div className="details-cast-header">
                  <h3 className="details-section-title">Top Billed Cast</h3>
                  <p className="details-section-subtitle">Performers bringing the characters to life</p>
                </div>
                <div className="cast-grid">
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

          {/* RIGHT PANEL: PRODUCTION INTELLIGENCE / FILM DETAILS */}
          <div className="details-right-panel">
            <div className="film-specs-box">
              <div className="film-specs-header">
                <h4>Production Intelligence</h4>
                <span className="specs-indicator" />
              </div>

              <div className="film-specs-rows">
                <div className="tech-row">
                  <span className="tech-lbl">Director</span>
                  <span 
                    className={`tech-val ${selectedMovie.director ? 'tech-val--clickable' : ''}`}
                    onClick={() => selectedMovie.director ? onViewActor(selectedMovie.director) : null}
                  >
                    {selectedMovie.director || '—'}
                  </span>
                </div>

                <div className="tech-row">
                  <span className="tech-lbl">Writer</span>
                  <span 
                    className={`tech-val ${selectedMovie.writer ? 'tech-val--clickable' : ''}`}
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
          <div className="reviews-section-header">
            <div>
              <h2 className="reviews-heading">Critical & Community Reviews</h2>
              <p className="reviews-subheading">
                {selectedMovie.reviews && selectedMovie.reviews.length > 0 
                  ? `Based on ${selectedMovie.reviews.length} cinephile opinions` 
                  : 'No reviews yet for this title'}
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
            >
              <Edit3 size={15} /> Write a Review
            </button>
          </div>

          <div className="user-reviews-list">
            {selectedMovie.reviews && selectedMovie.reviews.length > 0 ? (
              selectedMovie.reviews.map(review => (
                <div key={review.id} className="user-review-card">
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <img
                        src={review.avatarUrl || DEFAULT_AVATAR}
                        alt="user"
                        className="reviewer-avatar"
                      />
                      <div className="reviewer-meta">
                        <h4 className="review-user-name">{review.user}</h4>
                        <p className="review-user-sub">
                          {review.role || 'Member'} • {review.timestamp}
                        </p>
                      </div>
                    </div>
                    <span className="review-score-badge">
                      <Star size={12} fill="currentColor" /> {review.rating.toFixed(1)}/10
                    </span>
                  </div>

                  <p className="review-text">{review.text}</p>

                  <div className="review-actions-bar">
                    <button 
                      className={`review-action-btn ${review.likedBy?.includes(currentUser?.username) ? 'liked' : ''} ${animatingReviewId === review.id ? 'animate-upvote' : ''}`} 
                      onClick={() => handleUpvote(review.id)}
                    >
                      <ThumbsUp size={13} fill={review.likedBy?.includes(currentUser?.username) ? 'var(--color-accent-gold)' : 'none'} /> 
                      <span>{review.likes || 0}</span>
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
                    >
                      <MessageSquare size={13} /> 
                      <span>{review.comments || (review.replies?.length || 0)}</span>
                    </button>

                    {(currentUser && (review.user === currentUser.username || currentUser.role === 'admin')) && (
                      <button 
                        className="review-action-btn review-delete-btn" 
                        onClick={() => onDeleteReview(review.id)} 
                        style={{ marginLeft: 'auto' }}
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
                              />
                              <div className="reply-body">
                                <span className="reply-author">{reply.author}</span>
                                <span className="reply-text">{reply.body}</span>
                                <span className="reply-time">{reply.timestamp}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="review-reply-input-row">
                        <textarea
                          className="reply-input"
                          placeholder="Write a reply..."
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
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="reviews-empty-state">
                <MessageSquare size={28} className="empty-reviews-icon" />
                <p className="empty-reviews-title">No reviews logged yet</p>
                <p className="empty-reviews-sub">Be the first to analyze and rate {selectedMovie.title}.</p>
              </div>
            )}
          </div>
        </section>

        {/* SIMILAR MOVIES SECTION */}
        {scoredSimilarMovies.length > 0 && (
          <section className="similar-movies-section">
            <div className="similar-movies-header">
              <h2 className="section-title">Similar Films</h2>
              <p className="section-subtitle">Curated picks sharing genre, pedigree & cinematic era</p>
            </div>
            <div className="movie-grid">
              {scoredSimilarMovies.map(movie => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  onClick={onViewMovie} 
                  maxGenreTags={2} 
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
