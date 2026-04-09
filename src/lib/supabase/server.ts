import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found in environment')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl || 'https://ziyriwdkgankrbmsjvhk.supabase.co',
    supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeXJpd2RrZ2Fua3JibXNqdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mjg2MTUsImV4cCI6MjA5MTMwNDYxNX0.ukeAK91Nf13jL6LDhw8mrPrUlb98743BqyRn7Ns1UIA',
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