import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdsterraAd from '../components/AdsterraAd';

describe('AdsterraAd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders container with correct min dimensions', () => {
    const { container } = render(<AdsterraAd zoneKey="test123" width={300} height={250} />);
    const div = container.firstChild;
    expect(div.style.minHeight).toBe('250px');
    expect(div.style.minWidth).toBe('300px');
  });

  it('creates iframe inside container', () => {
    const { container } = render(<AdsterraAd zoneKey="test123" width={728} height={90} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.width).toBe('728');
    expect(iframe.height).toBe('90');
  });

  it('shows fallback image when ad fails to load', () => {
    const fallbackImg = 'https://example.com/fallback.jpg';
    const { container } = render(
      <AdsterraAd zoneKey="test123" width={300} height={250} fallbackImg={fallbackImg} />
    );
    act(() => { vi.advanceTimersByTime(7000); });
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toBe(fallbackImg);
  });
});