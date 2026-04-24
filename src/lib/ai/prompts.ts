import { AIInsightsPayload, AIForecastPayload, AIBudgetOptimizePayload, SubscriptionData } from "./types";
import { calculatePercentage } from "../currency";

const SYSTEM_PROMPT = `És um assistente financeiro especializado em finanças pessoais para famílias portuguesas.
Gera insights ACIONÁVEIS, RELEVANTES e PERSONALIZADOS.

PRINCÍPIOS:
1. Usa números EXATOS dos dados
2. Usa categorias EXATAS dos dados  
3. Sugere ações concretas
4. Não inventes dados ou categorias
5. JSON válido, sem texto extra

TOM: PT-PT, amigável, profissional, direto.`;

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
    .map(([cat, amt]) => `${cat} (${Math.round((amt / expenses) * 100)}%)`)
    .join(", ");

  const overBudgetCategories = budgets
    .filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.8)
    .map(b => `${b.category} (${Math.round((b.spent / b.limit) * 100)}%)`);

  const underBudgetCategories = budgets
    .filter(b => b.limit > 0 && (b.spent / b.limit) < 0.5)
    .map(b => `${b.category} (${Math.round((b.spent / b.limit) * 100)}%)`);

  const completedGoals = goals.filter(g => g.current >= g.target);
  const progressingGoals = goals.filter(g => g.current > 0 && g.current < g.target);

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
## 📋 QUALIDADE DOS DADOS
- Qualidade: ${data.metadata.dataQuality.toUpperCase()}
- Outliers: ${data.metadata.outliersCount}
- Dia do mês: ${data.metadata.dayOfMonth} (${data.metadata.daysRemaining} dias restantes)
- Fim de semana: ${data.metadata.isWeekend ? "Sim" : "Não"}
` : ""}

## ⚠️ REGRAS CRÍTICAS
1. Usa APENAS estas categorias: ${data.metadata?.categoriesUsed.join(", ") || "ver dados acima"}
2. NUNCA inventes números ou categorias
3. Se dados faltam, diz "Sem dados" não inventes
4. Máximo 6 insights

## 🧠 PROCESSO (antes de responder):
1. Verifica categorias existem nos dados
2. Confirma números fazem sentido  
3. Identifica 1-3 alertas críticos
4. Identifica 1-2 padrões positivos
5. Formula insights com ações concretas
6. Revê: categorias e números corretos?

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
    : "Nenhum padrão recorrente detetado.";

  // Calcular tendências por categoria
  const trendAnalysis = Object.entries(data.historyByCategory)
    .map(([cat, history]) => {
      if (history.length < 2) return null;
      const sorted = history.sort((a, b) => a.month.localeCompare(b.month));
      const last3Avg = sorted.slice(-3).reduce((s, h) => s + h.amount, 0) / Math.min(3, sorted.length);
      const prev3Avg = sorted.slice(0, 3).reduce((s, h) => s + h.amount, 0) / Math.min(3, sorted.length);
      const trend = last3Avg > prev3Avg ? "subindo" : last3Avg < prev3Avg ? "descendo" : "estável";
      return `${cat}: ${trend} (média recente: €${last3Avg.toFixed(2)})`;
    })
    .filter(Boolean)
    .join("\n");

  return `${SYSTEM_PROMPT}

# PREVISÃO FINANCEIRA - ${targetMonthName.toUpperCase()} ${year}

## 📊 HISTÓRICO DE GASTOS (Últimos 6 Meses)

${historySection}

## 🔄 PADRÕES RECORRENTES DETETADOS

${recurringSection}

## 📈 ANÁLISE DE TENDÊNCIAS

${trendAnalysis || "Dados insuficientes para análise de tendências"}

## 📅 CONTEXTO

- Mês alvo: ${targetMonthName} ${year}
- Ciclo de faturação: dia ${data.billingCycleDay}
- Tipo de previsão: gastos por categoria

---

# INSTRUÇÕES DE PREVISÃO

## METODOLOGIA:

1. **Para cada categoria com histórico**:
   - Calcula média dos últimos 3 meses
   - Pondera meses mais recentes (mais peso)
   - Considera tendência (subindo/descendo/estável)
   - Ajusta para sazonalidade se relevante

2. **Intervalos de confiança**:
   - confidenceLow: cenário otimista (-15% da previsão)
   - confidenceHigh: cenário pessimista (+20% da previsão)
   - Justifica no "reasoning"

3. **Tendência**:
   - "up": categoria a aumentar consistentemente
   - "down": categoria a diminuir
   - "stable": sem mudança significativa (<5%)

4. **Muda percentual**:
   - Compara previsão com média dos últimos 3 meses
   - Pode ser negativa (ex: -12.5)

## FORMATO DE SAÍDA

{
  "forecasts": [
    {
      "category": "Nome EXATO da categoria",
      "predictedAmount": número (2 decimais),
      "confidenceLow": número (menor que predictedAmount),
      "confidenceHigh": número (maior que predictedAmount),
      "reasoning": "Explicação clara da previsão (máx 120 caracteres)",
      "trend": "up" | "down" | "stable",
      "changePercent": número (pode ser negativo, 1 decimal)
    }
  ],
  "summary": {
    "totalPredicted": soma de todos predictedAmount,
    "confidenceLow": soma de todos confidenceLow,
    "confidenceHigh": soma de todos confidenceHigh,
    "narrative": "Visão geral em 1-2 frases sobre o mês previsto"
  }
}

## REGRAS:

1. **Inclui TODAS as categorias** com histórico (mesmo as pequenas)
2. **NUNCA inventes categorias** - usa apenas as do histórico
3. **Sê conservador** - melhor subestimar que sobrestimar
4. **Considera sazonalidade**:
   - Dezembro: +gastos (Natal, festas)
   - Setembro: +gastos (regresso às aulas)
   - Agosto: -gastos (férias, menos rotinas)
5. **Justifica previsões fora do padrão** no reasoning
6. **Se dados insuficientes** (<3 meses), usa média disponível e nota no reasoning

## EXEMPLO DE BOM REASONING:

✅ "Tendência de alta há 3 meses. Média ponderada: €145."
✅ "Estável nos últimos 4 meses. Pequeno ajuste para inflação."
❌ "Acho que vai subir." (vago, sem justificação)

Gera agora a previsão completa para ${targetMonthName} ${year}.`;
}

export function buildOptimizePrompt(data: AIBudgetOptimizePayload): string {
  const budgetEntries = data.currentBudgets
    .map(b => `${b.category}: €${b.spent.toFixed(2)} gastos de €${b.limit.toFixed(2)} budget (${calculatePercentage(b.spent, b.limit)}%)`)
    .join("\n");

  const goalsEntries = data.goals.map(g => `${g.name}: €${g.current.toFixed(2)} / €${g.target.toFixed(2)}`).join("\n");

  // Calcular métricas de otimização
  const totalBudget = data.currentBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = data.currentBudgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const overBudget = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) > 1);
  const underBudget = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) < 0.5);
  const optimal = data.currentBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.5 && (b.spent / b.limit) <= 1);

  // Calcular receita disponível após budgets
  const freeIncome = data.totalIncome - totalBudget;

  return `${SYSTEM_PROMPT}

# OTIMIZAÇÃO DE ORÇAMENTO

## 📊 VISÃO GERAL

| Métrica | Valor |
|---------|-------|
| Receitas Mensais | €${data.totalIncome.toFixed(2)} |
| Total Budgets | €${totalBudget.toFixed(2)} |
| Total Gasto | €${totalSpent.toFixed(2)} |
| Restante | €${remaining.toFixed(2)} |
| Utilização | ${budgetUtilization.toFixed(0)}% |
| Livre após budgets | €${freeIncome.toFixed(2)} |

## 📋 ORÇAMENTOS ATUAIS

### A ultrapassar (>100%) - ⚠️ CRÍTICO
${overBudget.length > 0 ? overBudget.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : "Nenhum ✅"}

### Bem geridos (50-100%) - ✅ ÓTIMO
${optimal.length > 0 ? optimal.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : "Nenhum"}

### Subutilizados (<50%) - 💡 AJUSTAR?
${underBudget.length > 0 ? underBudget.map(b => `- ${b.category}: ${calculatePercentage(b.spent, b.limit).toFixed(0)}%`).join("\n") : "Nenhum"}

### Detalhe completo
${budgetEntries}

## 🎯 METAS DA FAMÍLIA

${goalsEntries}

---

# INSTRUÇÕES DE OTIMIZAÇÃO

## OBJETIVO:

Sugerir ajustes de budgets que:
1. Maximizam a probabilidade de atingir metas
2. Evitam desperdício (budget não usado)
3. Previnem estouros (budget insuficiente)
4. Consideram trade-offs entre categorias

## CRITÉRIOS DE SUGESTÃO:

### Sugerir AUMENTO do budget se:
- Categoria consistentemente >90% do budget (3+ meses)
- Categoria essencial (Alimentação, Moradia, Saúde)
- Aumento previne impacto negativo nas metas

### Sugerir REDUÇÃO do budget se:
- Categoria consistentemente <50% do budget (3+ meses)
- Redução liberta dinheiro para metas importantes
- Categoria não-essencial com histórico baixo

### NÃO sugerir alteração se:
- Variação <5% não justifica mudança
- Categoria estável e bem calibrada (70-90%)
- Mudança não traz benefício significativo

## FORMATO DE SAÍDA

{
  "suggestions": [
    {
      "category": "Nome EXATO da categoria",
      "currentLimit": número,
      "suggestedLimit": número,
      "reason": "Justificação clara (máx 100 caracteres)",
      "impactOnGoals": "Como afeta metas (máx 100 caracteres)"
    }
  ],
  "summary": "Visão geral da situação (máx 150 caracteres)"
}

## REGRAS:

1. **Máximo 5 sugestões** - foca nas mais impactantes
2. **Só sugere se >5% de melhoria** - evita micro-otimizações
3. **Considera impacto nas metas** - não cortes cegos
4. **Sê específico nos números** - "reduz €50" não "reduz um pouco"
5. **Justifica com dados** - "média 3 meses: €120" não "acho que é demais"
6. **Considera prioridades**:
   - 1º: Evitar estouros de budgets essenciais
   - 2º: Libertar dinheiro para metas de poupança
   - 3º: Otimizar budgets não-essenciais

## EXEMPLOS DE BOAS SUGESTÕES:

✅ {
  "category": "Lazer",
  "currentLimit": 200,
  "suggestedLimit": 150,
  "reason": "Média 3 meses: €110. Budget atual subutilizado.",
  "impactOnGoals": "Liberta €50/mês para meta Férias"
}

✅ {
  "category": "Alimentação",
  "currentLimit": 300,
  "suggestedLimit": 350,
  "reason": "3 meses >90%. Previne estouros futuros.",
  "impactOnGoals": "€50 extra, mas evita stress orçamental"
}

❌ {
  "category": "Lazer",
  "currentLimit": 200,
  "suggestedLimit": 190,
  "reason": "Podes poupar um pouco"
}
// Redução muito pequena, não justifica mudança

---

Analisa os dados e sugere otimizações REAIS e ACIONÁVEIS. Foca no que traz mais benefício para o utilizador.`;
}