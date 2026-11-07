import { useState, useEffect, useRef } from 'react';
import { X, Mail, UploadCloud, Camera, Trash2, Sparkles, Check, User, RefreshCw } from 'lucide-react';

export const CINE_AVATARS = [
  {
    id: 'director',
    label: 'Camera',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="50" fill="%23141721"/%3E%3Ccircle cx="50" cy="50" r="46" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/%3E%3Cpath d="M35 38h22l10-8v40l-10-8H35a5 5 0 0 1-5-5V43a5 5 0 0 1 5-5z" fill="%23fbbf24"/%3E%3Ccircle cx="43" cy="50" r="5" fill="%23141721"/%3E%3C/svg%3E'
  },
  {
    id: 'film-reel',
    label: '35mm Reel',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="50" fill="%23141721"/%3E%3Ccircle cx="50" cy="50" r="46" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/%3E%3Ccircle cx="50" cy="50" r="28" fill="none" stroke="%23fbbf24" stroke-width="4"/%3E%3Ccircle cx="50" cy="50" r="8" fill="%23fbbf24"/%3E%3Ccircle cx="50" cy="30" r="5" fill="%23fbbf24"/%3E%3Ccircle cx="50" cy="70" r="5" fill="%23fbbf24"/%3E%3Ccircle cx="30" cy="50" r="5" fill="%23fbbf24"/%3E%3Ccircle cx="70" cy="50" r="5" fill="%23fbbf24"/%3E%3C/svg%3E'
  },
  {
    id: 'critic-clapper',
    label: 'Clapper',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="50" fill="%23141721"/%3E%3Ccircle cx="50" cy="50" r="46" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/%3E%3Cpath d="M28 42h44v32H28z" fill="%23fbbf24" fill-opacity="0.9"/%3E%3Cpath d="M28 26h44v14H28z" fill="%23fbbf24"/%3E%3Cpath d="M36 26l8 14M52 26l8 14M68 26l4 7" stroke="%23141721" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'
  },
  {
    id: 'noir-critic',
    label: 'Noir',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="50" fill="%23141721"/%3E%3Ccircle cx="50" cy="50" r="46" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/%3E%3Cellipse cx="50" cy="42" rx="26" ry="6" fill="%23fbbf24"/%3E%3Cpath d="M32 40c0-14 8-18 18-18s18 4 18 18z" fill="%23fbbf24"/%3E%3Ccircle cx="43" cy="52" r="3" fill="%23fbbf24"/%3E%3Ccircle cx="57" cy="52" r="3" fill="%23fbbf24"/%3E%3Cpath d="M30 76c2-12 10-18 20-18s18 6 20 18" fill="none" stroke="%23fbbf24" stroke-width="3" stroke-linecap="round"/%3E%3C/svg%3E'
  },
  {
    id: 'laurel-star',
    label: 'Palme',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="50" fill="%23141721"/%3E%3Ccircle cx="50" cy="50" r="46" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/%3E%3Cpath d="M50 24l5 15h16l-13 10 5 16-13-10-13 10 5-16-13-10h16z" fill="%23fbbf24"/%3E%3C/svg%3E'
  }
];

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2750%27 fill=%27%23161a23%27/%3E%3Ccircle cx=%2750%27 cy=%2738%27 r=%2716%27 fill=%27%23475569%27/%3E%3Cellipse cx=%2750%27 cy=%2780%27 rx=%2728%27 ry=%2722%27 fill=%27%23475569%27/%3E%3C/svg%3E';

// Helper to center-crop and resize an image file into a compact base64 avatar
export const processAvatarImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (JPEG, PNG, WebP)'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('File size exceeds 8MB limit'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const targetSize = 280;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          // Center crop square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error('Failed to process image'));
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
};

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  profileData,
  onSave
}) {
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setBio(profileData?.bio || '');
      setAvatarUrl(currentUser?.avatarUrl || profileData?.avatarUrl || '');
      setEmail(profileData?.email || currentUser?.email || '');
      setErrorMsg('');
      setIsDragging(false);
      setIsProcessingImg(false);
    }
  }, [isOpen, currentUser, profileData]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleFile = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setIsProcessingImg(true);
    try {
      const optimizedDataUrl = await processAvatarImageFile(file);
      setAvatarUrl(optimizedDataUrl);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload photo');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);
    try {
      await onSave({
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        email: email.trim()
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreview = avatarUrl || DEFAULT_AVATAR;

  return (
    <div className="modal-overlay" onClick={() => !isSaving && onClose()}>
      <div 
        className="modal-content-panel edit-profile-panel slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button 
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* MODAL HEADER */}
        <div className="edit-profile-header">
          <span className="edit-profile-eyebrow">CRITIC PORTFOLIO</span>
          <h2 className="edit-profile-title">Edit Profile</h2>
          <p className="edit-profile-subtitle">
            Upload your personal photo, update your bio, and manage your account.
          </p>
        </div>

        {errorMsg && (
          <div className="edit-profile-error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* AVATAR UPLOAD SECTION */}
          <div className="edit-profile-upload-zone-wrapper">
            <div className="edit-profile-avatar-preview-wrap">
              <img 
                src={currentPreview} 
                alt="Avatar Preview" 
                className="edit-profile-avatar-preview"
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              />
              <span className="edit-profile-avatar-status">Preview</span>
            </div>

            {/* DRAG AND DROP / FILE SELECTOR */}
            <div 
              className={`edit-profile-dropzone ${isDragging ? 'dragging' : ''} ${isProcessingImg ? 'loading' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />

              {isProcessingImg ? (
                <div className="edit-profile-dropzone-inner">
                  <RefreshCw size={24} className="spin-icon edit-profile-upload-icon" />
                  <span className="edit-profile-dropzone-title">Optimizing photo...</span>
                </div>
              ) : (
                <div className="edit-profile-dropzone-inner">
                  <UploadCloud size={24} className="edit-profile-upload-icon" />
                  <div className="edit-profile-dropzone-texts">
                    <span className="edit-profile-dropzone-title">
                      Upload from Device
                    </span>
                    <span className="edit-profile-dropzone-sub">
                      Drag & drop or click to browse files
                    </span>
                    <span className="edit-profile-dropzone-hint">
                      JPG, PNG, WebP · Auto-cropped to square
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE PHOTO ACTIONS & CINEPHILE PRESETS */}
          <div className="edit-profile-presets-row">
            <div className="edit-profile-presets-header">
              <span className="edit-profile-presets-title">
                <Sparkles size={12} className="edit-profile-presets-icon" />
                <span>Or pick a Cinephile Icon</span>
              </span>
              {avatarUrl && (
                <button
                  type="button"
                  className="edit-profile-remove-btn"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 size={12} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div className="edit-profile-presets-grid">
              {CINE_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`edit-profile-preset-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setAvatarUrl(preset.url)}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="edit-profile-preset-img" />
                    {isSelected && (
                      <span className="edit-profile-preset-check">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BIO TEXTAREA */}
          <div className="edit-profile-field">
            <div className="edit-profile-field-header">
              <label className="edit-profile-label">
                <User size={13} />
                <span>Bio & Cinema Philosophy</span>
              </label>
              <span className={`edit-profile-char-count ${bio.length > 180 ? 'warn' : ''}`}>
                {bio.length} / 200
              </span>
            </div>
            <textarea
              className="search-input edit-profile-textarea"
              rows={3}
              maxLength={200}
              placeholder="Share your cinema taste, favorite eras, or critique perspective..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* EMAIL INPUT */}
          <div className="edit-profile-field">
            <label className="edit-profile-label">
              <Mail size={13} />
              <span>Contact Email</span>
            </label>
            <input
              type="email"
              className="search-input edit-profile-input"
              placeholder="critic@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="edit-profile-footer">
            <button
              type="button"
              className="profile-btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-btn-primary"
              disabled={isSaving || isProcessingImg}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
