import { useEffect, useState, useMemo } from 'react';
import { Search, Calendar, Clock, ArrowRight, BookOpen, Sparkles, TrendingUp, Eye } from 'lucide-react';
import { fetchBlogPosts } from '../api';

const CATEGORIES = [
  'All',
  'Movie Analysis',
  'Regional Cinema',
  'Film Criticism',
  'Box Office',
  'OTT Spotlight',
  'Editorial'
];

export default function ArticlesPage({ onNavigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchBlogPosts();
        if (mounted && Array.isArray(data)) {
          setArticles(data);
        }
      } catch (err) {
        console.error('Failed to load articles from API', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Set document SEO tags
  useEffect(() => {
    document.title = 'Cinema Articles, Film Analysis & Critic Guides — ThiraiPedia';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Explore curated cinema essays, box office analyses, regional film deep dives, and expert movie review guides on ThiraiPedia.');
    }

    // JSON-LD structured data for articles list
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'articles-schema-jsonld';
    schemaScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'Cinema Articles & Film Analysis — ThiraiPedia',
      'description': 'Curated essays, technical critiques, and box office breakdowns on Indian and world cinema.',
      'url': 'https://www.cinevistaa.in/articles'
    });
    document.head.appendChild(schemaScript);

    return () => {
      const existing = document.getElementById('articles-schema-jsonld');
      if (existing) existing.remove();
    };
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (article.title && article.title.toLowerCase().includes(q)) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(q)) ||
        (article.tags && article.tags.some(t => t.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const featuredArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    return filteredArticles.find(a => a.featured) || filteredArticles[0];
  }, [filteredArticles]);

  const secondaryArticles = useMemo(() => {
    if (!featuredArticle) return [];
    return filteredArticles.filter(a => a.id !== featuredArticle.id);
  }, [filteredArticles, featuredArticle]);

  return (
    <div className="main-content" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '999px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '0.85rem' }}>
          <Sparkles size={14} style={{ color: 'var(--color-accent-gold)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cinema Insights & Critical Analysis
          </span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
          The Film Journal
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '720px', lineHeight: 1.6 }}>
          Original cinematic essays, regional box office breakdowns, screenplay deconstructions, and in-depth streaming guides crafted for dedicated cinephiles.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Categories */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--color-accent-gold)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#0b0c10' : 'var(--color-text-muted)',
                    border: isActive ? '1px solid var(--color-accent-gold)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '240px', maxWidth: '320px', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search articles or topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
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
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ height: '320px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '260px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)' }} />
            ))}
          </div>
        </div>
      )}

      {/* No articles state */}
      {!loading && filteredArticles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <BookOpen size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--color-text-main)' }}>No articles match your criteria</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Try searching another keyword or reset the category filter.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Featured Lead Card */}
      {!loading && featuredArticle && (
        <div
          onClick={() => onNavigate('article', { articleId: featuredArticle.id })}
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '2.5rem',
            cursor: 'pointer',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95), rgba(12, 15, 22, 0.98))',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            transition: 'transform 0.3s ease, border-color 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', minHeight: '340px' }}>
            {/* Image banner */}
            <div style={{ position: 'relative', minHeight: '260px', overflow: 'hidden' }}>
              <img
                src={featuredArticle.coverImage || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'}
                alt={featuredArticle.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(12, 15, 22, 0.2), rgba(12, 15, 22, 0.85))' }} />
            </div>

            {/* Content pane */}
            <div style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
                <span style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--color-accent-gold)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  {featuredArticle.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {featuredArticle.date}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> {featuredArticle.readTime}
                </span>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '0.85rem', color: 'var(--color-text-main)' }}>
                {featuredArticle.title}
              </h2>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {featuredArticle.excerpt}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  By {featuredArticle.author}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-accent-gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Read Article <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Articles */}
      {!loading && secondaryArticles.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-accent-gold)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
              Latest Dispatches & Analyses
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {secondaryArticles.map(article => (
              <article
                key={article.id}
                onClick={() => onNavigate('article', { articleId: article.id })}
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
                }}
              >
                {/* Cover image if available */}
                {article.coverImage && (
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12, 15, 22, 0.8), transparent 60%)' }} />
                  </div>
                )}

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(212, 175, 55, 0.1)',
                      color: 'var(--color-accent-gold)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{article.date}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>• {article.readTime}</span>
                    {article.views > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={12} /> {article.views}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.6rem', color: 'var(--color-text-main)' }}>
                    {article.title}
                  </h3>

                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.excerpt}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {article.author}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-accent-gold)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      Read <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
