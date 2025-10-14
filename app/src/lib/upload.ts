import { supabase } from './supabase';
import { requireSession } from './authGuard';

export async function uploadProfilePhotoFromUri(uri: string): Promise<string> {
  try {
    const session = await requireSession();
    const uid = session.user.id;

    const response = await fetch(uri);
    const blob = await response.blob();

    const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const filePath = `profiles/${uid}/avatar.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, blob, {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      const errorMessage = uploadError.message?.toLowerCase() || '';
      const statusCode = (uploadError as any).statusCode;
      
      if (
        statusCode === 400 ||
        statusCode === 401 ||
        errorMessage.includes('row-level security') ||
        errorMessage.includes('policy')
      ) {
        const e = new Error(
          'UPLOAD_RLS: You must be signed in (and email verified if required) before uploading.'
        );
        (e as any).code = 'UPLOAD_RLS';
        throw e;
      }
      
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    
    if (error.code === 'NO_SESSION' || error.code === 'UPLOAD_RLS') {
      throw error;
    }
    
    throw error;
  }
}

