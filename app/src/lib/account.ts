import { supabase } from './supabase';

export async function updateNotifyEmail(enabled: boolean) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not authenticated');

  const { error } = await supabase.from('profiles')
    .update({ notify_email_messages: enabled })
    .eq('id', uid);
  if (error) throw error;
}

export async function invokeDeleteAccount() {
  // Edge Function must have SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in its env.
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
}

export async function loadMyProfile() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase.from('profiles')
    .select('display_name, notify_email_messages')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

