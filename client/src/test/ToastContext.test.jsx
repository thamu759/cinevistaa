import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';

function TestTrigger() {
  const { showToast, dismissToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Welcome back, critic!', 'success')}>
        Trigger Success
      </button>
      <button onClick={() => showToast('Failed to sync queue', 'error')}>
        Trigger Error
      </button>
      <button onClick={() => showToast('Curating selections...', 'info')}>
        Trigger Info
      </button>
    </div>
  );
}

describe('ToastContext & Toast Notification System', () => {
  it('renders nothing initially when no toasts are dispatched', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders a success toast with check icon and dismiss button', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Success'));

    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast--success');
    expect(screen.getByText('Welcome back, critic!')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss message');
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders error and info toasts with appropriate styles', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Error'));
    fireEvent.click(screen.getByText('Trigger Info'));

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toHaveClass('toast--error');
    expect(statuses[1]).toHaveClass('toast--info');
  });

  it('auto dismisses toast after timeout', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Success'));
    expect(screen.getByText('Welcome back, critic!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3600);
    });

    expect(screen.queryByText('Welcome back, critic!')).toBeNull();

    vi.useRealTimers();
  });
});

