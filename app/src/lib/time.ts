export function formatRelative(ts?: string | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime()); // ms
  const sec = Math.round(diff / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString();
}

export function formatPresence(lastActive?: string | null): string {
  if (!lastActive) return '';
  const d = new Date(lastActive).getTime();
  const diff = Date.now() - d;
  if (diff < 2 * 60 * 1000) return 'Online';
  return `${formatRelative(lastActive)} ago`;
}

