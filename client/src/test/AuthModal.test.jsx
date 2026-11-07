import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from '../components/AuthModal';

describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    authTab: 'login',
    onTabChange: vi.fn(),
    formData: { username: '', email: '', password: '' },
    onFormChange: vi.fn(),
    error: '',
    isLoading: false,
    showPassword: false,
    onToggleShowPassword: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    googleClientId: undefined,
    googleBtnRef: { current: null }
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AuthModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders clean minimal sign in view without email field by default', () => {
    render(<AuthModal {...defaultProps} authTab="login" />);

    expect(screen.getByAltText('ThiraiPedia')).toBeDefined();
    expect(screen.getByText('Sign in to your account')).toBeDefined();
    expect(screen.getByText(/access your diary and watchlist/i)).toBeDefined();

    // Username and Password inputs should be visible
    expect(screen.getByLabelText(/Username/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password$/i)).toBeDefined();

    // Email field should NOT be in login tab
    expect(screen.queryByLabelText(/Email address/i)).toBeNull();

    // Submit button says "Sign in"
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();

    // Footer switcher prompts for creating account
    expect(screen.getByText(/Don't have an account\?/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create one' })).toBeDefined();
  });

  it('renders sign up view with email field and password guidelines', () => {
    render(<AuthModal {...defaultProps} authTab="register" />);

    expect(screen.getByText('Create your account')).toBeDefined();
    expect(screen.getByText(/Join the community to log films/i)).toBeDefined();

    // All three inputs should be present
    expect(screen.getByLabelText(/Username/i)).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password$/i)).toBeDefined();
    expect(screen.getByText('Min 6 characters')).toBeDefined();

    // Submit button says "Create account"
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();

    // Footer switcher prompts to sign in
    expect(screen.getByText(/Already have an account\?/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
  });

  it('calls onTabChange when segmented buttons or footer links are clicked', () => {
    const onTabChange = vi.fn();
    render(<AuthModal {...defaultProps} authTab="login" onTabChange={onTabChange} />);

    // Click tab button "Create Account"
    const createAccountTab = screen.getByRole('tab', { name: 'Create Account' });
    fireEvent.click(createAccountTab);
    expect(onTabChange).toHaveBeenCalledWith('register');

    // Click footer switch button
    const footerSwitch = screen.getByRole('button', { name: 'Create one' });
    fireEvent.click(footerSwitch);
    expect(onTabChange).toHaveBeenCalledWith('register');
  });

  it('fires onFormChange on typing into fields', () => {
    const onFormChange = vi.fn();
    render(
      <AuthModal
        {...defaultProps}
        authTab="register"
        onFormChange={onFormChange}
      />
    );

    const userInput = screen.getByLabelText(/Username/i);
    fireEvent.change(userInput, { target: { value: 'cinelover' } });
    expect(onFormChange).toHaveBeenCalledWith('username', 'cinelover');

    const emailInput = screen.getByLabelText(/Email address/i);
    fireEvent.change(emailInput, { target: { value: 'cine@example.com' } });
    expect(onFormChange).toHaveBeenCalledWith('email', 'cine@example.com');

    const passInput = screen.getByLabelText(/^Password$/i);
    fireEvent.change(passInput, { target: { value: 'secretpass' } });
    expect(onFormChange).toHaveBeenCalledWith('password', 'secretpass');
  });

  it('displays error banner when error is present', () => {
    render(
      <AuthModal
        {...defaultProps}
        error="Invalid username or password."
      />
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Invalid username or password.')).toBeDefined();
  });

  it('toggles password visibility when eye button is clicked', () => {
    const onToggleShowPassword = vi.fn();
    render(
      <AuthModal
        {...defaultProps}
        showPassword={false}
        onToggleShowPassword={onToggleShowPassword}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Show password/i });
    fireEvent.click(toggleBtn);
    expect(onToggleShowPassword).toHaveBeenCalledTimes(1);
  });

  it('renders loading state and disables submit button when isLoading is true', () => {
    render(<AuthModal {...defaultProps} isLoading={true} authTab="login" />);

    expect(screen.getByText('Signing in...')).toBeDefined();
    const submitBtn = screen.getByRole('button', { name: /Signing in.../i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onClose when close button or Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<AuthModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByLabelText(/Close authentication modal/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
