import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Session } from '@supabase/supabase-js'
import { metricsCollector } from '@/lib/metrics'

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const SESSION_CACHE_TTL = 5 * 60 * 1000;

function getCachedSession(request: NextRequest): { session: Session | null, timestamp: number } | null {
  try {
    const cachedData = request.cookies.get('sb-session-cache')?.value;
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    return {
      session: parsed.session,
      timestamp: parsed.timestamp
    };
  } catch {
    return null;
  }
}

function setCachedSession(response: NextResponse, session: Session | null) {
  const cacheData = {
    session,
    timestamp: Date.now()
  };
  response.cookies.set('sb-session-cache', JSON.stringify(cacheData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_CACHE_TTL / 1000,
    path: '/'
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const startTime = Date.now();
  
  console.log(`\n🔍 [MIDDLEWARE ${timestamp}] Request: ${pathname}`);
  
  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Skip auth check for static files and API health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname === '/manifest.json' ||
    pathname.includes('.')
  ) {
    console.log(`✅ [MIDDLEWARE ${timestamp}] Skipping static/health: ${pathname}`);
    return response;
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/forgot-password',
    '/dashboard/settings/reset-password', // Public because it validates token from email link
  ];

  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    publicRoutes.includes(pathname);

  console.log(`🔍 [MIDDLEWARE ${timestamp}] Route type: ${isPublicRoute ? 'PUBLIC' : 'PROTECTED'}`);

  // For public routes, no need to check auth
  if (isPublicRoute) {
    console.log(`✅ [MIDDLEWARE ${timestamp}] Public route allowed: ${pathname}`);
    return response;
  }

  // ALL non-public routes require authentication
  // This includes ALL /dashboard/* routes except /dashboard/settings/reset-password
  if (pathname.startsWith('/dashboard')) {
    console.log(`🛡️ [MIDDLEWARE ${timestamp}] Dashboard route detected: ${pathname}`);
  }

  let isAuthorized = false;

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

    console.log(`🔑 [MIDDLEWARE ${timestamp}] Checking auth for: ${pathname}`);

    let session: Session | null = null;
    let error: any = null;
    let supabaseResponseTime = 0;

    const cached = getCachedSession(request);
    const cacheValid = cached && (Date.now() - cached.timestamp < SESSION_CACHE_TTL);

    if (cacheValid && cached.session) {
      console.log(`💾 [MIDDLEWARE ${timestamp}] Using cached session`);
      session = cached.session;
    } else {
      console.log(`🔄 [MIDDLEWARE ${timestamp}] Validating session with Supabase`);
      const supabaseStart = Date.now();
      const result = await supabase.auth.getSession();
      supabaseResponseTime = Date.now() - supabaseStart;
      session = result.data.session;
      error = result.error;
      setCachedSession(response, session);
    }

    const user = session?.user;

    // Log auth check for debugging
    console.log('🔐 [MIDDLEWARE] Auth result:', {
      pathname,
      hasUser: !!user,
      userId: user?.id,
      sessionValid: !!session,
      cacheUsed: cacheValid,
      supabaseResponseTime: cacheValid ? 'cache' : `${supabaseResponseTime}ms`,
      errorCode: error?.status,
      errorMessage: error?.message,
    });

    // If user is authenticated
    if (user && session) {
      isAuthorized = true;
      const totalTime = Date.now() - startTime;
      console.log(`✅ [MIDDLEWARE ${timestamp}] AUTHORIZED user: ${user.id} for: ${pathname} (total: ${totalTime}ms)`);
      
      metricsCollector.record({
        pathname,
        timestamp,
        authStatus: 'authorized',
        cacheUsed: !!cacheValid,
        supabaseResponseTime: cacheValid ? 0 : supabaseResponseTime,
        totalResponseTime: totalTime,
        userId: user.id,
      });
      
      // For authenticated users accessing auth pages, redirect to dashboard
      if (pathname === '/' || pathname === '/forgot-password') {
        const dashboardUrl = new URL('/dashboard', request.url);
        console.log(`🔄 [MIDDLEWARE ${timestamp}] Redirecting authenticated user to dashboard`);
        return NextResponse.redirect(dashboardUrl);
      }
    } else {
      // User is not authenticated
      const totalTime = Date.now() - startTime;
      console.log(`🔒 [MIDDLEWARE ${timestamp}] UNAUTHORIZED - no user for: ${pathname} (total: ${totalTime}ms)`);
      console.log(`   Error: ${error?.message || 'No session'}`);
      console.log(`   Redirecting to login with redirect=${pathname}`);
      
      metricsCollector.record({
        pathname,
        timestamp,
        authStatus: 'unauthorized',
        cacheUsed: !!cacheValid,
        supabaseResponseTime: cacheValid ? 0 : supabaseResponseTime,
        totalResponseTime: totalTime,
        errorCode: error?.status?.toString(),
        errorMessage: error?.message || 'No session',
      });
      
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [MIDDLEWARE ${timestamp}] Allowing access to: ${pathname} (total: ${totalTime}ms)`);
    return response;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorType = error instanceof Error ? error.message : 'Unknown error';
    const isSupabaseError = errorType.includes('fetch') || errorType.includes('network') || errorType.includes('timeout');
    
    console.error(`❌ [MIDDLEWARE ${timestamp}] Error:`, error);
    console.log(`   Error type: ${isSupabaseError ? 'SUPABASE_UNAVAILABLE' : 'AUTH_ERROR'}`);
    console.log(`   Total time: ${totalTime}ms`);
    
    metricsCollector.record({
      pathname,
      timestamp,
      authStatus: 'error',
      cacheUsed: false,
      totalResponseTime: totalTime,
      errorCode: error instanceof Error ? error.name : 'Unknown',
      errorMessage: errorType,
    });
    
    // On Supabase unavailable, log metric but still deny access
    if (isSupabaseError) {
      console.warn(`⚠️ [MIDDLEWARE ${timestamp}] Supabase unavailable - denying access to protected route: ${pathname}`);
      console.log(`   This is expected behavior - do not allow access when auth system is down`);
    }
    
    // On ANY error, treat as unauthorized for protected routes
    // This prevents access when auth system fails
    console.log(`🔒 [MIDDLEWARE ${timestamp}] Error - denying access to: ${pathname}`);
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}