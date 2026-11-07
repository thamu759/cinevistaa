import { useState, useMemo } from 'react';
import { 
  Film, Bookmark, Star, Layers, Users, Edit3, LogOut, LogIn, 
  ChevronRight, Plus, ExternalLink, Heart, MessageSquare, 
  CheckCircle2, UserPlus, UserCheck, ShieldCheck, Compass
} from 'lucide-react';
import MovieGrid from './MovieGrid';
import { createList } from '../api';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2750%27 fill=%27%23161a23%27/%3E%3Ccircle cx=%2750%27 cy=%2738%27 r=%2716%27 fill=%27%23475569%27/%3E%3Cellipse cx=%2750%27 cy=%2780%27 rx=%2728%27 ry=%2722%27 fill=%27%23475569%27/%3E%3C/svg%3E';

export default function ProfileView({
  currentUser,
  userProfile,
  profileData,
  movies = [],
  watchlist = [],
  userLists = [],
  allUsers = [],
  onViewMovie,
  onEditProfile,
  onLogout,
  onOpenAuth,
  onFollow,
  onUnfollow,
  onViewList,
  loadUserLists,
  onNavigate,
  proxyImageUrl,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('reviews');
  const [showInlineCreateList, setShowInlineCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  const isLoggedIn = Boolean(currentUser);
  const currentUsername = currentUser?.username || userProfile?.name || 'Guest';
  const roleName = currentUser?.role || userProfile?.role || 'Cinema Enthusiast';
  const avatarSrc = currentUser?.avatarUrl || profileData?.avatarUrl || userProfile?.avatarUrl || DEFAULT_AVATAR;
  const bioText = profileData?.bio || (isLoggedIn ? 'Film lover exploring cinema on thiraipedia.' : 'Guest cinephile tracking films and discovering cinema.');
  const followersList = profileData?.followers || [];
  const followingList = profileData?.following || [];

  // Authentic reviews written by this user
  const userReviews = useMemo(() => {
    if (!currentUsername && !currentUser) return [];
    const list = [];
    movies.forEach(movie => {
      (movie.reviews || []).forEach(rev => {
        const match = 
          (currentUser && rev.userId && rev.userId === currentUser.id) ||
          (currentUsername && rev.user && rev.user.toLowerCase() === currentUsername.toLowerCase());
        if (match) {
          list.push({
            ...rev,
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.posterUrl,
            movieBackdrop: movie.backdropUrl || movie.bannerUrl || movie.posterUrl,
            movieYear: movie.year || (movie.releaseDate ? movie.releaseDate.split('-')[0] : null),
            movieGenre: movie.genre || (movie.genres ? movie.genres.join(', ') : '')
          });
        }
      });
    });

    return list.sort((a, b) => {
      const da = a.createdAt || a.date ? new Date(a.createdAt || a.date).getTime() : 0;
      const db = b.createdAt || b.date ? new Date(b.createdAt || b.date).getTime() : 0;
      return db - da;
    });
  }, [movies, currentUser, currentUsername]);

  // Movies in watchlist
  const watchlistMovies = useMemo(() => {
    return movies.filter(m => watchlist.includes(m.id));
  }, [movies, watchlist]);

  // Authentic metrics calculations
  const reviewsCount = userReviews.length;
  const watchlistCount = watchlistMovies.length;
  const listsCount = userLists.length;

  const averageRating = useMemo(() => {
    if (userReviews.length === 0) return null;
    const sum = userReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / userReviews.length).toFixed(1);
  }, [userReviews]);

  // Taste DNA tags (derived from user's reviews & watchlist)
  const tasteTags = useMemo(() => {
    const genreMap = {};
    const samplePool = userReviews.length > 0 
      ? userReviews.map(r => r.movieGenre) 
      : watchlistMovies.map(m => m.genre || (m.genres ? m.genres.join(', ') : ''));

    samplePool.forEach(gStr => {
      if (!gStr) return;
      gStr.split(',').forEach(g => {
        const clean = g.trim();
        if (clean) {
          genreMap[clean] = (genreMap[clean] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    if (sorted.length > 0) return sorted.slice(0, 4);
    return ['Drama', 'Action', 'Thriller'];
  }, [userReviews, watchlistMovies]);

  // Four Favorites Showcase (Letterboxd style)
  const fourFavorites = useMemo(() => {
    const list = [];
    const usedIds = new Set();

    // 1. Highest rated reviews (>= 7)
    const sortedReviews = [...userReviews].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    for (const r of sortedReviews) {
      if (!usedIds.has(r.movieId)) {
        const movieObj = movies.find(m => m.id === r.movieId);
        if (movieObj) {
          list.push({
            id: movieObj.id,
            title: movieObj.title,
            posterUrl: movieObj.posterUrl,
            backdropUrl: movieObj.backdropUrl || movieObj.bannerUrl,
            year: movieObj.year || (movieObj.releaseDate ? movieObj.releaseDate.split('-')[0] : null),
            userRating: r.rating
          });
          usedIds.add(movieObj.id);
        }
      }
      if (list.length >= 4) break;
    }

    // 2. If fewer than 4, pull from watchlist
    if (list.length < 4) {
      for (const m of watchlistMovies) {
        if (!usedIds.has(m.id)) {
          list.push({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
            backdropUrl: m.backdropUrl || m.bannerUrl,
            year: m.year || (m.releaseDate ? m.releaseDate.split('-')[0] : null),
            userRating: null
          });
          usedIds.add(m.id);
        }
        if (list.length >= 4) break;
      }
    }

    // 3. If still fewer than 4, pull from top rated global movies
    if (list.length < 4) {
      const topGlobal = [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      for (const m of topGlobal) {
        if (!usedIds.has(m.id)) {
          list.push({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
            backdropUrl: m.backdropUrl || m.bannerUrl,
            year: m.year || (m.releaseDate ? m.releaseDate.split('-')[0] : null),
            userRating: null
          });
          usedIds.add(m.id);
        }
        if (list.length >= 4) break;
      }
    }

    return list.slice(0, 4);
  }, [userReviews, watchlistMovies, movies]);

  // Handle inline list creation
  const handleInlineCreateListSubmit = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) {
      showToast?.('Please enter a list name', 'error');
      return;
    }
    if (!isLoggedIn) {
      onOpenAuth?.();
      return;
    }

    setIsSubmittingList(true);
    try {
      await createList({ name: newListName.trim(), description: newListDesc.trim() });
      setNewListName('');
      setNewListDesc('');
      setShowInlineCreateList(false);
      if (loadUserLists) await loadUserLists();
      showToast?.('Curated list created successfully', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to create list', 'error');
    } finally {
      setIsSubmittingList(false);
    }
  };

  return (
    <div className="main-content profile-page-root slide-up">
      {/* MINIMAL LUXURY HEADER */}
      <header className="profile-minimal-header">
        <div className="profile-header-main">
          <div className="profile-avatar-block">
            <img 
              src={avatarSrc} 
              alt={currentUsername} 
              className="profile-avatar-img" 
              onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
            />
            {isLoggedIn && (
              <span className="profile-avatar-check" title="Verified Cinephile">
                <CheckCircle2 size={14} />
              </span>
            )}
          </div>

          <div className="profile-details-block">
            <div className="profile-identity-headline">
              <h1 className="profile-display-name">{currentUsername}</h1>
              <div className="profile-meta-chips">
                <span className="profile-role-tag">{roleName}</span>
                {currentUser?.role === 'admin' && (
                  <span className="profile-admin-tag">
                    <ShieldCheck size={11} /> Admin
                  </span>
                )}
              </div>
            </div>

            <div className="profile-subline">
              <span className="profile-handle-tag">@{currentUsername.toLowerCase().replace(/\s+/g, '')}</span>
              {isLoggedIn && (
                <>
                  <span className="profile-dot-sep">•</span>
                  <span className="profile-social-text">
                    <strong className="profile-social-count">{followersList.length}</strong> followers
                  </span>
                  <span className="profile-dot-sep">•</span>
                  <span className="profile-social-text">
                    <strong className="profile-social-count">{followingList.length}</strong> following
                  </span>
                </>
              )}
            </div>

            <p className="profile-bio-text">
              "{bioText}"
            </p>

            {/* TASTE DNA TAGS */}
            <div className="profile-taste-row">
              <span className="profile-taste-hint">TASTE DNA</span>
              <div className="profile-taste-list">
                {tasteTags.map((tag, idx) => (
                  <span key={idx} className="profile-genre-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="profile-header-actions">
            {isLoggedIn ? (
              <>
                <button 
                  type="button"
                  className="profile-btn-ghost"
                  onClick={onEditProfile}
                >
                  <Edit3 size={13} />
                  <span>Edit Profile</span>
                </button>
                <button 
                  type="button"
                  className="profile-btn-ghost danger"
                  onClick={onLogout}
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button 
                type="button"
                className="profile-btn-primary"
                onClick={onOpenAuth}
              >
                <LogIn size={13} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* ELEGANT METRIC RIBBON */}
        <div className="profile-metrics-ribbon">
          <div className="profile-metric-col">
            <span className="profile-metric-val">{reviewsCount}</span>
            <span className="profile-metric-lbl">Films Logged</span>
          </div>
          <div className="profile-metric-divider" />
          <div className="profile-metric-col">
            <span className="profile-metric-val">{watchlistCount}</span>
            <span className="profile-metric-lbl">In Watchlist</span>
          </div>
          <div className="profile-metric-divider" />
          <div className="profile-metric-col">
            <span className="profile-metric-val">
              {averageRating ? `${averageRating} ★` : '—'}
            </span>
            <span className="profile-metric-lbl">Average Score</span>
          </div>
          <div className="profile-metric-divider" />
          <div className="profile-metric-col">
            <span className="profile-metric-val">{listsCount}</span>
            <span className="profile-metric-lbl">Curated Lists</span>
          </div>
        </div>
      </header>

      {/* SIGNATURE FOUR FAVORITES (LETTERBOXD STYLE) */}
      <section className="profile-favorites-section">
        <div className="profile-section-heading-row">
          <div>
            <span className="profile-section-eyebrow">SIGNATURE FILMS</span>
            <h2 className="profile-section-title">Four Favorites</h2>
          </div>
          <span className="profile-section-hint">
            {userReviews.length >= 4 ? 'Top rated critiques from your diary' : 'Handpicked cinema highlights'}
          </span>
        </div>

        <div className="profile-favorites-grid">
          {fourFavorites.map((favMovie, idx) => (
            <div 
              key={favMovie.id || idx}
              className="profile-fav-poster-card"
              onClick={() => onViewMovie(favMovie.id)}
            >
              <img 
                src={proxyImageUrl ? proxyImageUrl(favMovie.posterUrl) : favMovie.posterUrl} 
                alt={favMovie.title}
                className="profile-fav-poster-img"
                loading="lazy"
              />
              <div className="profile-fav-poster-overlay">
                {favMovie.userRating ? (
                  <span className="profile-fav-score-pill">
                    ★ {Number(favMovie.userRating).toFixed(1)}
                  </span>
                ) : (
                  <span className="profile-fav-score-pill pick">
                    Highlight
                  </span>
                )}
                <div className="profile-fav-caption">
                  <h4 className="profile-fav-title">{favMovie.title}</h4>
                  {favMovie.year && <span className="profile-fav-year">{favMovie.year}</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Empty slot placeholder if user has no movies */}
          {fourFavorites.length < 4 && Array.from({ length: 4 - fourFavorites.length }).map((_, idx) => (
            <div 
              key={`placeholder-${idx}`} 
              className="profile-fav-poster-card empty-slot"
              onClick={() => onNavigate?.('top-rated')}
            >
              <div className="profile-empty-slot-content">
                <Plus size={20} className="profile-empty-slot-icon" />
                <span>Rate a film to feature</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MINIMAL UNDERLINE NAVIGATION TABS */}
      <nav className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <span>Diary & Reviews</span>
          <span className="profile-tab-badge">{reviewsCount}</span>
        </button>

        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          <span>Watchlist</span>
          <span className="profile-tab-badge">{watchlistCount}</span>
        </button>

        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'lists' ? 'active' : ''}`}
          onClick={() => setActiveTab('lists')}
        >
          <span>Curated Lists</span>
          <span className="profile-tab-badge">{listsCount}</span>
        </button>

        {allUsers.length > 0 && (
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <span>Critic Network</span>
            <span className="profile-tab-badge">{allUsers.filter(u => u.username !== currentUsername).length}</span>
          </button>
        )}
      </nav>

      {/* TAB CONTENT PANELS */}

      {/* TAB 1: REVIEWS & DIARY */}
      {activeTab === 'reviews' && (
        <div className="profile-tab-pane slide-up">
          {userReviews.length === 0 ? (
            <div className="profile-empty-slate">
              <Film size={36} className="profile-empty-slate-icon" />
              <h3 className="profile-empty-slate-title">Your cinema diary is quiet</h3>
              <p className="profile-empty-slate-desc">
                Log films and publish critiques to build your personal viewing diary and record your critical ratings.
              </p>
              <button 
                type="button"
                className="profile-btn-primary"
                onClick={() => onNavigate?.('top-rated')}
              >
                <Compass size={14} />
                <span>Discover Films to Review</span>
              </button>
            </div>
          ) : (
            <div className="profile-reviews-list">
              {userReviews.map((rev, idx) => (
                <article key={rev.id || idx} className="profile-review-row">
                  <div 
                    className="profile-review-thumbnail-col"
                    onClick={() => onViewMovie(rev.movieId)}
                  >
                    <img 
                      src={proxyImageUrl ? proxyImageUrl(rev.moviePoster) : rev.moviePoster} 
                      alt={rev.movieTitle}
                      className="profile-review-thumb-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="profile-review-main-col">
                    <div className="profile-review-header-line">
                      <div className="profile-review-title-group">
                        <h3 
                          className="profile-review-film-name"
                          onClick={() => onViewMovie(rev.movieId)}
                        >
                          {rev.movieTitle}
                        </h3>
                        {rev.movieYear && <span className="profile-review-year-tag">{rev.movieYear}</span>}
                        {rev.movieGenre && (
                          <span className="profile-review-genre-tag">{rev.movieGenre}</span>
                        )}
                      </div>

                      <div className="profile-review-rating-tag">
                        <Star size={13} className="profile-star-gold" />
                        <span className="profile-rating-score">{Number(rev.rating).toFixed(1)}</span>
                        <span className="profile-rating-denominator">/ 10</span>
                      </div>
                    </div>

                    <p className="profile-review-prose">
                      "{rev.text}"
                    </p>

                    <div className="profile-review-subfooter">
                      <div className="profile-review-meta-left">
                        <span className="profile-review-date-text">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently logged'}
                        </span>
                        {rev.likes > 0 && (
                          <span className="profile-review-metric-item">
                            <Heart size={12} /> {rev.likes}
                          </span>
                        )}
                        {(rev.replies || rev.comments || []).length > 0 && (
                          <span className="profile-review-metric-item">
                            <MessageSquare size={12} /> {(rev.replies || rev.comments || []).length}
                          </span>
                        )}
                      </div>

                      <button 
                        type="button"
                        className="profile-review-link-btn"
                        onClick={() => onViewMovie(rev.movieId)}
                      >
                        <span>Film Details</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="profile-tab-pane slide-up">
          <div className="profile-pane-title-row">
            <div>
              <h3 className="profile-pane-heading">Queued Watchlist</h3>
              <p className="profile-pane-subheading">{watchlistCount} {watchlistCount === 1 ? 'film' : 'films'} earmarked for upcoming screenings</p>
            </div>
          </div>

          <MovieGrid
            movies={watchlistMovies}
            onMovieClick={onViewMovie}
            emptyTitle="Your watchlist is empty"
            emptyMessage="Browse films across Tamil, Malayalam, and World Cinema to build your viewing queue."
            emptyAction={
              <button 
                type="button"
                className="profile-btn-primary"
                onClick={() => onNavigate?.('home')}
                style={{ marginTop: '1rem' }}
              >
                <Compass size={14} />
                <span>Explore Catalog</span>
              </button>
            }
          />
        </div>
      )}

      {/* TAB 3: CURATED LISTS */}
      {activeTab === 'lists' && (
        <div className="profile-tab-pane slide-up">
          <div className="profile-pane-title-row">
            <div>
              <h3 className="profile-pane-heading">Curated Film Collections</h3>
              <p className="profile-pane-subheading">Themed cinema collections curated by {currentUsername}</p>
            </div>
            {isLoggedIn && (
              <button 
                type="button"
                className="profile-btn-ghost"
                onClick={() => setShowInlineCreateList(prev => !prev)}
              >
                <Plus size={13} />
                <span>{showInlineCreateList ? 'Cancel' : 'New Collection'}</span>
              </button>
            )}
          </div>

          {/* Inline Create List Form */}
          {showInlineCreateList && (
            <form onSubmit={handleInlineCreateListSubmit} className="profile-inline-form slide-up">
              <h4 className="profile-form-title">Create a Curated Collection</h4>
              
              <div className="profile-form-field">
                <label className="profile-form-label">Collection Title</label>
                <input
                  type="text"
                  placeholder="e.g. Essential 90s Tamil Neo-Noir"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="search-input profile-minimal-input"
                  maxLength={100}
                  required
                />
              </div>

              <div className="profile-form-field">
                <label className="profile-form-label">Description (Optional)</label>
                <textarea
                  placeholder="Brief curatorial notes or theme description..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="search-input profile-minimal-input textarea"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="profile-form-btn-row">
                <button 
                  type="button"
                  className="profile-btn-ghost"
                  onClick={() => { setShowInlineCreateList(false); setNewListName(''); setNewListDesc(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isSubmittingList || !newListName.trim()}
                >
                  {isSubmittingList ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          )}

          {userLists.length === 0 ? (
            <div className="profile-empty-slate">
              <Layers size={36} className="profile-empty-slate-icon" />
              <h3 className="profile-empty-slate-title">No collections curated yet</h3>
              <p className="profile-empty-slate-desc">
                Curate themed movie lists and share your cinema taste with fellow critics.
              </p>
              {isLoggedIn ? (
                <button 
                  type="button"
                  className="profile-btn-primary"
                  onClick={() => setShowInlineCreateList(true)}
                >
                  <Plus size={14} />
                  <span>Create First Collection</span>
                </button>
              ) : (
                <button 
                  type="button"
                  className="profile-btn-primary"
                  onClick={onOpenAuth}
                >
                  <LogIn size={14} />
                  <span>Sign In to Curate</span>
                </button>
              )}
            </div>
          ) : (
            <div className="profile-lists-collection-grid">
              {userLists.map(list => {
                const listMovies = movies.filter(m => (list.movieIds || []).includes(m.id));
                return (
                  <div 
                    key={list.id} 
                    className="profile-collection-card"
                    onClick={() => onViewList(list)}
                  >
                    <div className="profile-collection-posters">
                      {listMovies.slice(0, 4).map((m, i) => (
                        <img 
                          key={m.id || i} 
                          src={proxyImageUrl ? proxyImageUrl(m.posterUrl) : m.posterUrl} 
                          alt={m.title}
                          className="profile-collection-mini-poster"
                          loading="lazy"
                        />
                      ))}
                      {listMovies.length === 0 && (
                        <div className="profile-collection-empty">
                          <Film size={20} />
                          <span>Empty</span>
                        </div>
                      )}
                    </div>

                    <div className="profile-collection-info">
                      <div className="profile-collection-title-row">
                        <h4 className="profile-collection-title">{list.name}</h4>
                        <span className="profile-collection-count">
                          {(list.movieIds || []).length} { (list.movieIds || []).length === 1 ? 'film' : 'films' }
                        </span>
                      </div>
                      {list.description && (
                        <p className="profile-collection-desc">{list.description}</p>
                      )}
                      <span className="profile-collection-link">
                        View Collection <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CRITIC NETWORK */}
      {activeTab === 'network' && (
        <div className="profile-tab-pane slide-up">
          <div className="profile-pane-title-row">
            <div>
              <h3 className="profile-pane-heading">Critic Community</h3>
              <p className="profile-pane-subheading">Follow fellow critics to explore their viewing logs and critiques</p>
            </div>
          </div>

          <div className="profile-critics-compact-grid">
            {allUsers
              .filter(u => u.username !== currentUsername)
              .map(u => {
                const isFollowing = followingList.includes(u.username);
                return (
                  <div key={u.username} className="profile-compact-critic-card">
                    <div className="profile-critic-brief">
                      <img 
                        src={u.avatarUrl || DEFAULT_AVATAR} 
                        alt={u.username} 
                        className="profile-critic-tiny-avatar"
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      />
                      <div className="profile-critic-text-block">
                        <span className="profile-critic-name">{u.username}</span>
                        <span className="profile-critic-followers">
                          {(u.followers || []).length} { (u.followers || []).length === 1 ? 'follower' : 'followers' }
                        </span>
                      </div>
                    </div>

                    <div className="profile-critic-action-wrap">
                      {isLoggedIn ? (
                        isFollowing ? (
                          <button 
                            type="button"
                            className="profile-btn-ghost small following"
                            onClick={() => onUnfollow(u.username)}
                          >
                            <UserCheck size={12} />
                            <span>Following</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            className="profile-btn-ghost small"
                            onClick={() => onFollow(u.username)}
                          >
                            <UserPlus size={12} />
                            <span>Follow</span>
                          </button>
                        )
                      ) : (
                        <button 
                          type="button"
                          className="profile-btn-ghost small"
                          onClick={onOpenAuth}
                        >
                          <LogIn size={12} />
                          <span>Sign In</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
