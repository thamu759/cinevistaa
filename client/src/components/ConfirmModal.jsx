import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="420px">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <AlertTriangle size={28} color={danger ? '#ef4444' : 'var(--color-accent-gold)'} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title || 'Confirm Action'}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onClose}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }}
            style={{
              padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px', border: 'none',
              background: danger ? '#ef4444' : 'var(--color-accent-gold)',
              color: danger ? '#fff' : '#000',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s'
            }}>
            <AlertTriangle size={14} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
