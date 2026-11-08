import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ReviewSharePopup from './ReviewSharePopup';

export default function ShareButton({ title, text, url, variant = 'icon', label, movie, className, wrapperClassName }) {
  const [isOpen, setIsOpen] = useState(false);

  const btnStyle = variant === 'text'
    ? { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }
    : { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer' };

  return (
    <div className={wrapperClassName} style={wrapperClassName ? { position: 'relative' } : { position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(true)} 
        className={className} 
        style={className ? undefined : btnStyle} 
        aria-label="Share" 
        title="Share" 
      >
        <Share2 size={16} />
        {(variant === 'text' || label) && <span>{label || 'Share'}</span>}
      </button>

      {isOpen && (
        <ReviewSharePopup
          movie={movie}
          title={title}
          text={text}
          url={url}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
