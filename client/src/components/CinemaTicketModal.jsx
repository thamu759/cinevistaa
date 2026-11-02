import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Share2, X, Check, Ticket, Star, Sparkles, Film } from 'lucide-react';
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
      // Generate random vintage ticket number and seat
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
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${(movie?.title || 'movie').replace(/[^a-zA-Z0-9]/g, '_')}_cinema_ticket.png`;
      link.href = dataUrl;
      link.click();
      playPopcornPop();
    } catch (err) {
      console.error('Failed to download ticket stub:', err);
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
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `${movie?.title || 'movie'}_ticket.png`, { type: 'image/png' });
          try {
            await navigator.share({
              title: `${movie?.title || 'Film'} Cinema Ticket Stub | ThiraiPedia`,
              text: `Check out my movie ticket stub for ${movie?.title || 'this film'} on ThiraiPedia!`,
              files: [file],
            });
          } catch (e) {
            // Share canceled or fallback to clipboard
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
    <div className="modal-overlay ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal-container" onClick={e => e.stopPropagation()}>
        {/* Top Controls */}
        <div className="ticket-modal-header">
          <div className="ticket-modal-badge">
            <Ticket size={16} />
            <span>COLLECTOR'S TICKET STUB</span>
          </div>
          <button className="ticket-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Vintage Physical Ticket Body */}
        <div className="ticket-stub-wrapper">
          <div ref={ticketRef} className="vintage-ticket-card">
            {/* Cutout notches */}
            <div className="ticket-notch notch-left-top" />
            <div className="ticket-notch notch-left-bottom" />
            <div className="ticket-notch notch-right-top" />
            <div className="ticket-notch notch-right-bottom" />
            <div className="ticket-perforation-line" />

            {/* Ticket Left: Main Pass */}
            <div className="ticket-main-section">
              <div className="ticket-theatre-header">
                <span className="theatre-brand-name">THIRAIPEDIA PREMIERE CINEMA</span>
                <span className="theatre-brand-sub">★ IMMERSIVE FILM EXPERIENCE ★</span>
              </div>

              <div className="ticket-film-body">
                <img
                  src={proxyImageUrl(movie.posterUrl, 'w300')}
                  alt={movie.title}
                  className="ticket-poster-img"
                  crossOrigin="anonymous"
                />
                <div className="ticket-film-details">
                  <div className="ticket-admit-tag">ADMIT ONE • GENERAL RESERVED</div>
                  <h2 className="ticket-film-title">{movie.title}</h2>
                  <div className="ticket-film-meta">
                    <span>{movie.year || '2024'}</span>
                    <span>•</span>
                    <span>{movie.language || 'TAMIL'}</span>
                    <span>•</span>
                    <span>{movie.genre?.split('/')[0]?.trim() || 'CINEMA'}</span>
                  </div>

                  <div className="ticket-rating-box">
                    <div className="ticket-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.round(displayRating / 2) ? '#fbbf24' : '#4b5563'}
                          color={i < Math.round(displayRating / 2) ? '#fbbf24' : '#4b5563'}
                        />
                      ))}
                    </div>
                    <span className="ticket-score">{displayRating.toFixed(1)} / 10</span>
                  </div>

                  {userReview && (
                    <div className="ticket-user-quote">
                      "{userReview.slice(0, 90)}{userReview.length > 90 ? '...' : ''}"
                    </div>
                  )}
                </div>
              </div>

              <div className="ticket-footer-strip">
                <div className="ticket-cell">
                  <span className="cell-label">DATE</span>
                  <span className="cell-val">{showDate}</span>
                </div>
                <div className="ticket-cell">
                  <span className="cell-label">SCREEN</span>
                  <span className="cell-val">{seatInfo.screen}</span>
                </div>
                <div className="ticket-cell">
                  <span className="cell-label">ROW / SEAT</span>
                  <span className="cell-val">{seatInfo.row} - {seatInfo.seat}</span>
                </div>
                <div className="ticket-cell">
                  <span className="cell-label">CATEGORY</span>
                  <span className="cell-val">PREMIUM BOX</span>
                </div>
              </div>
            </div>

            {/* Ticket Right: Tear-off Stub */}
            <div className="ticket-stub-section">
              <div className="stub-theatre-title">THIRAIPEDIA</div>
              <div className="stub-stamp">VERIFIED CRITIC</div>
              <div className="stub-film-abbr">{movie.title}</div>
              <div className="stub-seat-display">
                <span className="stub-screen">SCR {seatInfo.screen}</span>
                <span className="stub-seat">{seatInfo.row}{seatInfo.seat}</span>
              </div>
              <div className="stub-barcode-box">
                <div className="stub-barcode-lines" />
                <span className="stub-serial">{ticketNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ticket-modal-actions">
          <button
            className="ticket-action-btn ticket-action-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={18} />
            <span>{downloading ? 'Printing Ticket...' : 'Download Ticket (HD PNG)'}</span>
          </button>
          <button
            className="ticket-action-btn ticket-action-secondary"
            onClick={handleShare}
          >
            {copied ? <Check size={18} color="#10b981" /> : <Share2 size={18} />}
            <span>{copied ? 'Link Copied!' : 'Share Stub'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
