import { useState, useEffect } from 'react';
import { Sparkles, Trash2, ExternalLink, Search, BookOpen, Eye, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, Film } from 'lucide-react';
import { fetchBlogPosts, generateAutoBlogPostApi, deleteBlogPostApi, fetchMovies } from '../api';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmModal from './ConfirmModal';

export default function BlogsTab({ showSuccess }) {
  const [blogs, setBlogs] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatusText, setGenStatusText] = useState('');
  const [genError, setGenError] = useState('');
  const [latestGenerated, setLatestGenerated] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await fetchBlogPosts();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      showToast('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const loadMovieList = async () => {
    try {
      const data = await fetchMovies();
      const list = Array.isArray(data) ? data : (data?.movies || []);
      setMoviesList(list);
    } catch (e) {
      console.warn('Could not load movie list for blog generator:', e.message);
    }
  };

  useEffect(() => {
    loadBlogs();
    loadMovieList();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    setLatestGenerated(null);
    setGenStatusText('Analyzing movie narrative with OpenAI and formulating SEO analysis...');

    try {
      const movieIdParam = selectedMovieId ? selectedMovieId : null;
      const result = await generateAutoBlogPostApi(movieIdParam);

      if (result.success && result.post) {
        setLatestGenerated(result.post);
        if (showSuccess) showSuccess(`Generated SEO article: "${result.post.title}"`);
        showToast('AI Article successfully generated and published!');
        await loadBlogs();
      } else {
        throw new Error('Server returned unexpected response.');
      }
    } catch (err) {
      console.error('Error auto-generating article:', err);
      const msg = err.message || 'Failed to generate AI article. Please verify server connection.';
      setGenError(msg);
      showToast(msg);
    } finally {
      setGenerating(false);
      setGenStatusText('');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBlogPostApi(deleteId);
      if (showSuccess) showSuccess('Article deleted successfully');
      showToast('Article deleted');
      setBlogs(prev => prev.filter(b => b.id !== deleteId));
    } catch (err) {
      showToast(err.message || 'Failed to delete article');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredBlogs = blogs.filter(b => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (b.title && b.title.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Generator Control Card */}
      <div style={{
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(20, 24, 33, 0.75))',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-accent-gold)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              <Sparkles size={18} /> Automated SEO & AI Cinema Journal
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '680px' }}>
              Generates an in-depth 600-800 word critical essay, box office impact review, and streaming guide. All published articles automatically sync to <code>/sitemap.xml</code> and inject schema.org <code>BlogPosting</code> JSON-LD for rapid Google search indexing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Movie selection */}
            <div style={{ position: 'relative' }}>
              <select
                value={selectedMovieId}
                onChange={e => setSelectedMovieId(e.target.value)}
                disabled={generating}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '240px'
                }}
              >
                <option value="">Any Unreviewed Movie (Auto AI)</option>
                {moviesList.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.releaseYear || 'Movie'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.35rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {generating ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              {generating ? 'Generating AI Article...' : 'Generate AI Article'}
            </button>
          </div>
        </div>

        {/* Live Progress Info */}
        {generating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--color-accent-gold)', fontSize: '0.85rem' }}>
            <RefreshCw size={15} className="spin" />
            <span>{genStatusText || 'Generating article... This may take 10-20 seconds.'}</span>
          </div>
        )}

        {/* Error Alert */}
        {genError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{genError}</span>
          </div>
        )}

        {/* Success Alert with Link */}
        {latestGenerated && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', color: '#22c55e', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>Published: <strong>{latestGenerated.title}</strong></span>
            </div>
            <a
              href={`/article/${latestGenerated.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#22c55e', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Open Article <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
            Published Articles ({blogs.length})
          </h2>
          <button
            onClick={loadBlogs}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--color-text-main)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Articles Table */}
      {loading && blogs.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading articles...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
          <BookOpen size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>No articles found</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
            Generate First AI Article
          </button>
        </div>
      ) : (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Article</th>
                <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Stats</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  {/* Article info */}
                  <td style={{ padding: '1rem', maxWidth: '380px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '40px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={16} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem' }}>
                          {post.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      background: 'rgba(212, 175, 55, 0.1)',
                      color: 'var(--color-accent-gold)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {post.category || 'Analysis'}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {post.date}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                      <Clock size={12} /> {post.readTime || '5 min read'}
                    </div>
                  </td>

                  {/* Stats */}
                  <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Eye size={13} /> {post.views || 0} views
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <a
                        href={`/article/${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> View
                      </a>
                      <button
                        onClick={() => setDeleteId(post.id)}
                        className="btn-danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <ConfirmModal
          isOpen={Boolean(deleteId)}
          title="Delete Article"
          message="Are you sure you want to delete this article? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
