import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Share2, Check, Eye, Tag, Sparkles, BookOpen } from 'lucide-react';
import { fetchBlogPostBySlug } from '../api';
import { useToast } from '../context/ToastContext.jsx';

export default function ArticleDetail({ articleId, onNavigate }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    async function loadArticle() {
      if (!articleId) return;
      setLoading(true);
      try {
        const data = await fetchBlogPostBySlug(articleId);
        if (mounted && data) {
          setArticle(data);
        }
      } catch (err) {
        console.warn('Could not fetch article from API:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArticle();
    return () => { mounted = false; };
  }, [articleId]);

  // Dynamic SEO Meta & JSON-LD injection
  useEffect(() => {
    if (!article) return;

    const originalTitle = document.title;
    document.title = `${article.title} — ThiraiPedia Film Critique`;

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const descText = article.excerpt || article.title;
    if (metaDesc) {
      metaDesc.setAttribute('content', descText);
    }

    // Add JSON-LD BlogPosting schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'article-detail-jsonld';
    schemaScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': article.title,
      'description': descText,
      'image': article.coverImage ? [article.coverImage] : ['https://www.cinevistaa.in/logo192.png'],
      'datePublished': article.publishedAt || new Date().toISOString(),
      'author': {
        '@type': 'Organization',
        'name': article.author || 'ThiraiPedia Editorial'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'ThiraiPedia',
        'url': 'https://www.cinevistaa.in'
      },
      'mainEntityOfPage': `https://www.cinevistaa.in/article/${article.id}`
    });
    document.head.appendChild(schemaScript);

    return () => {
      document.title = originalTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      const existing = document.getElementById('article-detail-jsonld');
      if (existing) existing.remove();
    };
  }, [article]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Article link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast('Share link: ' + url);
    }
  };

  const handleTwitterShare = () => {
    if (!article) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${article.title} — via @ThiraiPedia`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!article) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`*${article.title}*\n\nRead more on ThiraiPedia: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Render markdown-like sections cleanly
  const renderFormattedContent = (content) => {
    if (!content) return null;
    const paragraphs = content.split(/\n\s*\n/);

    return paragraphs.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Heading 2: ##
      if (trimmed.startsWith('## ')) {
        return (
          <h2
            key={idx}
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              margin: '2rem 0 0.85rem',
              letterSpacing: '-0.01em',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '0.45rem'
            }}
          >
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }

      // Heading 3: ###
      if (trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--color-accent-gold)',
              margin: '1.5rem 0 0.65rem'
            }}
          >
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }

      // Blockquote: >
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            style={{
              margin: '1.5rem 0',
              padding: '1rem 1.25rem',
              background: 'rgba(212, 175, 55, 0.06)',
              borderLeft: '4px solid var(--color-accent-gold)',
              borderRadius: '0 8px 8px 0',
              fontStyle: 'italic',
              color: 'var(--color-text-main)',
              lineHeight: 1.7
            }}
          >
            {trimmed.replace(/^>\s+/, '')}
          </blockquote>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').filter(i => i.trim());
        return (
          <ul key={idx} style={{ margin: '1rem 0 1.25rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            {items.map((it, iIdx) => (
              <li key={iIdx} style={{ marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
                {it.replace(/^[-*]\s+/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Format bold text **text** in standard paragraph
      const formattedParts = trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p
          key={idx}
          style={{
            marginBottom: '1.35rem',
            lineHeight: 1.85,
            fontSize: '1.05rem',
            color: 'var(--color-text-muted)'
          }}
        >
          {formattedParts}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="main-content" style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
        <div style={{ height: '36px', width: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '2rem' }} />
        <div style={{ height: '320px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '2rem' }} />
        <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem' }} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="main-content" style={{ maxWidth: '820px', margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
        <BookOpen size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Article Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>The requested article does not exist or may have been archived.</p>
        <button className="btn-secondary" onClick={() => onNavigate('articles')}>
          Return to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '820px', margin: '0 auto', padding: '1.5rem 1rem 5rem' }}>
      {/* Top back & action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => onNavigate('articles')}
        >
          <ArrowLeft size={15} /> All Articles
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleShare}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: copied ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={handleTwitterShare}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            X / Twitter
          </button>
          <button
            onClick={handleWhatsAppShare}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            WhatsApp
          </button>
        </div>
      </div>

      <article>
        {/* Header Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '4px',
            background: 'rgba(212, 175, 55, 0.12)',
            color: 'var(--color-accent-gold)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} /> {article.date}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} /> {article.readTime}
          </span>
          {article.views > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={13} /> {article.views} reads
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.25, marginBottom: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
          {article.title}
        </h1>

        {/* Author / Byline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #996515)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0c10', fontWeight: 700, fontSize: '0.9rem' }}>
            {article.author ? article.author.charAt(0) : 'T'}
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              {article.author}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Film Critic & Editorial Contributor
            </div>
          </div>
        </div>

        {/* Cover image */}
        {article.coverImage && (
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '2.5rem', boxShadow: '0 16px 36px rgba(0,0,0,0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <img
              src={article.coverImage}
              alt={article.title}
              style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Excerpt Lead */}
        {article.excerpt && (
          <div style={{ fontSize: '1.18rem', lineHeight: 1.7, color: 'var(--color-text-main)', fontStyle: 'italic', marginBottom: '2rem', borderLeft: '3px solid var(--color-accent-gold)', paddingLeft: '1.25rem' }}>
            {article.excerpt}
          </div>
        )}

        {/* Body content */}
        <div style={{ margin: '2rem 0' }}>
          {renderFormattedContent(article.content)}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <Tag size={15} style={{ color: 'var(--color-accent-gold)' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Related Cinema Topics
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {article.tags.map(t => (
                <span
                  key={t}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA Card */}
        <div style={{ marginTop: '3.5rem', padding: '2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(0, 0, 0, 0.4))', border: '1px solid rgba(212, 175, 55, 0.2)', textAlign: 'center' }}>
          <Sparkles size={24} style={{ color: 'var(--color-accent-gold)', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
            Enjoyed this analysis?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
            Join ThiraiPedia to log your own reviews, rate your favourite films, and connect with a community of dedicated film critics.
          </p>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('articles')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
          >
            Explore More Articles
          </button>
        </div>
      </article>
    </div>
  );
}
