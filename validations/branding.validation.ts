import { z } from 'zod';
import { BusinessAssetType } from '@prisma/client';

export const businessAssetSchema = z.object({
  type: z.nativeEnum(BusinessAssetType),
  fileUrl: z.string().url('Invalid asset URL'),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
});

export type BusinessAssetInput = z.infer<typeof businessAssetSchema>;
