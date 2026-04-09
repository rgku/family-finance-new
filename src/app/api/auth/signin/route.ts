import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Get the session and set cookies
    if (data.session) {
      const { access_token, refresh_token } = data.session;

      // Set cookies for the client
      const response = NextResponse.json({ 
        user: data.user, 
        session: data.session 
      });

      response.cookies.set('sb-access-token', access_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      response.cookies.set('sb-refresh-token', refresh_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      return response;
    }

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (error: any) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}