import { supabase } from './supabase';

export async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session ?? null;
  if (!session) {
    const e = new Error('NO_SESSION');
    (e as any).code = 'NO_SESSION';
    throw e;
  }
  return session;
}

