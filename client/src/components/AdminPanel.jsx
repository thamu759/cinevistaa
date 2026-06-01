import { useState, useEffect, useRef } from 'react';
import {
  Shield, Film, MessageSquare, Database, Check, Plus, Search, X,
  Trash2, Users, Star, Sparkles, ChevronLeft, ChevronRight,
  Activity, RefreshCw, BarChart3, Save, Edit
} from 'lucide-react';
import {
  fetchMovies, fetchMovieById, addMovie, deleteMovie, updateMovie,
  refreshMoviePosters, curateMovie, proxyImageUrl,
  fetchUsers, deleteUser as deleteUserApi, updateUserRole,
  searchTmdbMovies, fetchTmdbCredits, fetchTmdbMovieDetails,
  bulkAddMovies
} from '../api';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

const ITEMS_PER_PAGE = 10;

export default function AdminPanel({ currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  useEffect(() => { loadMovies(); }, []);
  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMovies({ sort: 'popular' });
      setMovies(data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const handleRefreshPosters = async () => {
    setIsLoading(true);
    try {
      const updated = await refreshMoviePosters();
      setMovies(updated);
      showSuccess('Posters refreshed.');
    } catch (err) { alert(err.message); }
    setIsLoading(false);
  };

  const handleCurate = async (movieId, data) => {
    setIsLoading(true);
    try {
      const updated = await curateMovie(movieId, data);
      setMovies(prev => prev.map(m => m.id === movieId ? { ...m, ...updated } : m));
      showSuccess('Curation updated.');
    } catch (err) { alert(err.message); }
    setIsLoading(false);
  };

  const totalReviews = movies.reduce((sum, m) => sum + (m.reviews ? m.reviews.length : 0), 0);
  const heroCount = movies.filter(m => m.isHero).length;
  const staffPickCount = movies.filter(m => m.isStaffPick).length;
  const featuredCount = movies.filter(m => m.isStaffPick && m.staffPickType === 'featured').length;
  const gridPickCount = movies.filter(m => m.isStaffPick && m.staffPickType === 'grid').length;

  return (
    <div className="main-content admin-view" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header">
        <div>
          <div className="admin-session-badge"><Shield size={10} /><span>Admin Session</span></div>
          <h1 className="admin-title">thiraipedia Control Panel</h1>
          <p className="admin-subtitle">Configure library entries, manage users, moderate community, and oversee metrics.</p>
        </div>
        <div className="admin-user">
          <div className="admin-user-info">
            <span className="admin-user-label">Logged in as</span>
            <span className="admin-user-name">{currentUser.username}</span>
          </div>
          <img src={currentUser.avatarUrl} alt="Admin" className="admin-user-avatar" />
        </div>
      </div>

      {successMsg && (
        <div className="admin-alert"><Check size={18} /><span>{successMsg}</span></div>
      )}

      <div className="admin-tabs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'movies', label: 'Movies', icon: Film },
          { id: 'users', label: 'Users', icon: Users },

        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}>
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && (
        <DashboardTab movies={movies} totalReviews={totalReviews} heroCount={heroCount} staffPickCount={staffPickCount} featuredCount={featuredCount} gridPickCount={gridPickCount} currentUser={currentUser} onRefreshPosters={handleRefreshPosters} />
      )}
      {activeTab === 'movies' && (
        <MoviesTab movies={movies} setMovies={setMovies} showSuccess={showSuccess} proxyImageUrl={proxyImageUrl} updateMovie={updateMovie} addMovie={addMovie} deleteMovie={deleteMovie} />
      )}
      {activeTab === 'users' && (
        <UsersTab users={users} setUsers={setUsers} currentUser={currentUser} showSuccess={showSuccess} />
      )}

    </div>
  );
}

function DashboardTab({ movies, totalReviews, heroCount, staffPickCount, featuredCount, gridPickCount, currentUser, onRefreshPosters }) {
  const stats = [
    { label: 'Total Movies', value: movies.length, icon: Film, bg: 'rgba(251,191,36,0.06)', iconBg: 'rgba(251,191,36,0.1)' },
    { label: 'Total Reviews', value: totalReviews, icon: MessageSquare, bg: 'rgba(99,102,241,0.06)', iconBg: 'rgba(99,102,241,0.1)' },
    { label: 'Hero', value: heroCount, icon: Star, bg: 'rgba(251,191,36,0.06)', iconBg: 'rgba(251,191,36,0.1)' },
    { label: 'Featured', value: featuredCount, icon: Sparkles, bg: 'rgba(99,102,241,0.06)', iconBg: 'rgba(99,102,241,0.1)' },
    { label: 'Grid Pick', value: gridPickCount, icon: Database, bg: 'rgba(52,211,153,0.06)', iconBg: 'rgba(52,211,153,0.1)' },
    { label: 'Staff Picks', value: staffPickCount, icon: Users, bg: 'rgba(168,85,247,0.06)', iconBg: 'rgba(168,85,247,0.1)' },
  ];
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <BarChart3 size={18} style={{ color: 'var(--color-accent-gold)' }} />
        <h2>Dashboard Overview</h2>
      </div>
      <div className="admin-stats">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="admin-stat" style={{ background: s.bg }}>
              <div className="admin-stat-icon" style={{ background: s.iconBg }}>
                <Icon size={16} style={{ color: 'var(--color-accent-gold)' }} />
              </div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{s.value}</div>
            </div>
          );
        })}
      </div>
      <div className="admin-actions">
        <div className="admin-actions-title">Quick Actions</div>
        <div className="admin-actions-row">
          <button onClick={onRefreshPosters} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh All Posters
          </button>
        </div>
      </div>
    </div>
  );
}

function MoviesTab({ movies, setMovies, showSuccess, proxyImageUrl, updateMovie, addMovie, deleteMovie }) {
  const [loading, setLoading] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editTmdbQuery, setEditTmdbQuery] = useState('');
  const [editTmdbResults, setEditTmdbResults] = useState([]);
  const [editTmdbSearching, setEditTmdbSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '', posterUrl: '', releaseDate: '', language: '', director: '', writer: '', studio: '', genre: '', runtime: '', isHero: false, isStaffPick: false, staffPickType: '', isUpcoming: false, trailerUrl: '', trailerChannelName: '', ottPlatform: '', ottReleaseDate: '', ottUrl: '', criticScore: '', audienceScore: '', rating: '' });
  const [addCast, setAddCast] = useState([]);
  const [addTmdbQuery, setAddTmdbQuery] = useState('');
  const [addTmdbResults, setAddTmdbResults] = useState([]);
  const [addTmdbSearching, setAddTmdbSearching] = useState(false);
  const [addAutoSearching, setAddAutoSearching] = useState(false);
  const [lastAutoFetchedTitle, setLastAutoFetchedTitle] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkProgress, setBulkProgress] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  useEffect(() => {
    if (!editTmdbQuery.trim()) { setEditTmdbResults([]); return; }
    const timer = setTimeout(async () => {
      setEditTmdbSearching(true);
      try { const data = await searchTmdbMovies(editTmdbQuery.trim()); setEditTmdbResults(Array.isArray(data) ? data : []); }
      catch (e) { setEditTmdbResults([]); }
      setEditTmdbSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [editTmdbQuery]);

  useEffect(() => {
    if (!addTmdbQuery.trim()) { setAddTmdbResults([]); return; }
    const timer = setTimeout(async () => {
      setAddTmdbSearching(true);
      try { const data = await searchTmdbMovies(addTmdbQuery.trim()); setAddTmdbResults(Array.isArray(data) ? data : []); }
      catch (e) { setAddTmdbResults([]); }
      setAddTmdbSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [addTmdbQuery]);

  useEffect(() => {
    const title = addForm.title.trim();
    if (!title || title.length < 3 || title === lastAutoFetchedTitle) return;
    setAddAutoSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchTmdbMovies(title);
        const results = Array.isArray(data) ? data : [];
        if (results.length > 0) {
          const best = results[0];
          setAddForm(prev => ({ ...prev, posterUrl: best.posterUrl || prev.posterUrl }));
          if (best.tmdbId) {
            const [credits, details] = await Promise.all([
              fetchTmdbCredits(best.tmdbId),
              fetchTmdbMovieDetails(best.tmdbId)
            ]);
            if (Array.isArray(credits) && credits.length > 0) {
              setAddCast(credits);
            }
            if (details) {
              setAddForm(prev => ({ ...prev, ...details }));
            }
          }
        }
        setLastAutoFetchedTitle(title);
      } catch (e) {
        console.error('[auto-fetch] error:', e);
      }
      setAddAutoSearching(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [addForm.title]);

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await deleteMovie(confirmDelete);
      setMovies(prev => prev.filter(m => m.id !== confirmDelete));
      showSuccess("Movie deleted.");
    } catch (err) { alert(err.message); }
    setLoading(false);
    setConfirmDelete(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMovie) return;
    setLoading(true);
    try {
      const data = { ...editingMovie };
      if (data.ott && !data.ott.platform) {
        data.ott = undefined;
      }
      const updated = await updateMovie(editingMovie.id, data);
      setMovies(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingMovie(null);
      setEditPreview(null);
      showSuccess("Movie updated.");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const applyEditTmdb = async (m) => {
    setEditingMovie(prev => ({
      ...prev,
      title: m.title || prev.title,
      description: m.description || prev.description,
      posterUrl: m.posterUrl || prev.posterUrl,
      releaseDate: m.releaseDate || prev.releaseDate,
      language: m.language || prev.language,
      cast: m.cast || prev.cast,
    }));
    setEditPreview(m.posterUrl ? m.posterUrl : null);
    if (m.tmdbId) {
      try {
        const [credits, details] = await Promise.all([
          fetchTmdbCredits(m.tmdbId),
          fetchTmdbMovieDetails(m.tmdbId)
        ]);
        if (Array.isArray(credits) && credits.length > 0) {
          setEditingMovie(prev => prev ? { ...prev, cast: credits } : prev);
        }
        if (details) setEditingMovie(prev => prev ? { ...prev, ...details } : prev);
      } catch (e) {}
    }
  };

  const applyAddTmdb = async (m) => {
    setLastAutoFetchedTitle(m.title || '');
    setAddForm(prev => ({
      ...prev,
      title: m.title || '',
      description: m.description || '',
      posterUrl: m.posterUrl || '',
      releaseDate: m.releaseDate || '',
      language: (m.language || '').toUpperCase(),
      director: '',
      writer: '',
      studio: '',
      genre: '',
      runtime: '',
      trailerUrl: '',
      trailerChannelName: '',
      ottPlatform: '',
      ottReleaseDate: '',
      ottUrl: '',
    }));
    if (m.tmdbId) {
      try {
        const [credits, details] = await Promise.all([
          fetchTmdbCredits(m.tmdbId),
          fetchTmdbMovieDetails(m.tmdbId)
        ]);
        if (Array.isArray(credits) && credits.length > 0) setAddCast(credits);
        if (details) setAddForm(prev => ({ ...prev, ...details }));
      } catch (e) {}
    }
  };

  const handleAddMovie = async () => {
    if (!addForm.title.trim()) return;
    const duplicate = movies.find(m => m.title.toLowerCase() === addForm.title.trim().toLowerCase());
    if (duplicate) {
      alert(`"${addForm.title}" already exists!`);
      return;
    }
    setLoading(true);
    try {
      const { ottPlatform, ottReleaseDate, ottUrl, criticScore, audienceScore, rating, ...restForm } = addForm;
      const payload = {
        ...restForm,
        criticScore: criticScore !== '' ? parseFloat(criticScore) : 5.0,
        audienceScore: audienceScore !== '' ? parseInt(audienceScore) : 50,
        rating: rating !== '' ? parseFloat(rating) : 0,
        cast: addCast,
        ott: ottPlatform ? { platform: ottPlatform, releaseDate: ottReleaseDate || '', url: ottUrl || '' } : undefined
      };
      const created = await addMovie(payload);
      setMovies(prev => [...prev, created]);
      setAddForm({ title: '', description: '', posterUrl: '', releaseDate: '', language: '', director: '', writer: '', studio: '', genre: '', runtime: '', isHero: false, isStaffPick: false, staffPickType: '', isUpcoming: false, trailerUrl: '', trailerChannelName: '', ottPlatform: '', ottReleaseDate: '', ottUrl: '', criticScore: '', audienceScore: '', rating: '' });
      setAddCast([]);
      setAddTmdbQuery('');
      setAddTmdbResults([]);
      setAddAutoSearching(false);
      setLastAutoFetchedTitle('');
      setShowAddModal(false);
      showSuccess('Movie added.');
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const handleBulkAdd = async () => {
    const titles = bulkInput.split('\n').filter(t => t.trim());
    if (titles.length === 0) return;
    setBulkRunning(true);
    setBulkProgress([]);
    try {
      const existingTitles = movies.map(m => m.title);
      const results = await bulkAddMovies(titles, (current, total, title, status) => {
        setBulkProgress(prev => {
          const idx = prev.findIndex(p => p.title === title);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], status, current, total };
            return next;
          }
          return [...prev, { title, status, current, total }];
        });
      }, existingTitles);
      setBulkProgress(results.map(r => ({ ...r, current: 0, total: 0 })));
      showSuccess(`Added ${results.filter(r => r.status === 'added').length}/${titles.length} movies.`);
      loadMovies();
    } catch (err) { alert(err.message); }
    setBulkRunning(false);
  };

  const filtered = filterText.trim()
    ? movies.filter(m => m.title.toLowerCase().includes(filterText.toLowerCase()))
    : movies;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <Film size={18} style={{ color: 'var(--color-accent-gold)' }} />
        <h2>Movie Library</h2>
        <span className="admin-panel-count">{movies.length} titles</span>
      </div>

      <div className="admin-movies-toolbar">
        <div className="admin-movies-search">
          <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            className="admin-movies-search-input"
            placeholder="Search movies..."
            value={filterText}
            onChange={e => { setFilterText(e.target.value); setPage(0); }}
          />
          {filterText && (
            <button className="admin-movies-search-clear" onClick={() => { setFilterText(''); setPage(0); }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', flexShrink: 0 }}>
          <Plus size={14} /> Add Movie
        </button>
        <button onClick={() => { setShowBulkModal(true); setBulkInput(''); setBulkProgress([]); }}
          className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', flexShrink: 0 }}>
          <Database size={14} /> Bulk Add
        </button>
      </div>

      <div className="admin-movie-grid">
        {paged.map(movie => (
          <div key={movie.id} className="admin-movie-grid-card">
            <div className="admin-movie-grid-poster-wrap">
              <img src={proxyImageUrl(movie.posterUrl || movie.imageUrl)} alt={movie.title} className="admin-movie-grid-poster" />
              <div className="admin-movie-grid-overlay">
                <button onClick={() => { setEditingMovie({ ...movie }); setEditPreview(null); setEditTmdbQuery(''); setEditTmdbResults([]); }} disabled={loading}
                  className="admin-movie-grid-action edit">
                  <Edit size={13} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(movie.id)} disabled={loading}
                  className="admin-movie-grid-action delete">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
            <div className="admin-movie-grid-info">
              <div className="admin-movie-grid-title">{movie.title}</div>
              <div className="admin-movie-grid-meta">
                <span className="admin-movie-grid-year">{movie.year || movie.releaseDate?.split('-')[0] || '—'}</span>
                <span className="admin-movie-grid-rating">★ {movie.rating?.toFixed(1) || '—'}</span>
              </div>


            </div>


          </div>
        ))}
      </div>

      {filtered.length === 0 && !filterText && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <Film size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>No movies yet. Click "Add Movie" to get started.</p>
        </div>
      )}

      {filtered.length === 0 && filterText && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <Search size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>No movies match "{filterText}"</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="admin-page-btn">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="admin-page-info">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="admin-page-btn">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Add Movie Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setAddForm({ title: '', description: '', posterUrl: '', releaseDate: '', language: '', director: '', writer: '', studio: '', genre: '', runtime: '', isHero: false, isStaffPick: false, staffPickType: '', isUpcoming: false, trailerUrl: '', trailerChannelName: '', ottPlatform: '', ottReleaseDate: '', ottUrl: '', criticScore: '', audienceScore: '', rating: '' }); setAddCast([]); setAddTmdbQuery(''); setAddTmdbResults([]); setAddAutoSearching(false); setLastAutoFetchedTitle(''); }} title="Add New Movie" width="720px">
        <div className="admin-add-modal-tmdb">
          <label className="admin-label" style={{ marginBottom: '0.25rem' }}>Quick fill from TMDB</label>
          <div style={{ position: 'relative' }}>
            <input className="admin-input" placeholder="Search TMDB..." value={addTmdbQuery} onChange={e => setAddTmdbQuery(e.target.value)} />
            {addTmdbSearching && <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Searching...</span>}
          </div>
          {addTmdbResults.length > 0 && (
              <div className="admin-tmdb-results" style={{ marginTop: '0.3rem', maxHeight: '160px' }}>
                {addTmdbResults.map(tmdb => (
                  <div key={tmdb.tmdbId} onClick={() => applyAddTmdb(tmdb)} className="admin-tmdb-item">
                    {tmdb.posterUrl && <img src={tmdb.posterUrl} alt={tmdb.title} style={{ width: '26px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tmdb.title}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{tmdb.releaseDate || '—'} • {tmdb.language?.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.85rem 0' }} />
        <div className="admin-edit-grid">
          <div><label className="admin-label">Title *</label><div style={{ position: 'relative' }}><input className="admin-input" value={addForm.title} onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))} />{addAutoSearching && <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Fetching TMDB...</span>}</div></div>
          <div><label className="admin-label">Release Date</label><input className="admin-input" value={addForm.releaseDate} onChange={e => setAddForm(prev => ({ ...prev, releaseDate: e.target.value }))} /></div>
          <div className="admin-edit-full"><label className="admin-label">Description</label><textarea className="admin-textarea" value={addForm.description} onChange={e => setAddForm(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>
          <div><label className="admin-label">Poster URL</label><input className="admin-input" value={addForm.posterUrl} onChange={e => setAddForm(prev => ({ ...prev, posterUrl: e.target.value }))} /></div>
          <div><label className="admin-label">Language</label><input className="admin-input" value={addForm.language} onChange={e => setAddForm(prev => ({ ...prev, language: e.target.value }))} /></div>
          <div><label className="admin-label">Director</label><input className="admin-input" value={addForm.director} onChange={e => setAddForm(prev => ({ ...prev, director: e.target.value }))} /></div>
          <div><label className="admin-label">Writer</label><input className="admin-input" value={addForm.writer} onChange={e => setAddForm(prev => ({ ...prev, writer: e.target.value }))} /></div>
          <div><label className="admin-label">Studio</label><input className="admin-input" value={addForm.studio} onChange={e => setAddForm(prev => ({ ...prev, studio: e.target.value }))} /></div>
          <div><label className="admin-label">Genre</label><input className="admin-input" value={addForm.genre} onChange={e => setAddForm(prev => ({ ...prev, genre: e.target.value }))} /></div>
          <div><label className="admin-label">Runtime</label><input className="admin-input" value={addForm.runtime} onChange={e => setAddForm(prev => ({ ...prev, runtime: e.target.value }))} placeholder="e.g. 2h 44m" /></div>
          <div><label className="admin-label">Critic Score</label><input className="admin-input" type="number" min="0" max="10" step="0.1" value={addForm.criticScore} onChange={e => setAddForm(prev => ({ ...prev, criticScore: e.target.value }))} placeholder="0-10" /></div>
          <div><label className="admin-label">Audience Score</label><input className="admin-input" type="number" min="0" max="100" value={addForm.audienceScore} onChange={e => setAddForm(prev => ({ ...prev, audienceScore: e.target.value }))} placeholder="0-100" /></div>
          <div><label className="admin-label">Rating</label><input className="admin-input" type="number" min="0" max="10" step="0.1" value={addForm.rating} onChange={e => setAddForm(prev => ({ ...prev, rating: e.target.value }))} placeholder="0-10" /></div>
          <div className="admin-edit-full"><label className="admin-label">Trailer URL (YouTube)</label><input className="admin-input" value={addForm.trailerUrl} onChange={e => setAddForm(prev => ({ ...prev, trailerUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." /></div>
          <div className="admin-edit-full"><label className="admin-label">YouTube Channel Name</label><input className="admin-input" value={addForm.trailerChannelName} onChange={e => setAddForm(prev => ({ ...prev, trailerChannelName: e.target.value }))} placeholder="e.g. Sony Pictures Entertainment" /></div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap', paddingTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label className="admin-label">OTT Platform</label>
              <select className="admin-input" value={addForm.ottPlatform} onChange={e => setAddForm(prev => ({ ...prev, ottPlatform: e.target.value }))} style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)', width: '100%' }}>
                <option value="">None</option>
                <option value="Netflix">Netflix</option>
                <option value="Amazon Prime Video">Amazon Prime Video</option>
                <option value="Disney+ Hotstar">Disney+ Hotstar</option>
                <option value="Sony LIV">Sony LIV</option>
                <option value="Zee5">Zee5</option>
                <option value="JioCinema">JioCinema</option>
                <option value="Sun NXT">Sun NXT</option>
                <option value="Aha">Aha</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label className="admin-label">OTT Release Date</label>
              <input className="admin-input" type="date" value={addForm.ottReleaseDate} onChange={e => setAddForm(prev => ({ ...prev, ottReleaseDate: e.target.value }))} style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label className="admin-label">OTT URL</label>
              <input className="admin-input" value={addForm.ottUrl} onChange={e => setAddForm(prev => ({ ...prev, ottUrl: e.target.value }))} placeholder="https://" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} />
            </div>
          </div>
          {addCast.length > 0 && (
            <div className="admin-edit-full">
              <label className="admin-label">Cast (auto-fetched from TMDB)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {addCast.map((member, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem' }}>
{member.avatarUrl && <img src={member.avatarUrl} alt={member.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />}
                    <span style={{ fontWeight: 600 }}>{member.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>({member.role})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="admin-edit-full" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span onClick={() => setAddForm(prev => ({ ...prev, isHero: !prev.isHero }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: addForm.isHero ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)', border: addForm.isHero ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.04)', color: addForm.isHero ? '#fbbf24' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
              ★ Hero Card
            </span>
            <span onClick={() => setAddForm(prev => ({ ...prev, isStaffPick: !prev.isStaffPick, staffPickType: !prev.isStaffPick ? (prev.staffPickType || 'grid') : '' }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: addForm.isStaffPick ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: addForm.isStaffPick ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.04)', color: addForm.isStaffPick ? '#a5b4fc' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
              ✦ Staff Pick
            </span>
            {addForm.isStaffPick && (
              <select value={addForm.staffPickType || 'grid'} onChange={e => setAddForm(prev => ({ ...prev, staffPickType: e.target.value }))} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                <option value="grid">Grid</option>
                <option value="featured">Featured</option>
              </select>
            )}
            <span onClick={() => setAddForm(prev => ({ ...prev, isUpcoming: !prev.isUpcoming }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: addForm.isUpcoming ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)', border: addForm.isUpcoming ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.04)', color: addForm.isUpcoming ? '#34d399' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
              🆕 Upcoming
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={() => { setShowAddModal(false); setAddForm({ title: '', description: '', posterUrl: '', releaseDate: '', language: '', director: '', writer: '', studio: '', genre: '', runtime: '', isHero: false, isStaffPick: false, staffPickType: '', isUpcoming: false, trailerUrl: '', trailerChannelName: '', ottPlatform: '', ottReleaseDate: '', ottUrl: '', criticScore: '', audienceScore: '', rating: '' }); setAddCast([]); setAddTmdbQuery(''); setAddTmdbResults([]); setAddAutoSearching(false); setLastAutoFetchedTitle(''); }}
            className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>Cancel</button>
          <button onClick={handleAddMovie} disabled={loading || !addForm.title.trim()}
            className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Plus size={14} /> {loading ? 'Adding...' : 'Add Movie'}
          </button>
        </div>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal isOpen={showBulkModal} onClose={() => { if (!bulkRunning) { setShowBulkModal(false); setBulkInput(''); setBulkProgress([]); } }} title="Bulk Add Movies" width="600px">
        <label className="admin-label" style={{ marginBottom: '0.3rem' }}>Enter movie titles (one per line)</label>
        <textarea className="admin-textarea" value={bulkInput} onChange={e => setBulkInput(e.target.value)} rows={8} placeholder="Leo&#10;Jailer&#10;Vikram&#10;Master" disabled={bulkRunning} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }} />
        {bulkProgress.length > 0 && (
          <div style={{ marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
            {bulkProgress.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', fontSize: '0.75rem' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: p.status === 'added' || p.status === 'done' ? '#34d399'
                    : p.status === 'error' ? '#ef4444'
                    : p.status === 'skipped' ? '#94a3b8'
                    : p.status === 'searching' || p.status === 'adding' ? '#fbbf24'
                    : 'rgba(255,255,255,0.1)'
                }} />
                <span style={{ fontWeight: 600 }}>{p.title}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {p.status === 'added' || p.status === 'done' ? '✓ Added'
                    : p.status === 'error' ? `✗ ${p.error || 'Failed'}`
                    : p.status === 'skipped' ? '⏭ Already exists'
                    : p.status === 'searching' ? 'Searching TMDB...'
                    : p.status === 'adding' ? 'Adding...'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={() => { setShowBulkModal(false); setBulkInput(''); setBulkProgress([]); }}
            className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} disabled={bulkRunning}>Cancel</button>
          <button onClick={handleBulkAdd} disabled={bulkRunning || !bulkInput.trim()}
            className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Database size={14} /> {bulkRunning ? 'Adding...' : 'Add All'}
          </button>
        </div>
      </Modal>

      {/* Edit Movie Modal */}
      <Modal isOpen={!!editingMovie} onClose={() => { setEditingMovie(null); setEditTmdbQuery(''); setEditTmdbResults([]); setEditPreview(null); }} title="Edit Movie" width="720px">
        <div className="admin-add-modal-tmdb">
          <label className="admin-label" style={{ marginBottom: '0.25rem' }}>Quick fill from TMDB</label>
          <div style={{ position: 'relative' }}>
            <input className="admin-input" placeholder="Search TMDB..." value={editTmdbQuery} onChange={e => setEditTmdbQuery(e.target.value)} />
            {editTmdbSearching && <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Searching...</span>}
          </div>
          {editTmdbResults.length > 0 && (
              <div className="admin-tmdb-results" style={{ marginTop: '0.3rem', maxHeight: '160px' }}>
                {editTmdbResults.map(tmdb => (
                  <div key={tmdb.tmdbId} onClick={() => applyEditTmdb(tmdb)} className="admin-tmdb-item">
                    {tmdb.posterUrl && <img src={tmdb.posterUrl} alt={tmdb.title} style={{ width: '26px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tmdb.title}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{tmdb.releaseDate || '—'} • {tmdb.language?.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.85rem 0' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flexShrink: 0, width: '140px' }}>
            {(editPreview || editingMovie?.posterUrl) ? (
              <img src={proxyImageUrl(editPreview || editingMovie.posterUrl)} alt={editingMovie?.title || 'Movie poster'} style={{ width: '100%', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.08)', fontSize: '0.7rem' }}>No Poster</div>
            )}
          </div>
          <div className="admin-edit-grid" style={{ flex: 1 }}>
            <div className="admin-edit-full"><label className="admin-label">Title</label><input className="admin-input" value={editingMovie?.title || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, title: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Release Date</label><input className="admin-input" value={editingMovie?.releaseDate || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, releaseDate: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Language</label><input className="admin-input" value={editingMovie?.language || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, language: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Director</label><input className="admin-input" value={editingMovie?.director || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, director: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Writer</label><input className="admin-input" value={editingMovie?.writer || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, writer: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Studio</label><input className="admin-input" value={editingMovie?.studio || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, studio: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Genre</label><input className="admin-input" value={editingMovie?.genre || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, genre: e.target.value } : prev)} /></div>
            <div><label className="admin-label">Runtime</label><input className="admin-input" value={editingMovie?.runtime || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, runtime: e.target.value } : prev)} placeholder="e.g. 2h 44m" /></div>
            <div className="admin-edit-full"><label className="admin-label">Description</label><textarea className="admin-textarea" value={editingMovie?.description || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, description: e.target.value } : prev)} rows={2} /></div>
            <div><label className="admin-label">Poster URL</label><input className="admin-input" value={editingMovie?.posterUrl || ''} onChange={e => { setEditingMovie(prev => prev ? { ...prev, posterUrl: e.target.value } : prev); setEditPreview(e.target.value); }} /></div>
            <div className="admin-edit-full"><label className="admin-label">Trailer URL (YouTube)</label><input className="admin-input" value={editingMovie?.trailerUrl || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, trailerUrl: e.target.value } : prev)} placeholder="https://www.youtube.com/watch?v=..." /></div>
            <div className="admin-edit-full"><label className="admin-label">YouTube Channel Name</label><input className="admin-input" value={editingMovie?.trailerChannelName || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, trailerChannelName: e.target.value } : prev)} placeholder="e.g. Sony Pictures Entertainment" /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap', paddingTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label className="admin-label">OTT Platform</label>
                <select className="admin-input" value={editingMovie?.ott?.platform || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, ott: { ...prev.ott, platform: e.target.value } } : prev)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)', width: '100%' }}>
                  <option value="">None</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Amazon Prime Video">Amazon Prime Video</option>
                  <option value="Disney+ Hotstar">Disney+ Hotstar</option>
                  <option value="Sony LIV">Sony LIV</option>
                  <option value="Zee5">Zee5</option>
                  <option value="JioCinema">JioCinema</option>
                  <option value="Sun NXT">Sun NXT</option>
                  <option value="Aha">Aha</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label className="admin-label">OTT Release Date</label>
                <input className="admin-input" type="date" value={editingMovie?.ott?.releaseDate || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, ott: { ...prev.ott, releaseDate: e.target.value } } : prev)} style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label className="admin-label">OTT URL</label>
                <input className="admin-input" value={editingMovie?.ott?.url || ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, ott: { ...prev.ott, url: e.target.value } } : prev)} placeholder="https://" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} />
              </div>
            </div>
            {editingMovie?.cast && editingMovie.cast.length > 0 && (
              <div className="admin-edit-full">
                <label className="admin-label">Cast (auto-fetched from TMDB)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {editingMovie.cast.map((member, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {member.avatarUrl && <img src={member.avatarUrl} alt={member.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />}
                      <span style={{ fontWeight: 600 }}>{member.name}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>({member.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div><label className="admin-label">Critic Score</label><input className="admin-input" type="number" min="0" max="10" step="0.1" value={editingMovie?.criticScore ?? ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, criticScore: e.target.value === '' ? null : parseFloat(e.target.value) } : prev)} /></div>
            <div><label className="admin-label">Audience Score</label><input className="admin-input" type="number" min="0" max="100" value={editingMovie?.audienceScore ?? ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, audienceScore: e.target.value === '' ? null : parseInt(e.target.value) } : prev)} /></div>
            <div><label className="admin-label">Rating</label><input className="admin-input" type="number" min="0" max="10" step="0.1" value={editingMovie?.rating ?? ''} onChange={e => setEditingMovie(prev => prev ? { ...prev, rating: e.target.value === '' ? null : parseFloat(e.target.value) } : prev)} /></div>
            <div className="admin-edit-full" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span onClick={() => setEditingMovie(prev => prev ? { ...prev, isHero: !prev.isHero } : prev)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: editingMovie?.isHero ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)', border: editingMovie?.isHero ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.04)', color: editingMovie?.isHero ? '#fbbf24' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
                ★ Hero Card
              </span>
              <span onClick={() => setEditingMovie(prev => prev ? { ...prev, isStaffPick: !prev.isStaffPick, staffPickType: !prev.isStaffPick ? (prev.staffPickType || 'grid') : '' } : prev)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: editingMovie?.isStaffPick ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: editingMovie?.isStaffPick ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.04)', color: editingMovie?.isStaffPick ? '#a5b4fc' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
                ✦ Staff Pick
              </span>
              {editingMovie?.isStaffPick && (
                <select value={editingMovie?.staffPickType || 'grid'} onChange={e => setEditingMovie(prev => prev ? { ...prev, staffPickType: e.target.value } : prev)} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  <option value="grid">Grid</option>
                  <option value="featured">Featured</option>
                </select>
              )}
              <span onClick={() => setEditingMovie(prev => prev ? { ...prev, isUpcoming: !prev.isUpcoming } : prev)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '5px', cursor: 'pointer', background: editingMovie?.isUpcoming ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)', border: editingMovie?.isUpcoming ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.04)', color: editingMovie?.isUpcoming ? '#34d399' : 'rgba(148,163,184,0.35)', transition: 'all 0.15s ease', userSelect: 'none' }}>
                🆕 Upcoming
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={() => { setEditingMovie(null); setEditTmdbQuery(''); setEditTmdbResults([]); setEditPreview(null); }}
            className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>Cancel</button>
          <button onClick={handleSaveEdit} disabled={loading || !editingMovie?.title?.trim()}
            className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Save size={14} /> {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDeleteConfirm}
        title="Delete Movie" message="Delete this movie permanently? This action cannot be undone." confirmLabel="Delete Movie" danger />
    </div>
  );
}

function UsersTab({ users, setUsers, currentUser, showSuccess }) {
  const [loading, setLoading] = useState(false);
  const [confirmUserDelete, setConfirmUserDelete] = useState(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);

  const handleDeleteUser = (username) => {
    setConfirmUserDelete(username);
  };

  const handleDeleteUserConfirm = async () => {
    if (!confirmUserDelete) return;
    setLoading(true);
    try {
      await deleteUserApi(confirmUserDelete);
      setUsers(prev => prev.filter(u => u.username !== confirmUserDelete));
      showSuccess(`User "${confirmUserDelete}" deleted.`);
    } catch (err) { alert(err.message); }
    setLoading(false);
    setConfirmUserDelete(null);
  };

  const handleRoleChange = (username, newRole) => {
    if (username === currentUser.username && newRole !== 'admin') {
      setConfirmRoleChange({ username, newRole });
    } else {
      handleRoleChangeConfirm(username, newRole);
    }
  };

  const handleRoleChangeConfirm = async (username, newRole) => {
    setLoading(true);
    try {
      const updated = await updateUserRole(username, newRole);
      setUsers(prev => prev.map(u => u.username === username ? { ...u, role: updated.role } : u));
      showSuccess(`"${username}" role updated to "${newRole}".`);
    } catch (err) { alert(err.message); }
    setLoading(false);
    setConfirmRoleChange(null);
  };

  return (
    <>
    <div className="admin-panel">
      <div className="admin-panel-header">
        <Users size={18} style={{ color: 'var(--color-accent-gold)' }} />
        <h2>User Management</h2>
        <span className="admin-panel-count">{users.length} total users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={user.avatarUrl} alt={user.username} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.username}</div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user.email || '—'}</td>
                <td>
                  <select className="admin-select" value={user.role || 'user'} onChange={e => handleRoleChange(user.username, e.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleDeleteUser(user.username)} disabled={loading}
                    className="btn-danger" style={{ fontSize: '0.7rem', padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal isOpen={!!confirmUserDelete} onClose={() => setConfirmUserDelete(null)} onConfirm={handleDeleteUserConfirm}
      title="Delete User" message="Delete this user permanently? They will lose all access." confirmLabel="Delete User" danger />

    <ConfirmModal isOpen={!!confirmRoleChange} onClose={() => setConfirmRoleChange(null)}
      onConfirm={() => handleRoleChangeConfirm(confirmRoleChange?.username, confirmRoleChange?.newRole)}
      title="Change Role" message="Remove your own admin role? You may lose access to the admin panel." confirmLabel="Change Role" />
    </>
  );
}


