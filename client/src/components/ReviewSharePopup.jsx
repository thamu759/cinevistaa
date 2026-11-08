import { useState, useRef } from 'react';
import { Share2, X, Download, Check, MessageCircle, Send, Copy } from 'lucide-react';
import ShareCard from './ShareCard';
import { captureElementToBlob } from '../utils/cardCapture';

export default function ReviewSharePopup({ movie, reviewData, onClose }) {
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const cardRef = useRef(null);
  const captureRef = useRef(null);

  const shareText = `I rated ${movie?.title || 'this movie'} ${reviewData?.rating ? `${reviewData.rating}/10` : 'on ThiraiPedia'}!`;
  const fullUrl = window.location.href;

  const downloadCard = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const blob = await captureElementToBlob(captureRef.current);
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `${(movie?.title || 'movie').toLowerCase().replace(/\s+/g, '-')}-review-thiraipedia.png`;
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setCapturing(false);
    }
  };

  const shareNativeImage = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const blob = await captureElementToBlob(captureRef.current);
      if (!blob) return;
      const fileName = `${(movie?.title || 'movie').toLowerCase().replace(/\s+/g, '-')}-review.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: movie?.title || 'Movie Review',
          text: shareText,
        });
      } else {
        await downloadCard();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Share image failed:', e);
      }
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

  const canShareFile = typeof navigator !== 'undefined' && !!navigator.canShare;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 5, 10, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #121520 0%, #0a0d14 100%)',
          border: '1px solid rgba(251, 191, 36, 0.28)',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
              }}
            >
              <Share2 size={15} />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
              Share Your Verdict
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', margin: '0 0 1rem' }}>
          Your critique has been recorded. Share your custom cinema pass!
        </p>

        {/* Live Card Preview Box */}
        <div
          style={{
            width: '100%',
            height: '380px',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            background: '#07090e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: 'scale(0.44)',
              transformOrigin: 'center center',
              width: 580,
              height: 840,
              flexShrink: 0,
              pointerEvents: 'none',
            }}
          >
            <ShareCard movie={movie} reviewData={reviewData} cardRef={cardRef} />
          </div>
        </div>

        {/* Hidden full-scale card for high-dpi capture */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 580, height: 840, pointerEvents: 'none', zIndex: -1 }}>
          <ShareCard movie={movie} reviewData={reviewData} cardRef={captureRef} />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Primary Action: Share File if supported, otherwise Download */}
          <button
            onClick={canShareFile ? shareNativeImage : downloadCard}
            disabled={capturing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: capturing ? 'not-allowed' : 'pointer',
              transition: 'transform 0.15s, background 0.15s',
            }}
          >
            {capturing ? (
              <>Generating Pass...</>
            ) : downloaded ? (
              <>
                <Check size={16} /> Saved to Gallery!
              </>
            ) : canShareFile ? (
              <>
                <Send size={16} /> Share Image to Story / Apps
              </>
            ) : (
              <>
                <Download size={16} /> Download Cinema Pass (PNG)
              </>
            )}
          </button>

          {/* Secondary Quick Share Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={shareWhatsApp}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.65rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#25D366',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={15} />
              WhatsApp
            </button>

            <button
              onClick={shareTwitter}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.65rem 0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: '#0f141c',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Share2 size={15} />
              X / Twitter
            </button>

            <button
              onClick={copyLink}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.65rem 0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={15} style={{ color: '#22c55e' }} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Link'}
            </button>
          </div>

          {/* Tertiary download button when native share was primary */}
          {canShareFile && (
            <button
              onClick={downloadCard}
              disabled={capturing}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.35rem',
                cursor: 'pointer',
                marginTop: '0.2rem',
              }}
            >
              <Download size={13} /> Or download PNG file
            </button>
          )}

          <p style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.68rem', textAlign: 'center', margin: '0.25rem 0 0' }}>
            ThiraiPedia &bull; High-Fidelity 2x Cinema Export
          </p>
        </div>
      </div>
    </div>
  );
}
