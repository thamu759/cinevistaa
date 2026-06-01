import { useState } from 'react';
import { Play, Plus, Check, List, Star, ThumbsUp, MessageSquare, Trash2, Edit3, Send, Tv, Film } from 'lucide-react';

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
  selectedMovie, activeView, watchlist, currentUser, watchProviders,
  userLists, showListMenu, movies, proxyImageUrl,
  onViewMovie, onToggleWatchlist, onViewActor,
  onUpvoteReview, onDeleteReview, onAddReviewReply,
  onWatchTrailer, setIsWriteReviewOpen,
  setShowListMenu, loadUserLists, navigateTo, addMovieToList,
  setAuthTab, setIsAuthModalOpen
}) {
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  const toggleReplies = (reviewId) => {
    setExpandedReplies(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  if (activeView !== 'movie-details') return null;

  if (!selectedMovie) {
    return (
      <div>
        <div className="skeleton skeleton-details-backdrop" />
        <div className="skeleton-details-content">
          <div className="skeleton skeleton-details-poster" />
          <div className="skeleton-details-info">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text medium" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text short" />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-badge" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="movie-details-backdrop-container">
        <div
          className="movie-details-backdrop"
          style={{ backgroundImage: `url(${proxyImageUrl(selectedMovie.backdropUrl, 'original')})` }}
        />
        <div className="movie-details-backdrop-overlay" />
      </div>

      <div className="main-content" style={{ position: 'relative' }}>
        <div className="details-wrapper">
          <div className="details-poster-box">
            <img src={proxyImageUrl(selectedMovie.posterUrl, 'original')} alt={selectedMovie.title} className="details-poster-img" />
          </div>

          <div className="details-main-info">
            <div className="details-tags-row">
              <span className="genre-tag" style={{ background: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.3)', color: 'var(--color-accent-gold)' }}>
                {selectedMovie.genre}
              </span>
              <span className="genre-tag">{selectedMovie.runtime}</span>
            </div>

            <h1 className="details-title">{selectedMovie.title}</h1>

            <div className="details-scores-row">
              <div className="score-dial-container">
                <div className="dial-circle-wrapper">
                  <svg className="dial-svg" viewBox="0 0 60 60">
                    <circle className="dial-bg" cx="30" cy="30" r="26" />
                    <circle
                      className="dial-progress"
                      cx="30" cy="30" r="26"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - selectedMovie.criticScore / 10)}
                    />
                  </svg>
                  <span className="dial-text">{selectedMovie.criticScore.toFixed(1)}</span>
                </div>
                <span className="score-dial-lbl">Critic<br/>Score</span>
              </div>

              <div className="score-dial-container">
                <div className="dial-circle-wrapper">
                  <svg className="dial-svg" viewBox="0 0 60 60">
                    <circle className="dial-bg" cx="30" cy="30" r="26" />
                    <circle
                      className="dial-progress"
                      cx="30" cy="30" r="26"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - selectedMovie.audienceScore / 100)}
                      style={{ stroke: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </svg>
                  <span className="dial-text">{selectedMovie.audienceScore}%</span>
                </div>
                <span className="score-dial-lbl">Audience<br/>Score</span>
              </div>
            </div>

            <div className="hero-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-primary" onClick={onWatchTrailer}>
                <Play size={16} fill="black" /> Watch Trailer
              </button>
              <button
                className="btn-secondary"
                onClick={(e) => onToggleWatchlist(selectedMovie.id, e)}
              >
                {watchlist.includes(selectedMovie.id) ? <Check size={16} /> : <Plus size={16} />}
                {watchlist.includes(selectedMovie.id) ? 'Watchlist Added' : 'Add to Watchlist'}
              </button>
              {currentUser && (
                <div className="hero-actions-btn-wrapper">
                  <button className="btn-secondary" onClick={() => { loadUserLists(); setShowListMenu(prev => !prev); }}>
                    <List size={16} /> Add to List
                  </button>
                  {showListMenu && (
                    <div className="hero-actions-dropdown">
                      {userLists.length === 0 ? (
                        <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          No lists yet. Create one from the Lists page.
                        </div>
                      ) : (
                        userLists.map(l => (
                          <div key={l.id} onClick={async () => {
                            try {
                              await addMovieToList(l.id, selectedMovie.id);
                              setShowListMenu(false);
                            } catch (e) { alert(e.message); }
                          }} style={{
                            padding: '0.4rem 0.6rem', cursor: 'pointer', borderRadius: '6px',
                            fontSize: '0.78rem', color: '#e2e8f0', transition: 'background 0.15s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
            </div>
          </div>
        </div>

        <div className="details-layout-content">
          <div className="details-left-panel">
            <div>
              <h3 className="details-section-title">Synopsis</h3>
              <p className="synopsis-text">{selectedMovie.description}</p>
            </div>

            {/* Native Ad Card */}
            {selectedMovie.cast && selectedMovie.cast.length > 0 && (
              <div>
                <h3 className="details-section-title">Cast & Crew</h3>
                <p className="details-section-subtitle">Meet the people bringing the story to life, on screen and behind the camera.</p>
                <div className="cast-grid">
                  {selectedMovie.cast.map((member, i) => (
                    <div key={i} className="cast-member-card" onClick={() => onViewActor(member.name)} style={{ cursor: 'pointer' }}>
                      <div className="cast-avatar-box">
                        <img src={member.avatarUrl || DEFAULT_AVATAR} alt={member.name} className="cast-avatar-img" />
                      </div>
                      <div>
                        <p className="cast-name">{member.name}</p>
                        <p className="cast-role">as {member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="details-right-panel">
            <div className="tech-details-box glass-panel">
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent-gold)', marginBottom: '1.25rem' }}>
                Film Details
              </h4>
              <div className="tech-row">
                <span className="tech-lbl">Director</span>
                <span className="tech-val" onClick={() => selectedMovie.director ? onViewActor(selectedMovie.director) : null}
                  style={{ cursor: selectedMovie.director ? 'pointer' : 'default', color: selectedMovie.director ? 'var(--color-accent-gold)' : undefined }}>
                  {selectedMovie.director}
                </span>
              </div>
              <div className="tech-row">
                <span className="tech-lbl">Writer</span>
                <span className="tech-val" onClick={() => selectedMovie.writer ? onViewActor(selectedMovie.writer) : null}
                  style={{ cursor: selectedMovie.writer ? 'pointer' : 'default', color: selectedMovie.writer ? 'var(--color-accent-gold)' : undefined }}>
                  {selectedMovie.writer}
                </span>
              </div>
              <div className="tech-row">
                <span className="tech-lbl">Studio</span>
                <span className="tech-val">{selectedMovie.studio}</span>
              </div>
              <div className="tech-row">
                <span className="tech-lbl">Release Date</span>
                <span className="tech-val">{selectedMovie.releaseDate}</span>
              </div>
              <div className="tech-row">
                <span className="tech-lbl">Language</span>
                <span className="tech-val">{formatLang(selectedMovie.language)}</span>
              </div>
              <div className="tech-row">
                <span className="tech-lbl">Where to Watch</span>
                <div className="tech-val">
                  {watchProviders.length > 0 ? (
                    <span className="watch-provider-text">
                      {watchProviders.map(p => p.name).join(', ')}
                    </span>
                  ) : (
                    <div className="where-to-watch-row">
                      <span className="watch-icon"><Tv size={12} /></span>
                      <span className="watch-icon"><Film size={12} /></span>
                    </div>
                  )}
                </div>
              </div>
              {selectedMovie.ott?.platform && (
                <div className="tech-row">
                  <span className="tech-lbl">Streaming on</span>
                  <div className="tech-val">
                    <a href={selectedMovie.ott.url || '#'} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent-gold)', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>
                      {selectedMovie.ott.platform}
                    </a>
                    {selectedMovie.ott.releaseDate && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginLeft: '0.4rem' }}>
                        {new Date(selectedMovie.ott.releaseDate) > new Date() ? 'from ' : ''}{new Date(selectedMovie.ott.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="community-reviews-section">
          <div className="reviews-section-header">
            <div>
              <h2>Community Reviews</h2>
              <p>Based on {selectedMovie.reviews?.length || 0} user ratings</p>
            </div>
            <button className="btn-primary" onClick={() => { if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); } else { setIsWriteReviewOpen(true); } }}>
              <Edit3 size={16} /> Write a Review
            </button>
          </div>

          <div className="user-reviews-list">
            {selectedMovie.reviews && selectedMovie.reviews.length > 0 ? (
              selectedMovie.reviews.map(review => (
                <div key={review.id} className="user-review-card glass-panel">
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <img
                        src={review.avatarUrl || DEFAULT_AVATAR}
                        alt="user"
                        className="reviewer-avatar"
                      />
                      <div className="reviewer-meta">
                        <h4 className="review-user-name">{review.user}</h4>
                        <p>{review.role} • {review.timestamp}</p>
                      </div>
                    </div>
                    <span className="review-score-badge">★ {review.rating.toFixed(1)}/10</span>
                  </div>
                  <p className="review-text">"{review.text}"</p>
                  <div className="review-actions-bar">
                    <button className={`review-action-btn ${review.likedBy?.includes(currentUser?.username) ? 'liked' : ''}`} onClick={() => onUpvoteReview(review.id)}>
                      <ThumbsUp size={14} fill={review.likedBy?.includes(currentUser?.username) ? 'var(--color-accent-gold)' : 'none'} /> <span>{review.likes || 0}</span>
                    </button>
                    <button className="review-action-btn" onClick={() => { if (!currentUser) { setAuthTab('login'); setIsAuthModalOpen(true); } else { toggleReplies(review.id); } }}>
                      <MessageSquare size={14} /> <span>{review.comments || 0}</span>
                    </button>
                    {(currentUser && (review.user === currentUser.username || currentUser.role === 'admin')) && (
                      <button className="review-action-btn review-delete-btn" onClick={() => onDeleteReview(review.id)} style={{ marginLeft: 'auto' }}>
                        <Trash2 size={14} /> <span>Delete</span>
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
                          className="btn-primary reply-send-btn"
                          disabled={!replyTexts[review.id]?.trim()}
                          onClick={async () => {
                            await onAddReviewReply(review.id, replyTexts[review.id]);
                            setReplyTexts(prev => ({ ...prev, [review.id]: '' }));
                          }}
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No reviews submitted for this film yet. Be the first to criticize!
              </div>
            )}
          </div>
        </section>

        {(() => {
          const targetGenres = selectedMovie.genre ? selectedMovie.genre.split('/').map(g => g.trim()) : [];
          const targetYear = selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : null;
          const scored = movies.map(m => {
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
          if (scored.length === 0) return null;
          return (
            <section style={{ marginTop: '3rem' }}>
              <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Similar Movies</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Picks based on genre, language & more
              </p>
              <div className="movie-grid">
                {scored.map(movie => (
                  <div key={movie.id} className="movie-card" onClick={() => onViewMovie(movie.id)}>
                    <div className="movie-card-poster-wrapper">
                      <img src={proxyImageUrl(movie.posterUrl, 'w300')} alt={movie.title} className="movie-card-poster" loading="lazy" />
                      <div className="movie-card-rating">
                        <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                        <span>{(movie.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="movie-card-info">
                      <h3 className="movie-card-title">{movie.title}</h3>
                      <div className="movie-card-genre-tags">
                        <span className="genre-tag" style={{ color: 'var(--color-accent-gold)', borderColor: 'rgba(251,191,36,0.2)' }}>{movie.releaseYear}</span>
                        {movie.genre && movie.genre.split('/').slice(0, 2).map(tag => (
                          <span key={tag} className="genre-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

      </div>
    </div>
  );
}
