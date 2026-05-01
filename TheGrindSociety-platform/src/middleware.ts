import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;
  const role = token?.role as string | undefined;

  if (!token) {
    if (path.startsWith('/admin') || path.startsWith('/trainer') || path.startsWith('/client')) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  // /trainer/apply is open to any logged-in user (clients use it to upgrade).
  if (path.startsWith('/trainer') && path !== '/trainer/apply' && role !== 'trainer' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/trainer/:path*', '/client/:path*', '/progress/:path*', '/workout/:path*'],
};
