export const CATEGORY_COLORS: Record<string, string> = {
  Moradia: "#8b5cf6",
  Alimentação: "#22c55e",
  Transporte: "#06b6d4",
  Lazer: "#ec4899",
  Saúde: "#f43f5e",
  Educação: "#eab308",
  "Bem estar": "#14b8a6",
  Restauração: "#f97316",
  Renda: "#10b981",
  Salário: "#f59e0b",
  Investimentos: "#0d9488",
  Outros: "#64748b",
};

export const COLORS_PALETTE = [
  "#8b5cf6",
  "#22c55e",
  "#06b6d4",
  "#ec4899",
  "#f43f5e",
  "#eab308",
  "#14b8a6",
  "#f97316",
  "#10b981",
  "#f59e0b",
  "#0d9488",
  "#64748b",
];

function normalizeCategory(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getCategoryColor(category: string, index?: number): string {
  const normalized = normalizeCategory(category);
  
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  
  const lowerMatch = Object.entries(CATEGORY_COLORS).find(
    ([key]) => key.toLowerCase() === category.toLowerCase()
  );
  if (lowerMatch) return lowerMatch[1];
  
  const noAccentMatch = Object.entries(CATEGORY_COLORS).find(
    ([key]) => normalizeCategory(key) === normalized
  );
  if (noAccentMatch) return noAccentMatch[1];
  
  return COLORS_PALETTE[index ?? 0] || COLORS_PALETTE[0];
}