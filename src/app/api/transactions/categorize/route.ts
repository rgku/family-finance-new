import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_URL = "https://api.cohere.com/v1/classify";

const CATEGORIES = [
  "Moradia", "Alimentação", "Transporte", "Lazer", 
  "Saúde", "Educação", "Renda", "Outros"
];

const KEYWORD_MAP: Record<string, string[]> = {
  'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'energia', 'iptu', 'renda', 'casa', 'apartamento'],
  'Alimentação': ['supermercado', 'mercado', 'comida', 'restaurante', 'lanchonete', 'padaria', 'pão', 'alimentação'],
  'Transporte': ['combustível', 'gasolina', 'uber', '99', 'taxi', 'ônibus', 'metro', 'estacionamento', 'carro', 'bolso'],
  'Lazer': ['netflix', 'spotify', 'cinema', 'show', 'bar', 'lazer', 'praia', 'jogo', 'streaming'],
  'Saúde': ['farmácia', 'médico', 'hospital', 'consulta', 'exame', 'plano de saúde', 'saúde', 'dentista'],
  'Educação': ['escola', 'universidade', 'curso', 'livro', 'material', 'educação', 'formação'],
  'Renda': ['salário', 'freela', 'provento', 'aluguel recebido', 'renda', 'ordenado', 'bonus'],
};

function categorizeByKeyword(description: string): { category: string, confidence: string } {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return { category, confidence: "0.85" };
      }
    }
  }
  
  return { category: "Outros", confidence: "0.50" };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      );
    }

    if (COHERE_API_KEY && COHERE_API_KEY.length > 10) {
      try {
        const response = await fetch(COHERE_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: [description],
            labels: CATEGORIES,
            output_mode: "single",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.results?.[0];
          const predictedCategory = result?.predicted_label || "Outros";
          const confidence = result?.confidences?.[0]?.confidence || 0;

          return NextResponse.json({
            category: predictedCategory,
            confidence: confidence.toFixed(2),
          });
        }
      } catch {
        console.warn("Cohere API failed, using keyword fallback");
      }
    }

    const result = categorizeByKeyword(description);
    return NextResponse.json(result);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Categorization error:", errorMessage);
    // Don't expose error details to client
    return NextResponse.json(
      { category: "Outros", confidence: "0.50" },
      { status: 200 }
    );
  }
}