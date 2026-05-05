import { AIInsightsPayload, AIForecastPayload, AIBudgetOptimizePayload, SubscriptionData } from "./types";
import { calculatePercentage } from "../currency";

const SYSTEM_PROMPT = `És assistente financeiro para famílias portuguesas.
Gera insights ACIONÁVEIS, RELEVANTES e PERSONALIZADOS.

PRINCÍPIOS:
1. Usa números e categorias EXATOS dos dados
2. Sugere ações concretas
3. NUNCA inventes dados ou categorias
4. JSON válido, sem texto extra

LÍNGUA: Português de Portugal (não brasileiro)
- "facto" não "fato", "contacto" não "contato", "poupança" não "economia"

TOM: PT-PT, amigável, profissional, direto.

FORMATO: JSON com 3-6 insights
CAMPOS: type, title (≤60 chars), description (≤150 chars)`;

export function buildInsightsPrompt(data: AIInsightsPayload): string {
  const { month, income, expenses, pouparanca, balance, categorySpending, budgets, goals, transactionsCount, previousMonthSpending, subscriptions } = data;
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, monthNum] = month.split("-").map(Number);
  const monthName = monthNames[monthNum - 1];

  const catEntries = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: €${amt.toFixed(2)}`)
    .join("\n");

  const budgetEntries = budgets.map(b => `${b.category}: €${b.spent.toFixed(2)} de €${b.limit.toFixed(2)} (${calculatePercentage(b.spent, b.limit)}%)`).join("\n");

  const goalsEntries = goals.length > 0
    ? goals.map(g => `${g.name}: €${g.current.toFixed(2)} / €${g.target.toFixed(2)} (${calculatePercentage(g.current, g.target)}%)`).join("\n")
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

  let subscriptionsSection = "";
  if (subscriptions && subscriptions.activeCount > 0) {
    subscriptionsSection = `\n\n## Subscriptions Ativas
- Total mensal: €${subscriptions.totalMonthly.toFixed(2)}
- Total anual: €${subscriptions.totalYearly.toFixed(2)}
- Ativas: ${subscriptions.activeCount}
- Zombies: ${subscriptions.zombieCount}
- Poupança potencial: €${subscriptions.potentialSavings.toFixed(2)}`;
    
    if (subscriptions.zombieInsight) {
      subscriptionsSection += `\n- Zombie: ${subscriptions.zombieInsight.name} (€${subscriptions.zombieInsight.amount.toFixed(2)}, ${subscriptions.zombieInsight.daysSinceLastCharge} dias inativo)`;
    }
  }

  // Calcular métricas adicionais para contexto
  const savingsRate = income > 0 ? ((pouparanca / income) * 100) : 0;
  const expenseRatio = income > 0 ? ((expenses / income) * 100) : 0;
  const top3Categories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat} (${Math.round((amt / (expenses || 1)) * 100)}%)`)
    .join(", ");

  const overBudgetCategories = budgets
    .filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.8)
    .map(b => `${b.category} (${Math.round((b.spent / b.limit) * 100)}%)`);

  const underBudgetCategories = budgets
    .filter(b => b.limit > 0 && (b.spent / b.limit) < 0.5)
    .map(b => `${b.category} (${Math.round((b.spent / b.limit) * 100)}%)`);

  const completedGoals = goals.filter(g => g.current >= g.target);
  const progressingGoals = goals.filter(g => g.current > 0 && g.current < g.target);

  // Dynamic Priority Context
  const criticalAlerts = [
    balance < 0 ? '⚠️ SALDO NEGATIVO' : '',
    overBudgetCategories.length > 0 ? `${overBudgetCategories.length} budgets >80%` : '',
    data.metadata?.dataQuality === 'low' ? 'Dados qualidade baixa' : '',
  ].filter(Boolean);

  return `${SYSTEM_PROMPT}

# CONTEXTO FINANCEIRO - ${monthName.toUpperCase()} ${year}

## 📊 RESUMO DO MÊS
| Métrica | Valor | Estado |
|---------|-------|--------|
| Receitas | €${income.toFixed(2)} | - |
| Despesas | €${expenses.toFixed(2)} | ${expenseRatio.toFixed(0)}% das receitas |
| Poupança | €${pouparanca.toFixed(2)} | ${savingsRate.toFixed(0)}% das receitas |
| Saldo Final | €${balance.toFixed(2)} | ${balance >= 0 ? "POSITIVO ✅" : "NEGATIVO ⚠️"} |
| Transações | ${transactionsCount} | - |

${expenses === 0 && transactionsCount === 0 ? '\n⚠️ ATENÇÃO: Sem transações registadas este mês. Insights limitados.\n' : ''}
${expenses === 0 && transactionsCount > 0 ? '\nℹ️ NOTA: Transações existentes mas sem despesas (apenas receitas ou investimentos).\n' : ''}

## 🎯 PRINCIPAIS GASTOS
Top 3 categorias: ${top3Categories || "Sem dados"}

## 💰 ESTADO DOS ORÇAMENTOS

### Quase esgotados (≥80%)
${overBudgetCategories.length > 0 ? overBudgetCategories.join("\n") : "Nenhum - todos dentro do orçamento ✅"}

### Bem geridos (<50%)
${underBudgetCategories.length > 0 ? underBudgetCategories.join("\n") : "Nenhum - todos a usar mais de 50%"}

### Detalhe completo
${budgetEntries}

## 🏦 METAS DE POUPANÇA

${goals.length > 0 ? goalsEntries : "Sem metas definidas"}

${completedGoals.length > 0 ? `✅ Metas completadas: ${completedGoals.length}` : ""}
${progressingGoals.length > 0 ? `📈 Metas em progresso: ${progressingGoals.length}` : ""}

## 📊 COMPARAÇÃO MENSAL
${comparisonSection || "Sem dados do mês anterior"}

## 📱 SUBSCRIPTIONS
${subscriptionsSection || "Sem subscriptions detetadas"}

${data.metadata ? `
## 📋 DADOS
- Qualidade: ${data.metadata.dataQuality.toUpperCase()}
- Outliers: ${data.metadata.outliersCount}
- Dia ${data.metadata.dayOfMonth}/30 (${data.metadata.daysRemaining} dias restantes)
${data.metadata.daysRemaining < 5 ? '- 🔴 FIM DO MÊS - Urgência máxima' : ''}
${data.metadata.daysRemaining > 20 ? '- 🟢 INÍCIO DO MÊS - Tempo para ajustar' : ''}
- Fim de semana: ${data.metadata.isWeekend ? 'Sim' : 'Não'}
` : ''}

${criticalAlerts.length > 0 ? `
## 🔴 PRIORIDADE MÁXIMA:
${criticalAlerts.join('\n')}
` : ''}

${data.metadata?.dataQuality === 'low' ? `
## ⚠️ QUALIDADE DE DADOS BAIXA
- Dados podem estar incompletos ou inconsistentes
- Foca nos números REAIS que tens
- Se não tens certeza, diz "Dados insuficientes"
` : ''}

## ⚠️ REGRAS CRÍTICAS
1. Usa APENAS categorias: ${data.metadata?.categoriesUsed.slice(0, 8).join(', ') || 'ver dados'}
2. NUNCA inventes números ou categorias
3. Se despesas = 0: NÃO digas "não registaste despesas" - o utilizador PODE ter despesas
4. Se dados insuficientes: diz "Dados insuficientes", NÃO adivinhes
5. Máximo 6 insights
6. NÃO repitas o mesmo insight em variações diferentes
7. Foca em dados REAIS: saldo, budgets >80%, metas, anomalias detetadas

## 🧠 PROCESSO:
1. Verifica categorias existem nos dados
2. Confirma números fazem sentido  
3. Identifica 1-3 alertas críticos
4. Identifica 1-2 padrões positivos
5. Formula insights com ações concretas
6. Atribui confiança: high (dados >3 meses), low (<1 mês)
7. Revê: categorias e números corretos?

## 📋 OUTPUT
{
  "insights": [
    {
      "type": "info" | "warning" | "success" | "tip",
      "title": "≤60 chars",
      "description": "≤150 chars com ação",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

---
Gera JSON com 3-6 insights. Foca no MAIS IMPORTANTE.`;
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
    : "Nenhum padrão recorrente.";

  const trendAnalysis = Object.entries(data.historyByCategory)
    .map(([cat, history]) => {
      if (history.length < 2) return null;
      const sorted = history.sort((a, b) => a.month.localeCompare(b.month));
      const last3Avg = sorted.slice(-3).reduce((s, h) => s + h.amount, 0) / Math.min(3, sorted.length);
      const prev3Avg = sorted.slice(0, 3).reduce((s, h) => s + h.amount, 0) / Math.min(3, sorted.length);
      const trend = last3Avg > prev3Avg ? "subindo" : last3Avg < prev3Avg ? "descendo" : "estável";
      return `${cat}: ${trend} (€${last3Avg.toFixed(2)})`;
    })
    .filter(Boolean)
    .join("\n");

  return `${SYSTEM_PROMPT}

# PREVISÃO - ${targetMonthName.toUpperCase()} ${year}

## HISTÓRICO (6 meses)
${historySection}

## RECORRENTES
${recurringSection}

## TENDÊNCIAS
${trendAnalysis || "Dados insuficientes"}

## CONTEXTO
- Mês: ${targetMonthName} ${year}
- Ciclo: dia ${data.billingCycleDay}

## MÉTODO
1. Média 3 meses + tendência
2. Confiança: high (>3 meses), low (<3)
3. Sazonalidade: Dezembro +, Setembro +, Agosto -
4. Intervalos: ±15-20%

## OUTPUT
{
  "forecasts": [{
    "category": "Nome EXATO",
    "predictedAmount": € (2 decimais),
    "confidenceLow": -15%,
    "confidenceHigh": +20%,
    "reasoning": "≤120 chars",
    "trend": "up" | "down" | "stable",
    "changePercent": número
  }],
  "summary": {
    "totalPredicted": soma,
    "confidenceLow/High": somas,
    "narrative": "1-2 frases"
  }
}

## REGRAS
- TODAS categorias com histórico
- NUNCA inventes categorias
- Conservador: subestima > sobrestima
- <3 meses: usa média, nota no reasoning

Ex: "Tendência alta 3 meses. Média €145."

Gera previsão para ${targetMonthName} ${year}.`;
}

export function buildOptimizePrompt(data: AIBudgetOptimizePayload): string {
  const budgetEntries = data.currentBudgets
    .map(b => `${b.category}: €${b.spent} de €${b.limit} (${calculatePercentage(b.spent, b.limit)}%)`)
    .join("\n");

  const goalsEntries = data.goals.map(g => `${g.name}: €${g.current} / €${g.target}`).join("\n");

  const totalBudget = data.currentBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = data.currentBudgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const freeIncome = data.totalIncome - totalBudget;

  const overBudget = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) > 1);
  const underBudget = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) < 0.5);
  const optimal = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.5 && (b.spent / b.limit) <= 1);

  return `${SYSTEM_PROMPT}

# OTIMIZAÇÃO DE BUDGETS

## VISÃO GERAL
| Métrica | Valor |
|---------|-------|
| Receitas | €${data.totalIncome} |
| Budgets | €${totalBudget} |
| Gasto | €${totalSpent} |
| Restante | €${remaining} |
| Utilização | ${budgetUtilization.toFixed(0)}% |
| Livre | €${freeIncome} |

## BUDGETS

### Crítico (>100%) ⚠️
${overBudget.length > 0 ? overBudget.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : 'Nenhum ✅'}

### Ótimo (50-100%) ✅
${optimal.length > 0 ? optimal.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : 'Nenhum'}

### Ajustar (<50%) 💡
${underBudget.length > 0 ? underBudget.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : 'Nenhum'}

### Detalhe
${budgetEntries}

## METAS
${goalsEntries}

## OBJETIVO
Ajusta budgets para:
1. Evitar estouros
2. Reduzir desperdício
3. Maximizar metas
4. Considerar trade-offs

## CRITÉRIOS

### AUMENTA se:
- >90% consistentemente (3+ meses)
- Essencial (Alimentação, Moradia, Saúde)
- Previne impacto nas metas

### REDUZ se:
- <50% consistentemente
- Liberta € para metas importantes
- Não-essencial com histórico baixo

### NÃO mudes se:
- Variação <5%
- Estável 70-90%
- Sem benefício significativo

## OUTPUT
{
  "suggestions": [{
    "category": "Nome EXATO",
    "currentLimit": €,
    "suggestedLimit": €,
    "reason": "≤100 chars com dados",
    "impactOnGoals": "≤100 chars"
  }],
  "summary": "≤150 chars"
}

## REGRAS
- Máx 5 sugestões
- Só se >5% melhoria
- Específico: "reduz €50" não "reduz um pouco"
- Justifica com dados: "média 3 meses: €120"
- Prioridades: 1º evitar estouros, 2º metas, 3º otimizar

Ex bom: {category: "Lazer", currentLimit: 200, suggestedLimit: 150, reason: "Média 3 meses: €110", impactOnGoals: "Liberta €50 para Férias"}
Ex mau: {reason: "Podes poupar um pouco"} (vago)

Gera otimizações REAIS e ACIONÁVEIS.`;
}