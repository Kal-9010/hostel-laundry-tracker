export function formatTimeLeft(endTime) {
  if (!endTime) return '00:00';
  const diffMs = Math.max(0, new Date(endTime).getTime() - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatClockTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export function cleanPhone10(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.slice(-10);
}

export function buildWaUrl(phone, message) {
  const digits = cleanPhone10(phone);
  const encoded = encodeURIComponent(message);
  if (digits.length === 10) {
    return `https://wa.me/91${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
    });
  } catch {
    // Ignore audio context errors if blocked by browser autoplay policy
  }
}

export function sendBrowserNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

export function downloadReminderIcs(machineLabel, cycleType, endTime) {
  if (!endTime) return;
  const end = new Date(endTime);
  const start = new Date(end.getTime() - 5 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hostel Laundry Tracker//EN',
    'BEGIN:VEVENT',
    `UID:hlt-${Date.now()}@hostellaundry`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(end)}`,
    `DTEND:${fmt(new Date(end.getTime() + 10 * 60 * 1000))}`,
    `SUMMARY:Pick up laundry from ${machineLabel}`,
    `DESCRIPTION:${cycleType || 'Wash Cycle'} on ${machineLabel} is finished!`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Laundry done in ${machineLabel}!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${machineLabel.replace(/\s+/g, '-').toLowerCase()}-reminder.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
