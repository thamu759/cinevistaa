import { useToast } from '../context/ToastContext.jsx';
import brandLogo from '../assets/Thiraipedia White Logo with Yellow.png';

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

export default function Footer({ onNavigate, onLoadLeaderboard, onLoadLists, siteSettings, cmsPages = [] }) {
  const { showToast } = useToast();

  const footerSettings = siteSettings?.footer || {};
  const customFooterPages = (cmsPages || []).filter(p => p.showInFooter && p.isPublished !== false);

  return (
    <footer className="footer-container">
      <div className="footer">
        <div className="footer-brand">
          <div className="footer-logo-wrap" onClick={() => onNavigate('home')} style={{ cursor: 'pointer', display: 'inline-block' }}>
            <img src={brandLogo} alt="ThiraiPedia" className="brand-logo-img brand-logo-img--footer" />
          </div>
          <p className="footer-brand-desc">
            {footerSettings.tagline || 'Devoting the cinematic experience through curated storytelling and premium critique. Formulating reviews for true enthusiasts.'}
          </p>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Explore</span>
          <ul className="footer-links">
            <li><a href="/" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>All Movies</a></li>
            <li><a href="/leaderboard" onClick={(e) => { e.preventDefault(); if (typeof onLoadLeaderboard === 'function') onLoadLeaderboard(); onNavigate('leaderboard'); }}>Top Critics</a></li>
            <li><a href="/lists" onClick={(e) => { e.preventDefault(); if (typeof onLoadLists === 'function') onLoadLists(); onNavigate('lists'); }}>Lists</a></li>
            <li><a href="/profile" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>Critic Board</a></li>
            <li><a href="/community" onClick={(e) => { e.preventDefault(); onNavigate('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Community Forum</a></li>
            <li><a href="/articles" onClick={(e) => { e.preventDefault(); onNavigate('articles'); }}>Articles & Critique</a></li>
            <li><a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('articles'); }}>Cinema Blog</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Legal & Guidelines</span>
          <ul className="footer-links">
            <li><a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a></li>
            <li><a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Terms of Service</a></li>
            <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>About Us</a></li>
            <li><a href="/page/critic-guidelines" onClick={(e) => { e.preventDefault(); onNavigate('cms-page', { pageSlug: 'critic-guidelines' }); }}>Critic Guidelines</a></li>
            {/* Custom CMS pages mapped in footer */}
            {customFooterPages
              .filter(p => !['about', 'privacy', 'terms', 'contact', 'critic-guidelines', 'newsletter', 'faq'].includes(p.slug))
              .map(p => (
                <li key={p.slug}>
                  <a href={`/page/${p.slug}`} onClick={(e) => { e.preventDefault(); onNavigate('cms-page', { pageSlug: p.slug }); }}>
                    {p.title}
                  </a>
                </li>
              ))}
          </ul>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Connect</span>
          <ul className="footer-links">
            <li><a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}>Contact Support</a></li>
            <li><a href="/newsletter" onClick={(e) => { e.preventDefault(); onNavigate('newsletter'); }}>Weekly Cine Newsletter</a></li>
            <li><a href="/community" onClick={(e) => { e.preventDefault(); onNavigate('community'); }}>Discussions & Feedback</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="footer-app-badges">
            <button className="app-store-badge" onClick={() => showToast('ThiraiPedia iOS App is currently in TestFlight beta. Stay tuned!')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span>App Store</span>
            </button>
            <button className="app-store-badge" onClick={() => showToast('ThiraiPedia Android APK early access launching soon!')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 20.5v-17a.5.5 0 0 1 .74-.44l15.53 8.5a.5.5 0 0 1 0 .88l-15.53 8.5A.5.5 0 0 1 3 20.5z"/></svg>
              <span>Google Play</span>
            </button>
          </div>
          <span>&copy; {new Date().getFullYear()} {footerSettings.copyright || 'ThiraiPedia. All rights reserved.'}</span>
          <div className="footer-tmdb-attribution">
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
              alt="TMDB" style={{ height: '14px', width: 'auto', opacity: 0.6 }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.7, lineHeight: 1.4 }}>
              This product uses the TMDB API but is not endorsed or certified by{' '}
              <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-gold)' }}>The Movie Database (TMDB)</a>.
            </span>
          </div>
        </div>
        <div className="footer-socials">
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>Follow us</span>
          <a href={footerSettings.facebookUrl || "https://facebook.com"} target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Facebook"><FacebookIcon /></a>
          <a href={footerSettings.instagramUrl || "https://instagram.com"} target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Instagram"><InstagramIcon /></a>
          <a href={footerSettings.twitterUrl || "https://x.com"} target="_blank" rel="noopener noreferrer" className="footer-social-link" title="X (Twitter)"><TwitterIcon /></a>
          <a href={footerSettings.youtubeUrl || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="footer-social-link" title="YouTube"><YoutubeIcon /></a>
        </div>
      </div>
    </footer>
  );
}
