import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/public',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if user has auth token
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
