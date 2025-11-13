import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which roles can access admin routes
const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'STAFF_FRONTDESK', 'STAFF_OPS'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except login pages)
  if (pathname.startsWith('/admin')) {
    // Allow login, logout, verify pages
    if (
      pathname === '/admin/login' ||
      pathname === '/admin/logout' ||
      pathname === '/admin/verify-email' ||
      pathname === '/admin/forbidden'
    ) {
      return NextResponse.next();
    }

    // In local development, we can't check localStorage from middleware (it's server-side)
    // So we'll let all admin routes through and rely on client-side auth checks
    // In production, we check for the httpOnly cookie
    const podSession = request.cookies.get('pod-session');
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && !podSession) {
      // Not authenticated in production - redirect to login
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Local dev or session exists - allow access
    // The backend validates the session on each API call
    return NextResponse.next();
  }

  // Protect /account routes (member area)
  if (pathname.startsWith('/account')) {
    const podSession = request.cookies.get('pod-session');

    if (!podSession) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
  ],
};
