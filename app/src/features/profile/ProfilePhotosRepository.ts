import { supabase } from '../../lib/supabase';
import { uploadNewProfilePhotoFromUri } from '../../lib/upload';

export type ProfilePhoto = {
  id: string;
  user_id: string;
  url: string;
  sort_order: number;
  created_at: string;
};

export class ProfilePhotosRepository {
  async listByUser(userId: string): Promise<ProfilePhoto[]> {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('id,user_id,url,sort_order,created_at')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async addFromUri(localUri: string, setPrimaryIfFirst = true): Promise<ProfilePhoto> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    // upload to storage
    const { publicUrl } = await uploadNewProfilePhotoFromUri(localUri, me);

    // compute next sort order
    const { data: maxRow } = await supabase
      .from('profile_photos')
      .select('sort_order')
      .eq('user_id', me)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.sort_order ?? -1) + 1;

    // insert row
    const { data, error } = await supabase
      .from('profile_photos')
      .insert({ user_id: me, url: publicUrl, sort_order: nextOrder })
      .select('id,user_id,url,sort_order,created_at')
      .single();
    if (error) throw error;

    // If first photo, set as avatar on profiles
    if (setPrimaryIfFirst && nextOrder === 0) {
      await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', me);
    }
    return data;
  }

  async remove(photoId: string): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    // find the photo
    const { data: photo, error: fErr } = await supabase
      .from('profile_photos')
      .select('id,user_id,url,sort_order')
      .eq('id', photoId)
      .maybeSingle();
    if (fErr) throw fErr;
    if (!photo || photo.user_id !== me) return;

    // delete row
    const { error: delErr } = await supabase.from('profile_photos').delete().eq('id', photoId);
    if (delErr) throw delErr;

    // If this was primary (sort_order = 0), refresh avatar to next photo
    if (photo.sort_order === 0) {
      const { data: next } = await supabase
        .from('profile_photos')
        .select('url')
        .eq('user_id', me)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      await supabase.from('profiles').update({ photo_url: next?.url ?? null }).eq('id', me);
    }
  }

  async setPrimary(photoId: string): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    // load all for ordering
    const photos = await this.listByUser(me);
    const index = photos.findIndex((p) => p.id === photoId);
    if (index < 0) return;

    const chosen = photos[index];

    // reorder: put chosen first, keep relative order of others
    const reordered = [chosen, ...photos.filter((p) => p.id !== chosen.id)];
    // batch update
    for (let i = 0; i < reordered.length; i++) {
      const p = reordered[i];
      if (p.sort_order !== i) {
        await supabase.from('profile_photos').update({ sort_order: i }).eq('id', p.id);
      }
    }
    // update avatar url
    await supabase.from('profiles').update({ photo_url: chosen.url }).eq('id', me);
  }

  async reorder(photoIdsInOrder: string[]): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    for (let i = 0; i < photoIdsInOrder.length; i++) {
      await supabase.from('profile_photos').update({ sort_order: i }).eq('id', photoIdsInOrder[i]);
    }
    // first becomes avatar
    if (photoIdsInOrder.length > 0) {
      const { data: first } = await supabase
        .from('profile_photos')
        .select('url')
        .eq('id', photoIdsInOrder[0])
        .maybeSingle();
      if (first?.url) await supabase.from('profiles').update({ photo_url: first.url }).eq('id', me);
    }
  }
}

