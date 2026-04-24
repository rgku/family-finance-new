import { AIInsightItem, AIInsightsPayload } from "./types";

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: "category_not_found" | "invalid_number" | "invalid_json" | "missing_data";
  message: string;
  insightIndex: number;
}

export interface ValidationWarning {
  type: "vague" | "not_actionable" | "repetitive" | "too_long";
  message: string;
  insightIndex: number;
}

export function validateInsights(
  insights: AIInsightItem[],
  data: AIInsightsPayload
): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const validCategories = new Set([
    ...Object.keys(data.categorySpending),
    ...data.budgets.map(b => b.category),
    ...data.goals.map(g => g.name),
    "Subscriptions", // Categoria especial
  ]);
  
  const seenTitles = new Set<string>();
  
  insights.forEach((insight, idx) => {
    // Check 1: Category exists in data
    const mentionedCategories = extractCategoriesFromText(
      insight.title + " " + insight.description,
      validCategories
    );
    
    // Se não encontrou categorias válidas, pode ser insight genérico (ok)
    // Se encontrou categorias inválidas, erro
    const invalidCategories = mentionedCategories.filter(cat => !validCategories.has(cat));
    if (invalidCategories.length > 0) {
      errors.push({
        type: "category_not_found",
        message: `Categoria "${invalidCategories[0]}" não existe nos dados`,
        insightIndex: idx
      });
    }
    
    // Check 2: Numbers match data (verificação aproximada)
    const numbersInText = extractNumbers(insight.description);
    numbersInText.forEach(num => {
      if (!numberExistsInData(num, data)) {
        // Tolerância de 5% para arredondamentos
        const closeEnough = Object.values(data.categorySpending).some(v => 
          Math.abs(v - num) / Math.max(v, num) < 0.05
        ) || data.budgets.some(b => 
          Math.abs(b.spent - num) / Math.max(b.spent, num) < 0.05 ||
          Math.abs(b.limit - num) / Math.max(b.limit, num) < 0.05
        );
        
        if (!closeEnough) {
          warnings.push({
            type: "vague",
            message: `Número €${num} não corresponde exatamente aos dados`,
            insightIndex: idx
          });
        }
      }
    });
    
    // Check 3: Vague language
    const vaguePatterns = [/muito/i, /pouco/i, /bastante/i, /algum/i, /alguma/i, /vários/i, /várias/i];
    const hasVague = vaguePatterns.some(pattern => 
      pattern.test(insight.title) || pattern.test(insight.description)
    );
    
    if (hasVague) {
      warnings.push({
        type: "vague",
        message: "Linguagem vaga detetada (muito, pouco, bastante, etc.)",
        insightIndex: idx
      });
    }
    
    // Check 4: Not actionable
    const actionPatterns = [
      /reduz/i, /reduzir/i, /aumenta/i, /aumentar/i, /cancela/i, /cancelar/i,
      /verifica/i, /verificar/i, /considera/i, /considerar/i, /revisa/i, /revisar/i,
      /evita/i, /evitar/i, /mantém/i, /manter/i, /continua/i, /continuar/i
    ];
    const hasAction = actionPatterns.some(pattern => 
      pattern.test(insight.description)
    );
    
    // Insights de sucesso não precisam de ação
    if (insight.type !== "success" && !hasAction) {
      warnings.push({
        type: "not_actionable",
        message: "Insight não sugere ação concreta",
        insightIndex: idx
      });
    }
    
    // Check 5: Repetitive titles
    const normalizedTitle = insight.title.toLowerCase().trim();
    if (seenTitles.has(normalizedTitle)) {
      warnings.push({
        type: "repetitive",
        message: "Título repetido",
        insightIndex: idx
      });
    }
    seenTitles.add(normalizedTitle);
    
    // Check 6: Too long
    if (insight.title.length > 60) {
      warnings.push({
        type: "too_long",
        message: `Título com ${insight.title.length} caracteres (máx 60)`,
        insightIndex: idx
      });
    }
    
    if (insight.description.length > 150) {
      warnings.push({
        type: "too_long",
        message: `Descrição com ${insight.description.length} caracteres (máx 150)`,
        insightIndex: idx
      });
    }
  });
  
  // Check 7: No positive insights when there are positive things
  const hasPositive = insights.some(i => i.type === "success");
  const hasPositiveData = data.balance >= 0 || 
    data.budgets.some(b => b.limit > 0 && (b.spent / b.limit) < 0.8) ||
    data.goals.some(g => g.current >= g.target * 0.5);
  
  if (!hasPositive && hasPositiveData && insights.length >= 3) {
    warnings.push({
      type: "not_actionable",
      message: "Dados têm aspectos positivos mas nenhum insight de sucesso",
      insightIndex: -1
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function extractCategoriesFromText(text: string, validCategories: Set<string>): string[] {
  const found: string[] = [];
  
  validCategories.forEach(cat => {
    if (text.toLowerCase().includes(cat.toLowerCase())) {
      found.push(cat);
    }
  });
  
  return found;
}

function extractNumbers(text: string): number[] {
  const numbers: number[] = [];
  const matches = text.matchAll(/€?(\d+(?:\.\d{2})?)/g);
  
  for (const match of matches) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num > 0) {
      numbers.push(num);
    }
  }
  
  return numbers;
}

function numberExistsInData(num: number, data: AIInsightsPayload): boolean {
  // Check incomes, expenses, poupanca
  const mainNumbers = [data.income, data.expenses, data.pouparanca, data.balance];
  if (mainNumbers.some(n => Math.abs(n - num) < 1)) return true;
  
  // Check category spending
  if (Object.values(data.categorySpending).some(v => Math.abs(v - num) < 1)) return true;
  
  // Check budgets
  if (data.budgets.some(b => Math.abs(b.spent - num) < 1 || Math.abs(b.limit - num) < 1)) return true;
  
  // Check goals
  if (data.goals.some(g => Math.abs(g.current - num) < 1 || Math.abs(g.target - num) < 1)) return true;
  
  return false;
}
