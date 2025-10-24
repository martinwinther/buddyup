import { supabase } from './supabase';

export async function invokeFunctionJSON<T = unknown>(name: string, payload?: Record<string, any>): Promise<T> {
  const { data: s } = await supabase.auth.getSession();
  const accessToken = s?.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const { data, error } = await supabase.functions.invoke<T>(name, {
    method: 'POST',
    headers,
    body: payload ?? {},
  });

  if (error) {
    // Surface the message if the function returns a JSON error
    throw new Error(error.message || 'Edge function error');
  }
  return data as T;
}
