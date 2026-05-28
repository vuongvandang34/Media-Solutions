import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole, BusinessAssetType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canManageBranding } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { assertCanUsePromotionPhoto } from '@/lib/plan-limits';
import { uploadFile } from '@/lib/upload';
import { createAuditLog } from '@/lib/audit-log';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId) {
      return NextResponse.json(
        { success: false, message: 'No tenant scope associated with user' },
        { status: 400 }
      );
    }

    // 1. Enforce active tenant context
    try {
      await assertTenantActive();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message || 'Tenant is inactive' },
        { status: 403 }
      );
    }

    // 2. Require canManageBranding (BUSINESS_OWNER) permission
    if (!canManageBranding(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can manage business branding.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // LOGO or PROMOTION_PHOTO

    if (!file || !type) {
      return NextResponse.json(
        { success: false, message: 'File and type parameters are required' },
        { status: 400 }
      );
    }

    if (type !== 'LOGO' && type !== 'PROMOTION_PHOTO') {
      return NextResponse.json(
        { success: false, message: 'Invalid asset type. Must be LOGO or PROMOTION_PHOTO' },
        { status: 400 }
      );
    }

    // 3. Enforce size limits and mimetypes
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.' },
        { status: 400 }
      );
    }

    if (type === 'LOGO') {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'Logo file size exceeds the 2MB limit.' },
          { status: 400 }
        );
      }
    } else {
      // PROMOTION_PHOTO plan limit enforcement
      try {
        await assertCanUsePromotionPhoto(user.tenantId);
      } catch (e: any) {
        return NextResponse.json(
          { success: false, message: e.message || 'Feature locked' },
          { status: 403 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'Promotion photo file size exceeds the 5MB limit.' },
          { status: 400 }
        );
      }
    }

    // 4. Upload file locally
    const subFolder = type === 'LOGO' ? 'logo' : 'promo';
    const uploadResult = await uploadFile(file, user.tenantId, subFolder);

    // 5. Store asset in Database inside a Prisma transaction
    const [asset, tenant] = await prisma.$transaction([
      prisma.businessAsset.create({
        data: {
          tenantId: user.tenantId!,
          type: type as BusinessAssetType,
          fileUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
        },
      }),
      prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          logoUrl: type === 'LOGO' ? uploadResult.url : undefined,
          promotionPhotoUrl: type === 'PROMOTION_PHOTO' ? uploadResult.url : undefined,
        },
      }),
    ]);

    // 6. Register audit log
    const auditAction = type === 'LOGO' ? 'BUSINESS_LOGO_UPLOADED' : 'BUSINESS_PROMOTION_PHOTO_UPLOADED';
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: auditAction,
      entityType: 'businessAsset',
      entityId: asset.id,
      newValueJson: {
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'LOGO' ? 'Logo' : 'Promotion photo'} uploaded successfully`,
      data: {
        asset,
        tenant,
      },
    });
  } catch (error) {
    console.error('Branding Upload API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload branding asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role === UserRole.PLATFORM_OWNER || !user.tenantId || !user.tenant) {
      return NextResponse.json(
        { success: false, message: 'No tenant scope associated with user' },
        { status: 400 }
      );
    }

    // Enforce active tenant context
    try {
      await assertTenantActive();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message || 'Tenant is inactive' },
        { status: 403 }
      );
    }

    // Require canManageBranding (BUSINESS_OWNER) permission
    if (!canManageBranding(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner can manage branding.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // LOGO or PROMOTION_PHOTO

    if (!type || (type !== 'LOGO' && type !== 'PROMOTION_PHOTO')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing type parameter' },
        { status: 400 }
      );
    }

    // 1. Locate current asset URL
    const currentUrl = type === 'LOGO' ? user.tenant.logoUrl : user.tenant.promotionPhotoUrl;

    if (!currentUrl) {
      return NextResponse.json(
        { success: false, message: 'No branding asset found to delete' },
        { status: 404 }
      );
    }

    // 2. Perform database delete & null the Tenant URL field inside transaction
    await prisma.$transaction([
      prisma.businessAsset.deleteMany({
        where: {
          tenantId: user.tenantId,
          type: type as BusinessAssetType,
        },
      }),
      prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          logoUrl: type === 'LOGO' ? null : undefined,
          promotionPhotoUrl: type === 'PROMOTION_PHOTO' ? null : undefined,
        },
      }),
    ]);

    // 3. Try to clean up physical file locally (fail-safe)
    try {
      const filePath = join(process.cwd(), 'public', currentUrl);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (err) {
      console.warn('Physical file deletion warning:', err);
    }

    // 4. Create Audit Log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'BUSINESS_ASSET_DELETED',
      entityType: 'tenant',
      entityId: user.tenantId,
      oldValueJson: {
        type,
        fileUrl: currentUrl,
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'LOGO' ? 'Logo' : 'Promotion photo'} deleted successfully`,
    });
  } catch (error) {
    console.error('Branding Delete API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete branding asset' },
      { status: 500 }
    );
  }
}
