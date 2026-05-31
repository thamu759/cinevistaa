import { Globe, Share2 } from 'lucide-react';

export default function Footer({ onNavigate, onLoadLeaderboard, onLoadLists }) {
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
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy Details"); }}>Privacy Policy</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Terms and Conditions"); }}>Terms of Service</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Cookie Policy"); }}>Cookie Policy</a></li>
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
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.7, lineHeight: 1.4 }}>
            This product uses the TMDB API but is not endorsed or certified by{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-gold)' }}>The Movie Database (TMDB)</a>.
          </span>
        </div>
        <div className="footer-socials">
          <a href="#" className="footer-social-link"><Globe size={16} /></a>
          <a href="#" className="footer-social-link"><Share2 size={16} /></a>
        </div>
      </div>
    </footer>
  );
}
