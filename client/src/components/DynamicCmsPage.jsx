import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Film, Users, BookOpen, Sparkles, Mail, Send, Compass } from 'lucide-react';
import { fetchCmsPageBySlug } from '../api';
import { useToast } from '../context/ToastContext.jsx';

export const DEFAULT_CMS_PAGES = {
  about: {
    id: 'page-about',
    slug: 'about',
    title: 'About ThiraiPedia',
    subtitle: 'Devoting the cinematic experience through curated storytelling and critique',
    content: `## Our Mission
ThiraiPedia is built for movie enthusiasts who believe cinema is more than entertainment — it is an art form. We provide a platform for honest, curated reviews, in-depth critique, and community engagement.

## What We Offer
- **Curated Regional Cinema**: From the latest Kollywood and Mollywood blockbusters to hidden indie gems across Tamil, Malayalam, Telugu, and Hindi cinema.
- **Top Critic Leaderboard**: Celebrating the most articulate voices in film critique with community upvotes and reputation scoring.
- **Interactive Cine Hub**: Cine updates, trivia challenges, quiz games, spin wheels, and mood-based movie matchers.
- **Watchlists & Custom Lists**: Build and share your personal movie curation with friends.

## Community Philosophy
We believe film criticism thrives when diverse perspectives meet thoughtful analysis. Whether you are analyzing cinematography, screenplay pacing, or emotional resonance, your voice elevates cinema.

## Powered by TMDB
Movie data and imagery on ThiraiPedia are sourced through The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  privacy: {
    id: 'page-privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'Transparent data practices and privacy guarantees',
    content: `## Information We Collect
When you register for ThiraiPedia, we collect your username, email address, and a securely salted password hash. You may optionally provide an avatar image and critic bio.

## How We Use Your Data
- **Critic Identity**: Display your reviews, ratings, and profile publicly to fellow cinephiles.
- **Security & Account Safety**: Send OTP verification codes for password recovery and account safety.
- **Zero Third-Party Data Selling**: We strictly do not sell, rent, or trade your personal information with external advertisers.

## Reviews & Community Content
Reviews, comments, watchlist items, and custom lists you post are visible across the platform. You retain full control to edit or delete your content at any time.

## Cookies & Storage
We utilize local storage strictly for maintaining your authenticated session token, personal watchlist, and volume/playback preferences. No cross-site tracking cookies are used.

## Account Deletion & Rights
You can request permanent account deletion and data removal at any time by contacting our support team at support@thiraipedia.com.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  terms: {
    id: 'page-terms',
    slug: 'terms',
    title: 'Terms of Service',
    subtitle: 'Platform rules, critique community guidelines, and terms of use',
    content: `## Acceptance of Terms
By accessing or using ThiraiPedia, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may discontinue use of the platform.

## Community Code of Conduct
- **Constructive Critique**: ThiraiPedia encourages passionate film discussions. Personal attacks, hate speech, harassment, and defamatory language are strictly prohibited.
- **Spoiler Warnings**: Always mark major plot twists and endings with clear spoiler warnings in your reviews.
- **Authentic Reviews**: Reviews must reflect genuine personal viewing impressions. Spamming, review bombing, or automated bot postings will result in immediate suspension.

## Intellectual Property
Movie metadata, posters, and backdrops are provided through TMDB. User reviews and written articles remain the intellectual copyright of their respective authors.

## Service Modifications
We continuously improve ThiraiPedia with new cinematic tools, games, and features. We reserve the right to update or modify services to maintain stability and user safety.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  'critic-guidelines': {
    id: 'page-critic-guidelines',
    slug: 'critic-guidelines',
    title: 'Critic Guidelines & Rating Code',
    subtitle: 'Standards for honest, analytical, and constructive film critique',
    content: `## The ThiraiPedia Critic Standard
Film critique at ThiraiPedia is treated with respect and analytical care. We celebrate thoughtful observations over quick reactions.

### 1. Critique the Craft
Go beyond simple plot recaps. Discuss:
- Screenplay structure, narrative stakes, and dialogue rhythm
- Direction, mise-en-scène, and visual pacing
- Cinematography, lighting, color palette, and camera movement
- Sound design, background score, and musical motifs
- Acting performances, subtext, and emotional resonance

### 2. The Rating Scale (1.0 to 10.0)
- **9.0 - 10.0**: Cinematic Masterpiece. Exceptional craft in writing, direction, and technical execution.
- **7.5 - 8.9**: Highly Recommended. Strong cinematic vision with memorable performances and storytelling.
- **6.0 - 7.4**: Good Watch. Entertaining experience with noticeable strengths and minor inconsistencies.
- **4.0 - 5.9**: Mixed / Average. Shows potential in moments but hindered by structural or directorial flaws.
- **1.0 - 3.9**: Disappointing. Weak screenplay, lack of vision, or poor technical execution.

### 3. Spoiler Responsibility
Never ruin major third-act reveals, climax payoffs, or surprise cameos without explicit spoiler warnings.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  newsletter: {
    id: 'page-newsletter',
    slug: 'newsletter',
    title: 'ThiraiPedia Weekly Cine Digest',
    subtitle: 'The best South Indian cinema reviews, box office trends, and OTT releases delivered directly to your inbox',
    content: `## Never Miss a Masterpiece
Join thousands of film enthusiasts who read the **ThiraiPedia Cine Digest** every Friday morning.

### What You Receive Every Week:
- **Weekend Theatrical Guide**: Concise, spoiler-free reviews of every major Tamil, Malayalam, Telugu, and Hindi theatrical release.
- **OTT Streaming Radar**: Exact dates and streaming platforms (Netflix, Prime, Hotstar, Aha, SonyLIV) for newly arriving titles.
- **Director & Cinematography Spotlights**: In-depth analytical essays celebrating cinematic craft.
- **Top Critic Highlights**: Community reviews that sparked discussion on our critique board.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  faq: {
    id: 'page-faq',
    slug: 'faq',
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about navigating and reviewing on ThiraiPedia',
    content: `## General Questions

### What is ThiraiPedia?
ThiraiPedia is a dedicated cinema critique platform and database designed for film lovers, focusing on South Indian cinema (Kollywood, Mollywood, Tollywood) alongside global cinema.

### How does the Critic Leaderboard work?
Every review you write can be upvoted by community members. As your reviews receive appreciation and discussion, your critic reputation score increases, placing you on the leaderboard.

### Where does the movie information come from?
Movie details, posters, cast lists, and trailers are powered by TMDB (The Movie Database).

### Can I track OTT streaming releases?
Yes! Use our OTT Streaming Calendar to track when movies arrive on Netflix, Prime Video, Disney+ Hotstar, Aha, and more.`,
    isPublished: true,
    updatedAt: '2026-05-01T00:00:00.000Z'
  }
};

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
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

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
  const initialPage = DEFAULT_CMS_PAGES[slug] || fallbackData || null;
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(!initialPage);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      if (!initialPage) setLoading(true);
      try {
        const data = await fetchCmsPageBySlug(slug);
        if (isMounted && data && (data.content || data.title)) {
          setPage(data);
        } else if (isMounted && !page) {
          setPage(DEFAULT_CMS_PAGES[slug] || fallbackData || null);
        }
      } catch (err) {
        if (isMounted && !page) {
          setPage(DEFAULT_CMS_PAGES[slug] || fallbackData || null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) {
      // Set default immediately to prevent empty layout or flashing
      if (DEFAULT_CMS_PAGES[slug]) {
        setPage(DEFAULT_CMS_PAGES[slug]);
      }
      loadPage();
    }
    return () => { isMounted = false; };
  }, [slug]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    showToast('Subscribed! Welcome to ThiraiPedia Weekly Cine Digest');
    setNewsletterEmail('');
  };

  if (loading && !page) {
    return (
      <div className="main-content" style={{ padding: '4rem 1.5rem', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading editorial content...</p>
      </div>
    );
  }

  // Graceful discovery fallback when slug is unknown: NEVER show a dead-end "Page Not Found"
  if (!page) {
    return (
      <div className="main-content" style={{ padding: '3.5rem 1.5rem 5rem', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent-gold)',
          marginBottom: '1.25rem'
        }}>
          <Compass size={28} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
          Cinematic Discovery Hub
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
          This editorial section is currently being curated by our team. Explore top-rated releases, critic leaderboards, cinema blogs, or community discussions below.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          <button className="btn-primary" onClick={() => onNavigate('home')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            <Film size={15} /> All Movies
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('leaderboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            <Users size={15} /> Top Critics
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('articles')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            <BookOpen size={15} /> Articles & Blog
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('cine-updates')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            <Sparkles size={15} /> Cine Hub
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('contact')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            <Mail size={15} /> Contact Support
          </button>
        </div>
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
          <span className="cms-badge">Editorial & Guidelines</span>
          {page.updatedAt && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Updated {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
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

      <div className="cms-article-content glass-panel" style={{ padding: '2.5rem', borderRadius: '16px', background: 'var(--color-bg-card)', marginBottom: '2rem' }}>
        {renderMarkdown(page.content)}

        {/* Interactive Newsletter Subscription card if slug is newsletter */}
        {slug === 'newsletter' && (
          <div style={{
            marginTop: '2.5rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(99,102,241,0.06) 100%)',
            border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Mail size={18} style={{ color: 'var(--color-accent-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Subscribe to Weekly Cine Digest
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Receive our curated reviews, OTT streaming calendar alerts, and box-office reports every Friday. Zero spam, unsubscribe at any time.
            </p>

            {subscribed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
                <CheckCircle2 size={18} /> You are subscribed! Check your inbox this Friday.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  style={{
                    flex: '1 1 240px',
                    padding: '0.65rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <Send size={14} /> Subscribe Free
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
