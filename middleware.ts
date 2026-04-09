import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              request.cookies.set(name, value)
            }
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )

  // Refresh the session
  const { data: { user } } = await supabase.auth.getUser()

  // Allow access to auth routes, api routes, and static files
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isStaticFile = request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico)$/)

  if (!user && !isAuthRoute && !isApiRoute && !isStaticFile) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}