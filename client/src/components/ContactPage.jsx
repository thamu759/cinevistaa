import { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Clock, Globe, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export default function ContactPage({ onNavigate }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast('Message sent! Support team will respond within 24 hours.');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 600);
  };

  return (
    <div className="legal-page" style={{ maxWidth: '840px', margin: '2rem auto 5rem', padding: '0 1.25rem' }}>
      <div className="legal-page-header">
        <button
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft size={14} /> Back to Movies
        </button>
        <h1 className="legal-page-title" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800 }}>
          Contact Support & Editorial Team
        </h1>
        <p className="legal-page-updated" style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
          Have feedback, movie additions, critic inquiries, or technical questions? We are here to help.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="contact-card">
          <div className="contact-card-icon" style={{ color: 'var(--color-accent-gold)' }}>
            <Mail size={22} />
          </div>
          <div>
            <h3>Direct Email</h3>
            <a href="mailto:support@thiraipedia.com">support@thiraipedia.com</a>
            <p style={{ marginTop: '0.2rem' }}>For editorial, critic verification & partnership queries</p>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon" style={{ color: '#60a5fa' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h3>Community Discussions</h3>
            <button className="btn-link" onClick={() => onNavigate('community')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              Join the Community Forum &rarr;
            </button>
            <p style={{ marginTop: '0.2rem' }}>Discuss cinema and chat with fellow critics</p>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon" style={{ color: '#34d399' }}>
            <Clock size={22} />
          </div>
          <div>
            <h3>Response Turnaround</h3>
            <p style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>Within 24 Hours</p>
            <p style={{ marginTop: '0.2rem' }}>Our team reviews submissions 7 days a week</p>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon" style={{ color: '#f472b6' }}>
            <Globe size={22} />
          </div>
          <div>
            <h3>Official Channels</h3>
            <div className="contact-socials" style={{ marginTop: '0.3rem' }}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Contact Form */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', background: 'var(--color-bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--color-accent-gold)' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
            Send Us a Message
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Leave your details and message below. A support team member will follow up by email.
        </p>

        {submitted ? (
          <div style={{ padding: '1.5rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', textAlign: 'center' }}>
            <CheckCircle2 size={32} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#34d399', margin: '0 0 0.4rem' }}>Message Received Successfully</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
              Thank you for reaching out. We have queued your message and will email you back shortly.
            </p>
            <button className="btn-secondary" onClick={() => setSubmitted(false)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem' }}>Your Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem' }}>Your Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. anand@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem' }}>Topic / Category</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Movie Correction / Suggestion">Movie Correction / Suggestion</option>
                <option value="Critic Verification">Critic Verification</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Partnership / Press">Partnership / Press</option>
              </select>
            </div>

            <div>
              <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem' }}>Message *</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your message here..."
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}
              >
                <Send size={15} />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
