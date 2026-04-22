import { AI_PROVIDER_CONFIG } from "./types";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqCompletionOptions {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

async function callGroq(options: GroqCompletionOptions): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não configurada");
  }

  const { messages, model, temperature, maxTokens, jsonMode } = {
    ...{
      model: AI_PROVIDER_CONFIG.groq.model,
      temperature: AI_PROVIDER_CONFIG.groq.temperature,
      maxTokens: AI_PROVIDER_CONFIG.groq.maxTokens,
      jsonMode: false,
    },
    ...options,
  };

  const response = await fetch(`${AI_PROVIDER_CONFIG.groq.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function groqChat(options: GroqCompletionOptions): Promise<string> {
  try {
    return await callGroq(options);
  } catch (error) {
    console.error("Groq API call failed:", error);
    throw error;
  }
}

export async function groqChatJSON<T = unknown>(options: GroqCompletionOptions): Promise<T> {
  const content = await groqChat({ ...options, jsonMode: true });
  
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse Groq JSON response: ${content.substring(0, 200)}`);
  }
}