import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { cleanPhone10, buildWaUrl, formatTimeLeft } from '../lib/utils';

// Mock supabase module to test deterministic local state transitions
vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isSupabaseConfigured: false,
    supabase: null,
  };
});

describe('Utils unit tests', () => {
  it('cleanPhone10 extracts last 10 digits', () => {
    expect(cleanPhone10('+91 98765-43210')).toBe('9876543210');
    expect(cleanPhone10('9876543210')).toBe('9876543210');
  });

  it('buildWaUrl formats +91 WhatsApp deep link', () => {
    const url = buildWaUrl('9876543210', 'Hello');
    expect(url).toBe('https://wa.me/919876543210?text=Hello');
  });

  it('formatTimeLeft returns 00:00 for past or null timestamps', () => {
    expect(formatTimeLeft(null)).toBe('00:00');
    expect(formatTimeLeft(new Date(Date.now() - 5000).toISOString())).toBe('00:00');
  });
});

describe('Hostel Laundry Tracker Integration & Regression Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all 5 machines defaulting to AVAILABLE (Ready to Use)', () => {
    render(<App />);
    const readyBadges = screen.getAllByText('Ready to Use');
    expect(readyBadges).toHaveLength(5);
  });

  it('starts a wash cycle, transitions to IN_USE, and ends early back to AVAILABLE', async () => {
    render(<App />);
    const startButtons = screen.getAllByText('Scan QR to Start Wash');
    fireEvent.click(startButtons[0]);

    expect(screen.getByText('Start Machine 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start Wash Cycle'));

    await waitFor(() => {
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
      expect(screen.getByText('End Cycle Early')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('End Cycle Early'));
    await waitFor(() => {
      expect(screen.getAllByText('Ready to Use')).toHaveLength(5);
    });
  });

  it('enforces 2-machine concurrent limit per student (negative test)', async () => {
    render(<App />);

    // Start Machine 1
    fireEvent.click(screen.getAllByText('Scan QR to Start Wash')[0]);
    fireEvent.click(screen.getByText('Start Wash Cycle'));
    await waitFor(() => expect(screen.getAllByText('Time Remaining')).toHaveLength(1));

    // Start Machine 2
    fireEvent.click(screen.getAllByText('Scan QR to Start Wash')[0]);
    fireEvent.click(screen.getByText('Start Wash Cycle'));
    await waitFor(() => expect(screen.getAllByText('Time Remaining')).toHaveLength(2));

    // Attempt Machine 3 -> blocked by 2-machine limit
    fireEvent.click(screen.getAllByText('Scan QR to Start Wash')[0]);
    expect(screen.getByText(/Concurrent limit reached/i)).toBeInTheDocument();
    expect(screen.getByText('Start Wash Cycle')).toBeDisabled();
  });

  it('locks machine as OUT_OF_ORDER on critical grievance and restores on resolve', async () => {
    render(<App />);
    const reportButtons = screen.getAllByText('Report Dirty / Broken / Issue');
    fireEvent.click(reportButtons[0]);

    fireEvent.click(screen.getByText('Mark Out of Order'));
    fireEvent.click(screen.getByText('Submit Grievance'));

    await waitFor(() => {
      expect(screen.getByText('Out of Order')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Review & Resolve Issue'));
    fireEvent.click(screen.getByText('Mark Resolved'));
    fireEvent.click(screen.getByText('Confirm Resolve'));
    fireEvent.click(screen.getByText('Live Machines (5)'));

    await waitFor(() => {
      expect(screen.getAllByText('Ready to Use')).toHaveLength(5);
    });
  });
});
