export function mapSupabaseError(msg?: string) {
  if (!msg) return 'Something went wrong';
  const m = msg.toLowerCase();
  if (m.includes('violates row-level security') || m.includes('permission denied')) {
    return 'Action blocked by server rules (rate limit or permission). Please try again shortly.';
  }
  if (m.includes('duplicate') || m.includes('already exists')) {
    return 'Looks like you just did that. Please try something else.';
  }
  if (m.includes('value too long') || m.includes('length')) {
    return 'Too long. Please shorten your message.';
  }
  return 'Unexpected error. Please try again.';
}

