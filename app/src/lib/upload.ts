import { supabase } from './supabase';

export async function uploadProfilePhotoFromUri(
  uri: string,
  userId: string
): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filePath = `profiles/${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
}

