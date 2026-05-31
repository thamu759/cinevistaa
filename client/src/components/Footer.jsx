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

export default function Footer({ onNavigate, onLoadLeaderboard, onLoadLists, onShowLegal }) {
  return (
    <footer className="footer-container">
      <div className="footer">
        <div className="footer-brand">
          <h3 className="footer-brand-title">Thirai<span>Pedia</span></h3>
          <p className="footer-brand-desc">
            Devoting the cinematic experience through curated storytelling and premium critique. Formulating reviews for true enthusiasts.
          </p>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Explore</span>
          <ul className="footer-links">
            <li><a href="/" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>All Movies</a></li>
            <li><a href="/leaderboard" onClick={(e) => { e.preventDefault(); onLoadLeaderboard(); onNavigate('leaderboard'); }}>Top Critics</a></li>
            <li><a href="/lists" onClick={(e) => { e.preventDefault(); onLoadLists(); onNavigate('lists'); }}>Lists</a></li>
            <li><a href="/profile" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>Critic Board</a></li>
            <li><a href="/community" onClick={(e) => { e.preventDefault(); onNavigate('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Community Forum</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Legal</span>
          <ul className="footer-links">
            <li><a href="#" onClick={(e) => { e.preventDefault(); onShowLegal('privacy'); }}>Privacy Policy</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onShowLegal('terms'); }}>Terms of Service</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onShowLegal('cookie'); }}>Cookie Policy</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <span className="footer-column-title">Connect</span>
          <ul className="footer-links">
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Newsletter signed!"); }}>Newsletter</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Contact support at help@thiraipedia.com"); }}>Contact Support</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>&copy; {new Date().getFullYear()} thiraipedia. All rights reserved.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link"><FacebookIcon /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link"><InstagramIcon /></a>
        </div>
      </div>
    </footer>
  );
}
