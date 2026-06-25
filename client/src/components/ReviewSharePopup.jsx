import { useState, useRef } from 'react';
import { Share2, X, Download, Check, MessageCircle, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

export default function ReviewSharePopup({ movie, reviewData, onClose }) {
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const cardRef = useRef(null);
  const captureRef = useRef(null);

  const shareText = `I rated ${movie?.title} ${reviewData?.rating}/10 on ThiraiPedia!`;
  const fullUrl = window.location.href;

  const downloadCard = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
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
      padding: '0.75rem',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1d23, #0f0f1a)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: '16px', padding: '1.25rem',
        maxWidth: '400px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Share2 size={16} style={{ color: 'var(--color-accent-gold)' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Share Your Review</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
          Your rating has been posted! Share it with friends.
        </p>

        <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', transform: 'scale(0.6)', transformOrigin: 'top center', height: '260px' }}>
          <ShareCard movie={movie} cardRef={cardRef} />
        </div>

        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 600, height: 800 }}>
          <ShareCard movie={movie} cardRef={captureRef} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={downloadCard} disabled={capturing} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.3)',
            background: 'rgba(251,191,36,0.1)', color: 'var(--color-accent-gold)',
            fontWeight: 600, fontSize: '0.85rem', cursor: capturing ? 'not-allowed' : 'pointer',
          }}>
            {capturing ? <ImageIcon size={14} style={{ animation: 'spin 1s linear infinite' }} /> : downloaded ? <Check size={14} /> : <Download size={14} />}
            {capturing ? 'Generating...' : downloaded ? 'Downloaded!' : 'Download Card'}
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={shareWhatsApp} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              padding: '0.6rem', borderRadius: '8px', border: 'none',
              background: '#25D366', color: '#fff', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer',
            }}>
              <MessageCircle size={14} />
              WhatsApp
            </button>
            <button onClick={shareTwitter} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              padding: '0.6rem', borderRadius: '8px', border: 'none',
              background: '#1DA1F2', color: '#fff', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer',
            }}>
              <Share2 size={14} />
              X
            </button>
            <button onClick={copyLink} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 500, fontSize: '0.8rem',
              cursor: 'pointer',
            }}>
              {copied ? <Check size={14} style={{ color: '#22c55e' }} /> : <Share2 size={14} />}
              {copied ? 'Copied!' : 'Link'}
            </button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', textAlign: 'center', marginTop: '0.15rem' }}>
            thiraipedia — Premium Film Critique
          </p>
        </div>
      </div>
    </div>
  );
}
