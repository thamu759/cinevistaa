import { useState, useRef, useEffect } from 'react';
import { Share2, Link, Check, X, Globe, MessageCircle, Image as ImageIcon, Smartphone } from 'lucide-react';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

export default function ShareButton({ title, text, url, variant = 'icon', label, movie }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [format, setFormat] = useState('card');
  const menuRef = useRef(null);
  const cardRef = useRef(null);
  const storyRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const fullUrl = url || window.location.href;
  const shareText = text || `Check out ${title} on thiraipedia`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: shareText, url: fullUrl }); return true; } catch {}
    }
    return false;
  };

  const captureCard = async (ref, suffix) => {
    if (!movie || !ref.current) return false;
    setCapturing(true);
    try {
      const node = ref.current;
      const canvas = await html2canvas(node, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#0f0f1a',
        logging: false,
      });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) return false;
      const file = new File([blob], `${movie.title || 'movie'}-thiraipedia${suffix}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: movie.title, text: shareText });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
      return true;
    } catch {
      return false;
    } finally {
      setCapturing(false);
    }
  };

  const handleShare = async (fmt) => {
    if (capturing) return;
    const ref = fmt === 'story' ? storyRef : cardRef;
    if (await captureCard(ref, fmt === 'story' ? '-story' : '')) return;
    if (await handleNativeShare()) return;
    setFormat(fmt);
    setShowMenu(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShowMenu(false); }, 1500);
    } catch {}
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,width=600,height=400');
    setShowMenu(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,width=600,height=400');
    setShowMenu(false);
  };

  const btnStyle = variant === 'text'
    ? { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }
    : { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer' };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button onClick={() => handleShare('card')} style={{ ...btnStyle, border: format === 'card' ? '1px solid var(--color-accent-gold)' : undefined }} aria-label="Share as card" title="Share as Letterboxd-style card" disabled={capturing}>
          {capturing && format === 'card' ? <ImageIcon size={16} style={{ animation: 'spin 1s linear infinite' }} /> : copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <ImageIcon size={16} />}
        </button>
        <button onClick={() => handleShare('story')} style={{ ...btnStyle, border: format === 'story' ? '1px solid var(--color-accent-gold)' : undefined }} aria-label="Share as story" title="Share as story (9:16)" disabled={capturing}>
          {capturing && format === 'story' ? <ImageIcon size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Smartphone size={16} />}
        </button>
      </div>

      {showMenu && (
        <div ref={menuRef} style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.5rem',
          background: '#1a1d23', border: '1px solid var(--color-border)',
          borderRadius: '12px', padding: '0.5rem', minWidth: '180px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Share</span>
            <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>

          <button onClick={copyLink} style={shareBtnStyle}>
            {copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <Link size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={shareTwitter} style={shareBtnStyle}>
            <MessageCircle size={16} />
            Twitter
          </button>
          <button onClick={shareFacebook} style={shareBtnStyle}>
            <Globe size={16} />
            Facebook
          </button>
        </div>
      )}

      {movie && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', opacity: 0 }}>
          <ShareCard movie={movie} cardRef={cardRef} variant="card" />
          <ShareCard movie={movie} cardRef={storyRef} variant="story" />
        </div>
      )}
    </div>
  );
}

const shareBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
  padding: '0.5rem 0.75rem', background: 'none', border: 'none',
  borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer',
  fontSize: '0.85rem', textAlign: 'left',
};
