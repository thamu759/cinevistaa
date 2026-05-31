export default function AboutPage({ onNavigate }) {
  return (
    <div className="legal-page">
      <div className="legal-page-header">
        <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }} onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
        <h1 className="legal-page-title">About ThiraiPedia</h1>
        <p className="legal-page-updated">Devoting the cinematic experience</p>
      </div>
      <div className="legal-page-content">
        <div className="legal-section">
          <h2 className="legal-section-heading">Our Mission</h2>
          <p className="legal-section-text">ThiraiPedia is built for movie enthusiasts who believe cinema is more than entertainment — it's an art form. We provide a platform for honest, curated reviews and thoughtful critique.</p>
        </div>
        <div className="legal-section">
          <h2 className="legal-section-heading">What We Offer</h2>
          <p className="legal-section-text">From the latest blockbusters to regional cinema in Tamil and Malayalam, our community rates and reviews films across languages and genres. Track your watchlist, follow critics, and discover your next favourite film.</p>
        </div>
        <div className="legal-section">
          <h2 className="legal-section-heading">Our Community</h2>
          <p className="legal-section-text">We believe the best film criticism comes from passionate audiences. Whether you're a casual viewer or a dedicated cinephile, your voice matters here. Join thousands of critics who share their perspectives every day.</p>
        </div>
        <div className="legal-section">
          <h2 className="legal-section-heading">Powered by TMDB</h2>
          <p className="legal-section-text">Movie data and images on ThiraiPedia are provided by The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
      </div>
    </div>
  );
}
