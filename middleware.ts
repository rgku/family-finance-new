import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Skip auth check for static files and API health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.')
  ) {
    return response;
  }

  try {
    const supabase = createServerClient(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Check authentication status
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Auth error in middleware:', error.message);
    }

    // Define public routes that don't require authentication
    const isPublicRoute = 
      pathname === '/' ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api/auth') ||
      pathname === '/forgot-password' ||
      pathname === '/dashboard/settings/reset-password';

    // Redirect unauthenticated users trying to access protected routes
    if (!user && !isPublicRoute && pathname.startsWith('/dashboard')) {
      console.log('🔒 Unauthorized access to:', pathname);
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For authenticated users accessing auth pages, redirect to dashboard
    if (user && (pathname === '/' || pathname === '/forgot-password')) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow request to proceed (fail open for availability)
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}