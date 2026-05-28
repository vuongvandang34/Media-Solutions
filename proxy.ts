import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-secure-secret-default-key-321';

// Edge-safe JWT decoding
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

// Edge-safe HMAC SHA-256 signature verification
async function verifySignature(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url signature back to ArrayBuffer
    const sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigBinaryString = atob(sigBase64);
    const sigBytes = new Uint8Array(sigBinaryString.length);
    for (let i = 0; i < sigBinaryString.length; i++) {
      sigBytes[i] = sigBinaryString.charCodeAt(i);
    }

    const dataBuf = encoder.encode(data);
    return await crypto.subtle.verify('HMAC', key, sigBytes.buffer, dataBuf);
  } catch (e) {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const token = cookies.get('auth_token')?.value;

  let isValidSession = false;
  let userPayload: any = null;

  if (token) {
    const isSignatureValid = await verifySignature(token, JWT_SECRET);
    if (isSignatureValid) {
      userPayload = decodeJWT(token);
      if (userPayload && userPayload.userId) {
        isValidSession = true;
      }
    }
  }

  const isAuthPage =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/register' ||
    nextUrl.pathname === '/forgot-password' ||
    nextUrl.pathname === '/reset-password';

  // 1. Unauthenticated users trying to access protected dashboards
  if (!isValidSession) {
    if (!isAuthPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Authenticated users trying to access authentication pages
  if (isAuthPage) {
    if (userPayload.role === 'PLATFORM_OWNER') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Role-based route protection
  if (nextUrl.pathname.startsWith('/super-admin')) {
    if (userPayload.role !== 'PLATFORM_OWNER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/onboarding')) {
    if (userPayload.role === 'PLATFORM_OWNER') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/super-admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
