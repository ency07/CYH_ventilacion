import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect /crm and all sub-routes
  if (path.startsWith('/crm')) {
    const sessionCookie = request.cookies.get('cyh-crm-session');
    
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', path);
      return NextResponse.redirect(url);
    }
  }

  // If already logged in, do not allow visiting /login
  if (path === '/login') {
    const sessionCookie = request.cookies.get('cyh-crm-session');
    
    if (sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/crm';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
