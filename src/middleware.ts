import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/public',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Dashboard routes will handle auth checks on the client side
  // (using localStorage which middleware can't access)
  if (path.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // For other protected routes, check for token in cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
