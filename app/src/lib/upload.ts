import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

/**
 * @deprecated
 * Do not use this to change avatars. Use ProfilePhotosRepository.addFromUri()
 * and then ProfilePhotosRepository.setPrimary() instead.
 * This avoids Storage RLS/upsert edge cases on web and native.
 */
export async function uploadProfilePhotoFromUri(uri: string) {
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) throw new Error('NO_SESSION');

  let file: Blob | Uint8Array;
  let contentType = 'image/jpeg';
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) contentType = 'image/png';

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    file = await res.blob();
  } else {
    // modern API: File implements Blob and has arrayBuffer() method
    const fsFile = new File(uri);
    const arrayBuffer = await fsFile.arrayBuffer();
    file = new Uint8Array(arrayBuffer);
  }

  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const path = `profiles/${uid}/avatar.${ext}`;
  if (__DEV__) console.info('[upload] uid:', uid, 'path:', path, 'ct:', contentType);

  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(path, file as any, { upsert: true, contentType });

  if (error) throw error;

  const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return pub.publicUrl;
}

/**
 * Upload a new profile photo and return { publicUrl, path }.
 * Saves to: profile-photos/profiles/{userId}/{timestamp-rand}.jpg
 */
export async function uploadNewProfilePhotoFromUri(uri: string, userId: string) {
  if (!userId) throw new Error('No user id');
  // best-effort content-type
  const contentType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // Get data as Blob (works on web & native)
  const res = await fetch(uri);
  const blob = await res.blob();

  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1e6)}${contentType === 'image/png' ? '.png' : '.jpg'}`;
  const path = `profiles/${userId}/${fileName}`;

  const { error: upErr } = await supabase
    .storage
    .from('profile-photos')
    .upload(path, blob, { contentType, upsert: false });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return { publicUrl: pub.publicUrl, path };
}

type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'NO_SESSION' | 'RLS' | 'UPLOAD_FAILED' | 'UNKNOWN' };

/**
 * @deprecated
 * Do not use this to change avatars. Use ProfilePhotosRepository.addFromUri()
 * and then ProfilePhotosRepository.setPrimary() instead.
 * This avoids Storage RLS/upsert edge cases on web and native.
 */
export async function tryUploadProfilePhoto(uri: string): Promise<UploadResult> {
  try {
    const url = await uploadProfilePhotoFromUri(uri);
    return { ok: true, url };
  } catch (error: any) {
    console.error('[upload] Failed to upload profile photo:', error);
    
    if (error.message === 'NO_SESSION') {
      return { ok: false, reason: 'NO_SESSION' };
    }
    
    if (error.message?.includes('row-level security') || error.statusCode === 403) {
      return { ok: false, reason: 'RLS' };
    }
    
    if (error.message?.includes('upload')) {
      return { ok: false, reason: 'UPLOAD_FAILED' };
    }
    
    return { ok: false, reason: 'UNKNOWN' };
  }
}
