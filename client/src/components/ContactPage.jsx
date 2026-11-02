export default function ContactPage({ onNavigate }) {
  return (
    <div className="legal-page">
      <div className="legal-page-header">
        <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }} onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
        <h1 className="legal-page-title">Contact Support</h1>
        <p className="legal-page-updated">We'd love to hear from you.</p>
      </div>
      <div className="legal-page-content">
        <div className="contact-card">
          <div className="contact-card-icon">✉️</div>
          <div>
            <h3>Email</h3>
            <a href="mailto:support@thiraipedia.com">support@thiraipedia.com</a>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon">💬</div>
          <div>
            <h3>Community Forum</h3>
            <button className="btn-link" onClick={() => onNavigate('community')}>Post in the Community Forum →</button>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon">🕐</div>
          <div>
            <h3>Response Time</h3>
            <p>We typically reply within 24 hours.</p>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon">📱</div>
          <div>
            <h3>Social</h3>
            <div className="contact-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
