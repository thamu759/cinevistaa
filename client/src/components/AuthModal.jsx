import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Film, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import brandLogo from '../assets/Thiraipedia White Logo with Yellow.png';

function AuthModal({
  isOpen,
  onClose,
  authTab = 'login',
  onTabChange,
  formData = { username: '', email: '', password: '' },
  onFormChange,
  error = '',
  isLoading = false,
  showPassword = false,
  onToggleShowPassword,
  onSubmit,
  googleClientId,
  googleBtnRef
}) {
  const usernameInputRef = useRef(null);

  // Focus username input on modal open or tab change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (usernameInputRef.current) {
          usernameInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, authTab]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isLogin = authTab === 'login';

  return (
    <div 
      className="auth-modal-backdrop" 
      onClick={() => { if (!isLoading) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className="auth-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="auth-modal-close" 
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close authentication modal"
        >
          <X size={17} />
        </button>

        {/* Header */}
        <div className="auth-card-header">
          <img src={brandLogo} alt="ThiraiPedia" className="auth-brand-logo" />

          <h2 id="auth-modal-title" className="auth-modal-heading">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>

          <p className="auth-modal-subheading">
            {isLogin 
              ? 'Enter your credentials to access your diary and watchlist.' 
              : 'Join the community to log films, rate favorites, and write reviews.'}
          </p>
        </div>

        {/* Minimal Segmented Switcher */}
        <div className="auth-segmented-control" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`auth-segment-btn ${isLogin ? 'auth-segment-btn--active' : ''}`}
            onClick={() => { if (!isLoading && onTabChange) onTabChange('login'); }}
            disabled={isLoading}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            className={`auth-segment-btn ${!isLogin ? 'auth-segment-btn--active' : ''}`}
            onClick={() => { if (!isLoading && onTabChange) onTabChange('register'); }}
            disabled={isLoading}
          >
            Create Account
          </button>
        </div>

        {/* Optional Google SSO */}
        {googleClientId && (
          <div className="auth-google-section">
            <div ref={googleBtnRef} className="auth-google-btn-wrap" />
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with email</span>
              <span className="auth-divider-line" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={15} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={onSubmit} noValidate>
          <div className="auth-form-fields">
            {/* Username */}
            <div className="auth-form-group">
              <label htmlFor="auth-username" className="auth-form-label">
                Username
              </label>
              <div className="auth-input-container">
                <User size={15} className="auth-input-icon" />
                <input
                  id="auth-username"
                  ref={usernameInputRef}
                  type="text"
                  className="auth-form-input"
                  placeholder="e.g. cinemaniac"
                  value={formData.username || ''}
                  onChange={(e) => onFormChange('username', e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email (Registration only) */}
            {!isLogin && (
              <div className="auth-form-group">
                <label htmlFor="auth-email" className="auth-form-label">
                  Email address
                </label>
                <div className="auth-input-container">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-form-input"
                    placeholder="you@example.com"
                    value={formData.email || ''}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    autoComplete="email"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label htmlFor="auth-password" className="auth-form-label">
                  Password
                </label>
                {!isLogin && (
                  <span className="auth-form-hint">
                    Min 6 characters
                  </span>
                )}
              </div>
              <div className="auth-input-container">
                <Lock size={15} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-form-input auth-form-input--has-toggle"
                  placeholder={isLogin ? 'Your password' : 'Create a strong password'}
                  value={formData.password || ''}
                  onChange={(e) => onFormChange('password', e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={onToggleShowPassword}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-submit-loading">
                <span className="auth-spinner-ring" />
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </span>
            ) : (
              <span>{isLogin ? 'Sign in' : 'Create account'}</span>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="auth-modal-footer">
          <p className="auth-footer-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                if (!isLoading && onTabChange) {
                  onTabChange(isLogin ? 'register' : 'login');
                }
              }}
              disabled={isLoading}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
