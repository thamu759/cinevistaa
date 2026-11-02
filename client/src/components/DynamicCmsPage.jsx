import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { fetchCmsPageBySlug } from '../api';

export function renderMarkdown(content = '') {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="cms-rendered-list">
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInline = (text) => {
    // Bold: **text**
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    // Replace bold and links
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={`b-${keyIdx++}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          parts.push(
            <a key={`a-${keyIdx++}`} href={linkMatch[2]} target={linkMatch[2].startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="cms-link">
              {linkMatch[1]}
            </a>
          );
        }
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(index);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(<h3 key={index} className="cms-h3">{parseInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(<h2 key={index} className="cms-h2">{parseInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(<h1 key={index} className="cms-h1">{parseInline(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2));
    } else if (trimmed.startsWith('> ')) {
      flushList(index);
      elements.push(<blockquote key={index} className="cms-quote">{parseInline(trimmed.slice(2))}</blockquote>);
    } else {
      flushList(index);
      elements.push(<p key={index} className="cms-p">{parseInline(trimmed)}</p>);
    }
  });

  flushList('final');
  return elements;
}

export default function DynamicCmsPage({ slug, onNavigate, fallbackData = null }) {
  const [page, setPage] = useState(fallbackData);
  const [loading, setLoading] = useState(!fallbackData);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCmsPageBySlug(slug);
        if (isMounted && data) {
          setPage(data);
        }
      } catch (err) {
        if (isMounted) {
          if (fallbackData) {
            setPage(fallbackData);
          } else {
            setError(err.message || 'Page not found');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) loadPage();
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading page content...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>The requested page could not be found or has not been published yet.</p>
        <button className="btn-primary" onClick={() => onNavigate('home')}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ padding: '2.5rem 1.5rem 5rem', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft size={14} /> Back to Movies
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span className="cms-badge">CMS Managed</span>
          {page.updatedAt && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--color-text-main)' }}>
          {page.title}
        </h1>
        {page.subtitle && (
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            {page.subtitle}
          </p>
        )}
      </div>

      <div className="cms-article-content glass-panel" style={{ padding: '2.5rem', borderRadius: '16px', background: 'var(--color-bg-card)' }}>
        {renderMarkdown(page.content)}
      </div>
    </div>
  );
}

