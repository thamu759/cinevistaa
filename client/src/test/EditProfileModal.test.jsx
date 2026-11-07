import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EditProfileModal, { CINE_AVATARS } from '../components/EditProfileModal';

describe('EditProfileModal', () => {
  const mockUser = {
    username: 'cinemaniac',
    email: 'critic@thiraipedia.com',
    avatarUrl: 'https://example.com/original.jpg'
  };

  const mockProfileData = {
    bio: 'Cinema is life.',
    email: 'critic@thiraipedia.com'
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EditProfileModal
        isOpen={false}
        onClose={vi.fn()}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders upload dropzone, character count, and cinephile presets when isOpen is true', () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('CRITIC PORTFOLIO')).toBeInTheDocument();
    expect(screen.getByText('Upload from Device')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop or click to browse files/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cinema is life.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('critic@thiraipedia.com')).toBeInTheDocument();
    expect(screen.getByText('Or pick a Cinephile Icon')).toBeInTheDocument();
    expect(screen.getByText('15 / 200')).toBeInTheDocument();
    expect(screen.getByText('Remove Photo')).toBeInTheDocument();
  });

  it('selects a cinephile preset icon on click', () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={vi.fn()}
      />
    );

    // Click on 35mm Reel preset
    const reelPreset = screen.getByTitle('35mm Reel');
    fireEvent.click(reelPreset);

    // Preview image should reflect the new preset
    const reelPresetData = CINE_AVATARS.find(p => p.label === '35mm Reel');
    const previewImg = screen.getByAltText('Avatar Preview');
    expect(previewImg.getAttribute('src')).toBe(reelPresetData.url);
  });

  it('removes photo when Remove Photo is clicked', () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={vi.fn()}
      />
    );

    const removeBtn = screen.getByText('Remove Photo');
    fireEvent.click(removeBtn);

    // After removal, preview falls back to default avatar
    const previewImg = screen.getByAltText('Avatar Preview');
    expect(previewImg.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('calls onSave with updated values upon form submission', async () => {
    const handleSave = vi.fn().mockResolvedValueOnce();

    render(
      <EditProfileModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={handleSave}
      />
    );

    const bioInput = screen.getByPlaceholderText(/Share your cinema taste/i);
    fireEvent.change(bioInput, { target: { value: 'New cinephile perspective.' } });

    const submitBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith({
        bio: 'New cinephile perspective.',
        avatarUrl: 'https://example.com/original.jpg',
        email: 'critic@thiraipedia.com'
      });
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <EditProfileModal
        isOpen={true}
        onClose={handleClose}
        currentUser={mockUser}
        profileData={mockProfileData}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
