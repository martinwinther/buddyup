import { supabase } from '../../lib/supabase';

export type ProfileSettings = {
  notify_email_messages: boolean;
};

export class SettingsRepository {
  async load(): Promise<ProfileSettings | null> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('notify_email_messages')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { notify_email_messages: false };

    return { notify_email_messages: !!data.notify_email_messages };
  }

  async update(patch: Partial<ProfileSettings>): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const { error } = await supabase
      .from('profiles')
      .update({ ...patch })
      .eq('id', uid);
    if (error) throw error;
  }
}
