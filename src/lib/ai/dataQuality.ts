import { AIInsightsPayload } from "./types";

export interface DataQualityReport {
  overall: "high" | "medium" | "low";
  issues: DataQualityIssue[];
  scores: {
    completeness: number;
    consistency: number;
    accuracy: number;
  };
}

export interface DataQualityIssue {
  severity: "critical" | "warning" | "info";
  category: "missing" | "outlier" | "inconsistent";
  message: string;
  suggestion: string;
}

export interface OutlierReport {
  category: string;
  amount: number;
  threshold: number;
  severity: "critical" | "warning";
}

export function validateDataQuality(data: AIInsightsPayload): DataQualityReport {
  const issues: DataQualityIssue[] = [];
  
  // Check 1: Missing critical data
  if (data.income === 0 && data.transactionsCount > 0) {
    issues.push({
      severity: "warning",
      category: "inconsistent",
      message: "Receitas = 0 mas há transações",
      suggestion: "Verificar se transações de income estão categorizadas corretamente"
    });
  }
  
  // Check 2: Expenses sem income
  if (data.expenses > 0 && data.income === 0) {
    issues.push({
      severity: "warning",
      category: "inconsistent",
      message: "Despesas sem receitas",
      suggestion: "Adicionar receitas para cálculo correto do saldo"
    });
  }
  
  // Check 3: Budgets sem transações
  const budgetsNoTransactions = data.budgets.filter(b => b.limit > 0 && b.spent === 0);
  if (budgetsNoTransactions.length > 0) {
    issues.push({
      severity: "info",
      category: "missing",
      message: `${budgetsNoTransactions.length} orçamentos sem gastos detetados`,
      suggestion: "Pode ser normal (início do mês) ou erro de categorização"
    });
  }
  
  // Check 4: Savings rate anómalo
  const savingsRate = data.income > 0 ? (data.pouparanca / data.income) * 100 : 0;
  if (savingsRate > 80) {
    issues.push({
      severity: "warning",
      category: "outlier",
      message: `Savings rate de ${savingsRate.toFixed(0)}% é anómalo`,
      suggestion: "Verificar se investimentos estão classificados corretamente"
    });
  }
  
  // Check 5: Negative balance without warning
  if (data.balance < -data.income * 0.5) {
    issues.push({
      severity: "critical",
      category: "outlier",
      message: `Saldo negativo de €${data.balance.toFixed(2)}`,
      suggestion: "Urgente: rever gastos e identificar causa do défice"
    });
  }
  
  // Check 6: Category spending mismatch
  const totalCategorySpending = Object.values(data.categorySpending).reduce((a, b) => a + b, 0);
  const budgetSpending = data.budgets.reduce((a, b) => a + b.spent, 0);
  if (Math.abs(totalCategorySpending - budgetSpending) > data.expenses * 0.1) {
    issues.push({
      severity: "warning",
      category: "inconsistent",
      message: "Divergência entre gastos por categoria e orçamentos",
      suggestion: "Verificar consistência dos dados"
    });
  }
  
  // Calculate overall quality
  const criticalIssues = issues.filter(i => i.severity === "critical").length;
  const warningIssues = issues.filter(i => i.severity === "warning").length;
  
  const overall = criticalIssues > 0 ? "low" : warningIssues > 2 ? "medium" : "high";
  
  return {
    overall,
    issues,
    scores: {
      completeness: Math.max(0, 100 - issues.filter(i => i.category === "missing").length * 10),
      consistency: Math.max(0, 100 - issues.filter(i => i.category === "inconsistent").length * 15),
      accuracy: Math.max(0, 100 - issues.filter(i => i.category === "outlier").length * 20),
    }
  };
}

export function detectOutliers(transactions: Array<{
  category: string;
  amount: number;
  type: string;
}>): OutlierReport[] {
  const outliers: OutlierReport[] = [];
  
  // Group by category
  const byCategory = new Map<string, number[]>();
  transactions.forEach(t => {
    if (t.type === "expense") {
      const amounts = byCategory.get(t.category) || [];
      amounts.push(Math.abs(t.amount));
      byCategory.set(t.category, amounts);
    }
  });
  
  // Detect outliers per category (IQR method)
  byCategory.forEach((amounts, category) => {
    if (amounts.length < 3) return;
    
    const sorted = [...amounts].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const upperBound = q3 + (1.5 * iqr);
    
    amounts.forEach(amount => {
      if (amount > upperBound) {
        outliers.push({
          category,
          amount,
          threshold: upperBound,
          severity: amount > upperBound * 2 ? "critical" : "warning"
        });
      }
    });
  });
  
  return outliers;
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}
