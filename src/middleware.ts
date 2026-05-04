import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Se não está autenticado e tenta aceder ao dashboard
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se está autenticado, verifica se tem profile completo
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, billing_cycle_day, family_id')
      .eq('id', user.id)
      .single();

    // Se não tem profile ou billing_cycle_day não está definido, redireciona para onboarding
    if (!profile || !profile.billing_cycle_day) {
      // Evitar redirect loop
      if (request.nextUrl.pathname !== '/onboarding') {
        const onboardingUrl = new URL('/onboarding', request.url);
        onboardingUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  // Se está autenticado e vai para onboarding mas já tem profile completo
  if (user && request.nextUrl.pathname === '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, billing_cycle_day')
      .eq('id', user.id)
      .single();

    if (profile?.billing_cycle_day) {
      // Já completou onboarding, redireciona para dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
