import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { canManageStaff } from '@/lib/permissions';
import { assertTenantActive } from '@/lib/tenant';
import { uploadFile } from '@/lib/upload';

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

    // 2. Require canManageStaff (BUSINESS_OWNER, MANAGER) permission
    if (!canManageStaff(user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Business Owner or Manager can manage staff.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File is required' },
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

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Avatar file size exceeds the 2MB limit.' },
        { status: 400 }
      );
    }

    // 4. Upload file locally
    const uploadResult = await uploadFile(file, user.tenantId, 'avatar');

    return NextResponse.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Staff Avatar Upload API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload staff avatar' },
      { status: 500 }
    );
  }
}
