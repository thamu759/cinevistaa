import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, width, className = '' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content-panel glass-panel ${className}`}
        ref={panelRef}
        style={{ maxWidth: width || '580px' }}
        onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button className="modal-close-btn"
            style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
            onClick={onClose}>
            <X size={18} />
          </button>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
