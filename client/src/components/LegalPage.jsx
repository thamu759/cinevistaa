export default function LegalPage({ page, onNavigate }) {
  const pages = {
    privacy: {
      title: 'Privacy Policy',
      updated: 'May 2026',
      sections: [
        { heading: 'Information We Collect', text: 'When you create an account on ThiraiPedia, we collect your username, email address, and a hashed password. You may optionally provide an avatar URL and bio.' },
        { heading: 'How We Use Your Data', text: 'Your information is used to identify you as a critic, display your reviews and profile publicly, and allow other users to engage with your content. We do not sell or share your personal data with third parties.' },
        { heading: 'Reviews & Ratings', text: 'Reviews, ratings, and lists you create are visible to all users. You may delete your own reviews at any time.' },
        { heading: 'Cookies', text: 'We use localStorage to store your login token, watchlist, and autoplay preference. No cookies are served from third-party domains.' },
        { heading: 'Data Retention', text: 'Your data is retained until you request account deletion. Contact us at support@thiraipedia.com to delete your account.' },
        { heading: 'TMDB Attribution', text: 'Movie poster and backdrop images are sourced from TMDB. TMDB does not endorse this application.' },
      ]
    },
    terms: {
      title: 'Terms of Service',
      updated: 'May 2026',
      sections: [
        { heading: 'Acceptance', text: 'By using ThiraiPedia, you agree to these terms. If you do not agree, do not use the service.' },
        { heading: 'User Accounts', text: 'You are responsible for maintaining the confidentiality of your login credentials. You must be at least 13 years old to create an account.' },
        { heading: 'Content Guidelines', text: 'Reviews and forum posts must not contain hate speech, harassment, or illegal content. We reserve the right to remove content and ban users who violate this policy.' },
        { heading: 'Intellectual Property', text: 'Movie data and images are provided by TMDB under their terms. User-generated content remains the property of its author.' },
        { heading: 'Service Availability', text: 'We strive to keep the service running but do not guarantee uninterrupted availability. We may modify or discontinue features at any time.' },
        { heading: 'Limitation of Liability', text: 'ThiraiPedia is provided "as is" without warranties. We are not liable for damages arising from use of the service.' },
      ]
    }
  };

  const data = pages[page];
  if (!data) return null;

  return (
    <div className="legal-page">
      <div className="legal-page-header">
        <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }} onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
        <h1 className="legal-page-title">{data.title}</h1>
        <p className="legal-page-updated">Last updated: {data.updated}</p>
      </div>
      <div className="legal-page-content">
        {data.sections.map((s, i) => (
          <div key={i} className="legal-section">
            <h2 className="legal-section-heading">{s.heading}</h2>
            <p className="legal-section-text">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
