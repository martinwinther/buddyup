// src/lib/admin.ts

import { supabase } from './supabase';

export type AdminReport = {
  id: string;
  reason: 'harassment'|'spam'|'inappropriate'|'fake'|'other';
  details: string | null;
  created_at: string;
  reporter: { id: string; email: string | null; display_name: string | null };
  reported: { id: string; display_name: string | null; photo_url: string | null };
};

export async function adminWhoAmI() {
  const { data, error } = await supabase.functions.invoke('admin-whoami', { body: {} });
  if (error) throw error;
  return (data as { is_admin: boolean }).is_admin;
}

export async function adminListReports(opts?: { limit?: number; offset?: number }) {
  const { data, error } = await supabase.functions.invoke('admin-list-reports', {
    body: { limit: opts?.limit ?? 50, offset: opts?.offset ?? 0 },
  });
  if (error) throw error;
  return data as { items: AdminReport[]; total: number };
}

export async function adminBanUser(userId: string) {
  const { error } = await supabase.functions.invoke('admin-ban-user', { body: { user_id: userId } });
  if (error) throw error;
}

export async function adminUnbanUser(userId: string) {
  const { error } = await supabase.functions.invoke('admin-unban-user', { body: { user_id: userId } });
  if (error) throw error;
}

export async function adminDeleteUser(userId: string) {
  const { error } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: userId } });
  if (error) throw error;
}

