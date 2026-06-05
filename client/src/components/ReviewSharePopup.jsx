import { useState, useRef } from 'react';
import { Share2, X, Download, Check, MessageCircle, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

export default function ReviewSharePopup({ movie, reviewData, onClose }) {
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const cardRef = useRef(null);

  const shareText = `I rated ${movie?.title} ${reviewData?.rating}/10 on ThiraiPedia!`;
  const fullUrl = window.location.href;

  const downloadCard = async () => {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#0f0f1a',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${movie?.title || 'movie'}-review-thiraipedia.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setCapturing(false);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1d23, #0f0f1a)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: '20px', padding: '2rem',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={18} style={{ color: 'var(--color-accent-gold)' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Share Your Review</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          Your rating has been posted! Share it with friends.
        </p>

        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <ShareCard movie={movie} cardRef={cardRef} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button onClick={downloadCard} disabled={capturing} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.3)',
            background: 'rgba(251,191,36,0.1)', color: 'var(--color-accent-gold)',
            fontWeight: 600, fontSize: '0.9rem', cursor: capturing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {capturing ? <ImageIcon size={16} style={{ animation: 'spin 1s linear infinite' }} /> : downloaded ? <Check size={16} /> : <Download size={16} />}
            {capturing ? 'Generating...' : downloaded ? 'Downloaded!' : 'Download Card Image'}
          </button>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={shareWhatsApp} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem', borderRadius: '10px', border: 'none',
              background: '#25D366', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
            }}>
              <MessageCircle size={16} />
              WhatsApp
            </button>
            <button onClick={shareTwitter} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem', borderRadius: '10px', border: 'none',
              background: '#1DA1F2', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
            }}>
              <Share2 size={16} />
              Twitter
            </button>
            <button onClick={copyLink} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 500, fontSize: '0.85rem',
              cursor: 'pointer',
            }}>
              {copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <Share2 size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', textAlign: 'center', marginTop: '0.25rem' }}>
            thiraipedia — Premium Film Critique
          </p>
        </div>
      </div>
    </div>
  );
}
