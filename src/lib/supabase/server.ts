import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

console.log("=== SUPABASE CONFIG DEBUG ===");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("ANON_KEY present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("ANON_KEY starts with:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 30));
console.log("SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("SERVICE_ROLE_KEY starts with:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30));
console.log("=== END SUPABASE CONFIG DEBUG ===");

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

export async function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return [] },
      setAll() { },
    },
  })
}