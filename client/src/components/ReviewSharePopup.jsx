import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Download, Check, MessageCircle, Send, Copy, Globe, Eye } from 'lucide-react';
import ShareCard from './ShareCard';
import { captureElementToBlob } from '../utils/cardCapture';
import { proxyImageUrl } from '../api';

export default function ReviewSharePopup({ movie, reviewData, title, text, url, onClose }) {
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef(null);
  const captureRef = useRef(null);

  const movieTitle = movie?.title || title || 'this film';
  const releaseYear = movie?.releaseDate
    ? movie.releaseDate.split('-')[0] || movie.releaseYear
    : movie?.releaseYear || '';
  const director = movie?.director || '';
  const posterSrc = movie?.posterUrl ? proxyImageUrl(movie.posterUrl, 'w200') : '';
  const rating = reviewData?.rating ?? (movie?.criticScore || movie?.rating || null);
  const displayScore = rating != null
    ? (typeof rating === 'number' ? rating.toFixed(rating % 1 === 0 ? 0 : 1) : rating)
    : null;

  const shareText = text || (reviewData?.rating
    ? `I rated ${movieTitle} ${reviewData.rating}/10 on ThiraiPedia!`
    : `Check out ${movieTitle} on ThiraiPedia!`);
  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://thiraipedia.com');

  const downloadCard = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const blob = await captureElementToBlob(captureRef.current);
      if (!blob) return;
      const cleanSlug = (movie?.title || title || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const link = document.createElement('a');
      link.download = `${cleanSlug}-thiraipedia.png`;
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.click();
      URL.revokeObjectURL(blobUrl);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error('Download card failed:', e);
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
      const cleanSlug = (movie?.title || title || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `${cleanSlug}-thiraipedia.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: movieTitle,
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

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const canShareFile = typeof navigator !== 'undefined' && !!navigator.canShare;
  const headerTitle = reviewData ? 'Share Your Review' : (movie ? 'Share Film Card' : 'Share');

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(3, 5, 10, 0.82)',
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
          background: '#0d0f17',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9)',
          fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Share2 size={15} style={{ color: '#fbbf24' }} />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
              {headerTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Clean Movie Identity Snippet */}
        {movie && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.65rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '10px',
              marginBottom: '0.85rem',
            }}
          >
            {posterSrc ? (
              <img
                src={posterSrc}
                alt={movieTitle}
                crossOrigin="anonymous"
                style={{
                  width: '42px',
                  height: '62px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            ) : null}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {movieTitle}
              </h4>

              {(releaseYear || director) && (
                <div
                  style={{
                    color: '#8e95a5',
                    fontSize: '0.76rem',
                    marginTop: '0.2rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {[releaseYear, director ? `Directed by ${director}` : null].filter(Boolean).join(' · ')}
                </div>
              )}

              {displayScore && (
                <div style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  ★ {displayScore} <span style={{ color: '#64748b', fontWeight: 400 }}>/ 10</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Visual Card Preview Toggle */}
        {movie && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8e95a5',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              padding: '0.2rem',
              margin: '-0.35rem auto 0.75rem',
            }}
          >
            <Eye size={13} /> {showPreview ? 'Hide Card Preview' : 'Preview Cinema Card'}
          </button>
        )}

        {/* Visual Card (Rendered edge-to-edge when preview is active) */}
        {movie && showPreview && (
          <div
            style={{
              width: 210,
              height: 310,
              margin: '0 auto 1rem',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 420,
                height: 620,
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}
            >
              <ShareCard movie={movie} reviewData={reviewData} cardRef={cardRef} />
            </div>
          </div>
        )}

        {/* Hidden full-scale card for high-dpi capture */}
        {movie && (
          <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 420, height: 620, pointerEvents: 'none', zIndex: -1 }}>
            <ShareCard movie={movie} reviewData={reviewData} cardRef={captureRef} />
          </div>
        )}

        {/* Primary CTA: Download PNG or Share Image */}
        {movie && (
          <button
            onClick={canShareFile ? shareNativeImage : downloadCard}
            disabled={capturing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              width: '100%',
              padding: '0.72rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#fbbf24',
              color: '#07080b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: capturing ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s, transform 0.15s',
              marginBottom: '0.75rem',
            }}
          >
            {capturing ? (
              <>Generating Card...</>
            ) : downloaded ? (
              <>
                <Check size={15} /> Saved to Gallery!
              </>
            ) : canShareFile ? (
              <>
                <Send size={15} /> Share Image to Story / Apps
              </>
            ) : (
              <>
                <Download size={15} /> Download Film Card (PNG)
              </>
            )}
          </button>
        )}

        {/* Copy Link Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '0.3rem 0.3rem 0.3rem 0.7rem',
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.76rem',
              color: '#8e95a5',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fullUrl}
          </span>
          <button
            onClick={copyLink}
            style={{
              background: copied ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: copied ? '#fbbf24' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Link'}
          </button>
        </div>

        {/* Social Platforms Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.45rem',
          }}
        >
          <button
            onClick={shareWhatsApp}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.4rem',
              borderRadius: '8px',
              border: 'none',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>

          <button
            onClick={shareTwitter}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.4rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#131722',
              color: '#f8fafc',
              fontWeight: 600,
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
            X / Twitter
          </button>

          <button
            onClick={shareFacebook}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.4rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#1877F2',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            <Globe size={14} />
            Facebook
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
