import { NextRequest, NextResponse } from "next/server";

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_URL = "https://api.cohere.com/v1/classify";

const CATEGORIES = [
  "Moradia", "Alimentação", "Transporte", "Lazer", 
  "Saúde", "Educação", "Renda", "Outros"
];

export async function POST(request: NextRequest) {
  try {
    if (!COHERE_API_KEY) {
      return NextResponse.json(
        { error: "API key não configurada" },
        { status: 500 }
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

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    
    const result = data.results?.[0];
    const predictedCategory = result?.predicted_label || "Outros";
    const confidence = result?.confidences?.[0]?.confidence || 0;

    return NextResponse.json({
      category: predictedCategory,
      confidence: confidence.toFixed(2),
    });
  } catch (error) {
    console.error("Categorization error:", error);
    return NextResponse.json(
      { error: "Erro ao categorizar transação" },
      { status: 500 }
    );
  }
}