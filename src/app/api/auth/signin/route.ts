import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] 
      || request.headers.get("x-real-ip") 
      || "unknown";
    
    const supabase = await createClient();
    
    // Check rate limit using database function
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc(
      'check_rate_limit',
      { p_ip: clientIP }
    );

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (rateLimitData && rateLimitData.length > 0 && !rateLimitData[0].allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 8 caracteres, uma maiúscula e um número" },
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

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (error: unknown) {
    console.error("Signin error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}