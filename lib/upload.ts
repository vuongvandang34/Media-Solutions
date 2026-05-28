import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Handles file upload to local public storage.
 * Easily interchangeable with S3 or Supabase Storage in the future.
 */
export async function uploadFile(
  file: File,
  tenantId: string,
  subFolder: 'logo' | 'promo' | 'avatar'
): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExt = file.name.split('.').pop() || 'png';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueName = `${subFolder}_${Date.now()}_${cleanName}`;

  // Target directory relative to project root
  const relativeDir = join('uploads', tenantId, subFolder);
  const uploadDir = join(process.cwd(), 'public', relativeDir);

  // Ensure nested directory structure exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  // Return standard file details
  return {
    url: `/uploads/${tenantId}/${subFolder}/${uniqueName}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
