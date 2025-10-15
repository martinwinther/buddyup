import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

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
    // convert file:// to Uint8Array for RN
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    file = bytes;
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

type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'NO_SESSION' | 'RLS' | 'UPLOAD_FAILED' | 'UNKNOWN' };

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
