import { supabase } from './supabase';

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

// Upload a file to Supabase storage
export async function uploadFile(
  bucket: 'product-images' | 'gallery' | 'cottage-images' | 'hall-images',
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    console.error('Upload exception:', err);
    return { success: false, error: 'Failed to upload file' };
  }
}

// Upload multiple files
export async function uploadMultipleFiles(
  bucket: 'product-images' | 'gallery' | 'cottage-images' | 'hall-images',
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(bucket, files[i]);
    if (result.success && result.url) {
      urls.push(result.url);
    }
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return urls;
}

// Delete a file from storage
export async function deleteFile(
  bucket: 'product-images' | 'gallery' | 'cottage-images' | 'hall-images',
  path: string
): Promise<boolean> {
  try {
    // Extract path from URL if full URL is provided
    const urlPath = path.includes('/storage/v1/object/public/')
      ? path.split('/storage/v1/object/public/' + bucket + '/').pop() || path
      : path;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([urlPath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete exception:', err);
    return false;
  }
}

// Validate file before upload
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;

  // Check file size
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > maxSizeMB) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type) && !allowedTypes.includes('*')) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  return { valid: true };
}

// Compress image if needed
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
