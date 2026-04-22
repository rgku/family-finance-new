import { AIInsightsPayload, AIForecastPayload, AIBudgetOptimizePayload } from "./types";

const SYSTEM_PROMPT = `Eres un asistente de finanzas personales para famílias portuguesas. Analisas datos financieros y generas insights útiles, previsões e sugestões em português de Portugal.`;

export function buildInsightsPrompt(data: AIInsightsPayload): string {
  const { month, income, expenses, pouparanca, balance, categorySpending, budgets, goals, transactionsCount, previousMonthSpending } = data;
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, monthNum] = month.split("-").map(Number);
  const monthName = monthNames[monthNum - 1];

  const catEntries = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: €${amt.toFixed(2)}`)
    .join("\n");

  const budgetEntries = budgets.map(b => `${b.category}: €${b.spent.toFixed(2)} de €${b.limit.toFixed(2)} (${b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0}%)`).join("\n");

  const goalsEntries = goals.length > 0
    ? goals.map(g => `${g.name}: €${g.current.toFixed(2)} / €${g.target.toFixed(2)} (${Math.round((g.current / g.target) * 100)}%)`).join("\n")
    : "Sem metas definidas";

  const prevEntries = previousMonthSpending
    ? Object.entries(previousMonthSpending)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `${cat}: €${amt.toFixed(2)}`)
        .join("\n")
    : null;

  let comparisonSection = "";
  if (prevEntries) {
    comparisonSection = `\n\n## Gastos Mês Anterior (${monthName} ${year - 1})
${prevEntries}`;
  }

return `${SYSTEM_PROMPT}

## Dados do Mês: ${monthName} ${year}
- Total de transações: ${transactionsCount}
- Receitas: €${income.toFixed(2)}
- Despesas: €${expenses.toFixed(2)}
- Poupança: €${pouparanca.toFixed(2)} (metas de poupança + investimentos)
- Saldo: €${balance.toFixed(2)} = Receitas - Despesas - Poupança
 ${balance >= 0 ? "Estado: POSITIVO ✅" : "Estado: NEGATIVO ⚠️"}

## Despesas por Categoria
${catEntries}

## Estado dos Orçamentos
${budgetEntries}

## Metas da Família
${goalsEntries}
${comparisonSection}

## Instruções
Gera um JSON com exactamente este formato:
{
  "insights": [
    {
      "type": "info" | "warning" | "success" | "tip",
      "title": "Título curto (máx 60 caracteres)",
      "description": "Descrição detalhada em 1-2 frases (máx 150 caracteres)"
    }
  ]
}

Regras:
- Gera entre 3 e 6 insights.
- "type" indica o tom: "success" para positivas, "warning" para alertas, "info" para informativas, "tip" para sugestões de poupança.
- Deteta anomalias: gastos >30% acima da média numa categoria vs mês anterior.
- Deteta alertas de orçamento: categorias a ultrapassar 80% do orçamento.
- Deteta padrões positivos: savings rate bom, metas progredindo bem.
- Todos os campos são obrigatórios.
- Responde SOMENTE com JSON válido, sem texto antes ou depois.`;
}

export function buildForecastPrompt(data: AIForecastPayload): string {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, monthNum] = data.targetMonth.split("-").map(Number);
  const targetMonthName = monthNames[monthNum - 1];

  const historySection = Object.entries(data.historyByCategory)
    .map(([cat, history]) => {
      const historyStr = history
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(h => {
          const [y, m] = h.month.split("-").map(Number);
          return `${monthNames[m - 1]} ${y}: €${h.amount.toFixed(2)}`;
        })
        .join(" | ");
      return `${cat}: [${historyStr}]`;
    })
    .join("\n");

  const recurringSection = data.recurringPatterns.length > 0
    ? data.recurringPatterns.map(p => `${p.description}: €${p.amount.toFixed(2)} (${p.frequency})`).join("\n")
    : "Nenhum padrão recorrente detetado.";

  return `${SYSTEM_PROMPT}

## Histórico de Gastos (últimos 6 meses)
${historySection}

## Padrões Recorrentes Detetados
${recurringSection}

## Previsão para: ${targetMonthName} ${year}
Ciclo de faturação: dia ${data.billingCycleDay}

## Instruções
Gera um JSON com exactamente este formato:
{
  "forecasts": [
    {
      "category": "Nome da categoria",
      "predictedAmount": número em euros (2 decimais),
      "confidenceLow": número menor que predictedAmount,
      "confidenceHigh": número maior que predictedAmount,
      "reasoning": "Breve explicação do padrão detetado (máx 100 caracteres)",
      "trend": "up" | "down" | "stable",
      "changePercent": número percentual (pode ser negativo)
    }
  ],
  "summary": {
    "totalPredicted": número,
    "confidenceLow": número,
    "confidenceHigh": número,
    "narrative": "Parágrafo de 1-2 frases sobre a tendência geral"
  }
}

Regras:
- Analisa a tendência histórica (últimos 3-6 meses) para cada categoria.
- Inclui TODAS as categorias com histórico, mesmo as com poucos dados.
- Se uma categoria está a aumentar, usa trend="up" e changePercent positivo.
- confidenceLow/High devem ser ±10-20% do predictedAmount.
- predictedAmount = média ponderada dos últimos 3 meses + tendência.
- Responde SOMENTE com JSON válido.`;
}

export function buildOptimizePrompt(data: AIBudgetOptimizePayload): string {
  const budgetEntries = data.currentBudgets
    .map(b => `${b.category}: €${b.spent.toFixed(2)} gastos de €${b.limit.toFixed(2)} budget (${b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0}%)`)
    .join("\n");

  const goalsEntries = data.goals.map(g => `${g.name}: €${g.current.toFixed(2)} / €${g.target.toFixed(2)}`).join("\n");

  return `${SYSTEM_PROMPT}

## Orçamentos Atuais
${budgetEntries}

## Metas da Família
${goalsEntries}

## Receitas Mensais
€${data.totalIncome.toFixed(2)}

## Instruções
Gera um JSON com exactamente este formato:
{
  "suggestions": [
    {
      "category": "Nome da categoria",
      "currentLimit": número,
      "suggestedLimit": número,
      "reason": "Razão curta (máx 80 caracteres)",
      "impactOnGoals": "Como isto afeta as metas (máx 80 caracteres)"
    }
  ],
  "summary": "Parágrafo geral sobre a situação orçamental (máx 150 caracteres)"
}

Regras:
- Só sugere alterações se houver节约 potencial significativo (>5%).
- Se uma categoria está consistentemente abaixo do budget, sugere reduzir.
- Se uma categoria estoura o budget, sugere aumentar.
- Leva em conta o impacto nas metas de poupança.
- Máximo 5 sugestões.
- Responde SOMENTE com JSON válido.`;
}