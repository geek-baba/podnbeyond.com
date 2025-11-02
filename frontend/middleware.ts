import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

    // Get session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not authenticated - redirect to login
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Check if user has admin-level role
    const userRoles = (token as any).roles || [];
    const hasAdminRole = userRoles.some((role: any) => 
      ADMIN_ROLES.includes(role.key)
    );

    if (!hasAdminRole) {
      // User is authenticated but doesn't have admin access
      return NextResponse.redirect(new URL('/admin/forbidden', request.url));
    }

    // Authorized - proceed
    return NextResponse.next();
  }

  // Protect /account routes (member area)
  if (pathname.startsWith('/account')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
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

