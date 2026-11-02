import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Share2, X, Check, Star, ShieldCheck, Award } from 'lucide-react';
import { proxyImageUrl } from '../api';
import { playTicketTear, playPopcornPop } from '../utils/cinemaAudio';

export default function CinemaTicketModal({ isOpen, onClose, movie, userRating = null, userReview = '' }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [seatInfo, setSeatInfo] = useState({ screen: '01', row: 'D', seat: '14' });

  useEffect(() => {
    if (isOpen) {
      playTicketTear();
      const randNum = Math.floor(100000 + Math.random() * 900000);
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const randomRow = rows[Math.floor(Math.random() * rows.length)];
      const randomSeat = Math.floor(1 + Math.random() * 24);
      const screenNo = String(Math.floor(1 + Math.random() * 5)).padStart(2, '0');

      setTicketNumber(`TP-${randNum}`);
      setSeatInfo({ screen: screenNo, row: randomRow, seat: String(randomSeat) });
    }
  }, [isOpen]);

  const handleDownload = useCallback(async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    playTicketTear();

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0b0e',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${(movie?.title || 'movie').replace(/[^a-zA-Z0-9]/g, '_')}_collectors_pass.png`;
      link.href = dataUrl;
      link.click();
      playPopcornPop();
    } catch (err) {
      console.error('Failed to export pass:', err);
    } finally {
      setDownloading(false);
    }
  }, [movie, downloading]);

  const handleShare = useCallback(async () => {
    if (!ticketRef.current) return;
    playPopcornPop();

    try {
      if (navigator.share) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(ticketRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0a0b0e',
          logging: false,
        });

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `${movie?.title || 'movie'}_pass.png`, { type: 'image/png' });
          try {
            await navigator.share({
              title: `${movie?.title || 'Film'} Collector's Pass | ThiraiPedia`,
              text: `Collector's Cinema Pass for ${movie?.title || 'this film'} on ThiraiPedia.`,
              files: [file],
            });
          } catch (e) {
            fallbackShare();
          }
        }, 'image/png');
      } else {
        fallbackShare();
      }
    } catch (err) {
      fallbackShare();
    }
  }, [movie]);

  const fallbackShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !movie) return null;

  const displayRating = userRating || movie.rating || 8.5;
  const showDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="modal-overlay luxury-ticket-overlay" onClick={onClose}>
      <div className="luxury-ticket-modal" onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="luxury-ticket-top">
          <div className="luxury-ticket-pill">
            <Award size={14} />
            <span>PREMIERE ARCHIVE • COLLECTOR'S PASS</span>
          </div>
          <button className="luxury-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Physical Pass Canvas */}
        <div className="luxury-pass-outer">
          <div ref={ticketRef} className="luxury-pass-card">
            {/* Fine Cutouts */}
            <div className="pass-notch notch-top" />
            <div className="pass-notch notch-bottom" />
            <div className="pass-divider-line" />

            {/* Left Main Body */}
            <div className="pass-main-body">
              <div className="pass-header-strip">
                <div className="pass-brand-lockup">
                  <span className="pass-brand-name">THIRAIPEDIA</span>
                  <span className="pass-brand-tag">CRITERION CINEMA ARCHIVE</span>
                </div>
                <div className="pass-tier-badge">
                  <ShieldCheck size={12} />
                  <span>VIP PASS</span>
                </div>
              </div>

              <div className="pass-content-split">
                <div className="pass-poster-frame">
                  <img
                    src={proxyImageUrl(movie.posterUrl, 'w300')}
                    alt={movie.title}
                    className="pass-poster-img"
                    crossOrigin="anonymous"
                  />
                  <div className="pass-poster-sheen" />
                </div>

                <div className="pass-meta-block">
                  <div className="pass-admit-text">PREMIERE SCREENING • RESERVED SEAT</div>
                  <h2 className="pass-title">{movie.title}</h2>
                  <div className="pass-specs">
                    <span>{movie.year || '2024'}</span>
                    <span className="dot">•</span>
                    <span>{movie.language || 'TAMIL'}</span>
                    <span className="dot">•</span>
                    <span>{movie.genre?.split('/')[0]?.trim() || 'FEATURE'}</span>
                  </div>

                  <div className="pass-rating-display">
                    <div className="pass-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < Math.round(displayRating / 2) ? '#d4af37' : 'rgba(255,255,255,0.1)'}
                          color={i < Math.round(displayRating / 2) ? '#d4af37' : 'rgba(255,255,255,0.1)'}
                        />
                      ))}
                    </div>
                    <span className="pass-score-val">{displayRating.toFixed(1)} / 10</span>
                  </div>

                  {userReview && (
                    <div className="pass-review-excerpt">
                      "{userReview.slice(0, 95)}{userReview.length > 95 ? '...' : ''}"
                    </div>
                  )}
                </div>
              </div>

              <div className="pass-specs-grid">
                <div className="pass-spec-item">
                  <span className="spec-k">DATE ISSUED</span>
                  <span className="spec-v">{showDate}</span>
                </div>
                <div className="pass-spec-item">
                  <span className="spec-k">THEATRE</span>
                  <span className="spec-v">SCREEN {seatInfo.screen}</span>
                </div>
                <div className="pass-spec-item">
                  <span className="spec-k">SEATING</span>
                  <span className="spec-v">{seatInfo.row} - {seatInfo.seat}</span>
                </div>
                <div className="pass-spec-item">
                  <span className="spec-k">AUDIENCE CLASS</span>
                  <span className="spec-v">PRIME LOUNGE</span>
                </div>
              </div>
            </div>

            {/* Right Tear Stub */}
            <div className="pass-stub-body">
              <div className="stub-header-code">THIRAIPEDIA</div>
              <div className="stub-gold-seal">OFFICIAL ENTRY</div>
              <div className="stub-film-code">{movie.title}</div>
              <div className="stub-seat-large">
                <span className="seat-scr">SCR {seatInfo.screen}</span>
                <span className="seat-num">{seatInfo.row}{seatInfo.seat}</span>
              </div>
              <div className="stub-barcode-container">
                <div className="stub-minimal-barcode" />
                <span className="stub-serial-text">{ticketNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="luxury-pass-actions">
          <button
            className="luxury-action-btn luxury-action-gold"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={16} />
            <span>{downloading ? 'Rendering HD Pass...' : 'Download Collector\'s Pass (HD)'}</span>
          </button>
          <button
            className="luxury-action-btn luxury-action-outline"
            onClick={handleShare}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied' : 'Share Pass'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
