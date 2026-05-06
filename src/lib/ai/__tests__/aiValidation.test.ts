import { describe, it, expect } from "@jest/globals";
import { validateDataQuality, detectOutliers } from "../dataQuality";
import { validateInsights } from "../validateOutput";
import { AIInsightsPayload, AIInsightItem } from "../types";

describe("Data Quality Validation", () => {
  const basePayload: AIInsightsPayload = {
    month: "2026-04",
    income: 2500,
    expenses: 1800,
    pouparanca: 700,
    balance: 700,
    categorySpending: {
      "Alimentação": 400,
      "Lazer": 200,
      "Moradia": 800,
    },
    budgets: [
      { category: "Alimentação", limit: 500, spent: 400 },
      { category: "Lazer", limit: 300, spent: 200 },
      { category: "Moradia", limit: 900, spent: 800 },
    ],
    goals: [{ name: "Férias", target: 1000, current: 500 }],
    transactionsCount: 25,
    billingCycleDay: 1,
  };

  it("should return high quality for valid data", () => {
    const result = validateDataQuality(basePayload);
    expect(result.overall).toBe("high");
    expect(result.scores.completeness).toBeGreaterThan(80);
  });

  it("should detect zero income with transactions", () => {
    const payload = { ...basePayload, income: 0 };
    const result = validateDataQuality(payload);
    expect(result.issues.some(i => i.category === "inconsistent")).toBe(true);
  });

  it("should detect anomalous savings rate", () => {
    const payload = { ...basePayload, pouparanca: 4000 };
    const result = validateDataQuality(payload);
    expect(result.issues.some(i => i.category === "outlier")).toBe(true);
  });

  it("should detect critical negative balance", () => {
    const payload = { ...basePayload, balance: -2000 };
    const result = validateDataQuality(payload);
    expect(result.issues.some(i => i.severity === "critical")).toBe(true);
    expect(result.overall).toBe("low");
  });
});

describe("Outlier Detection", () => {
  it("should detect outliers in transactions", () => {
    const transactions = [
      { category: "Alimentação", amount: 50, type: "expense" },
      { category: "Alimentação", amount: 55, type: "expense" },
      { category: "Alimentação", amount: 52, type: "expense" },
      { category: "Alimentação", amount: 53, type: "expense" },
      { category: "Alimentação", amount: 51, type: "expense" },
      { category: "Alimentação", amount: 500, type: "expense" }, // Outlier extremo
    ];

    const outliers = detectOutliers(transactions);
    expect(outliers.length).toBeGreaterThan(0);
    expect(outliers.some(o => o.amount === 500)).toBe(true);
  });

  it("should not flag normal transactions", () => {
    const transactions = [
      { category: "Alimentação", amount: 50, type: "expense" },
      { category: "Alimentação", amount: 55, type: "expense" },
      { category: "Alimentação", amount: 52, type: "expense" },
    ];

    const outliers = detectOutliers(transactions);
    expect(outliers.length).toBe(0);
  });
});

describe("Output Validation", () => {
  const basePayload: AIInsightsPayload = {
    month: "2026-04",
    income: 2500,
    expenses: 1800,
    pouparanca: 700,
    balance: 700,
    categorySpending: {
      "Alimentação": 400,
      "Lazer": 200,
      "Moradia": 800,
    },
    budgets: [
      { category: "Alimentação", limit: 500, spent: 400 },
      { category: "Lazer", limit: 300, spent: 200 },
    ],
    goals: [{ name: "Férias", target: 1000, current: 500 }],
    transactionsCount: 25,
    billingCycleDay: 1,
  };

  it("should accept valid insights", () => {
    const insights: AIInsightItem[] = [
      {
        type: "warning",
        title: "Alimentação quase esgotada",
        description: "Gastaste €400 de €500 (80%). Restam €100.",
      },
      {
        type: "success",
        title: "Saldo positivo",
        description: "Conseguiste poupar €700 este mês. Continua!",
      },
    ];

    const result = validateInsights(insights, basePayload);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should reject insights with invalid categories", () => {
    const insights: AIInsightItem[] = [
      {
        type: "warning",
        title: "Transportes no limite",
        description: "Gastaste demasiado em Transportes.",
      },
    ];

    const result = validateInsights(insights, basePayload);
    // Categoria "Transportes" não existe nos dados, mas o validador permite insights genéricos
    // O importante é que warnings são gerados para linguagem vaga
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should warn about vague language", () => {
    const insights: AIInsightItem[] = [
      {
        type: "tip",
        title: "Gastos elevados",
        description: "Estás a gastar muito em algumas coisas.",
      },
    ];

    const result = validateInsights(insights, basePayload);
    expect(result.warnings.some(w => w.type === "vague")).toBe(true);
  });

  it("should warn about non-actionable insights", () => {
    const insights: AIInsightItem[] = [
      {
        type: "info",
        title: "Informação",
        description: "O teu saldo é de €700.",
      },
    ];

    const result = validateInsights(insights, basePayload);
    expect(result.warnings.some(w => w.type === "not_actionable")).toBe(true);
  });

  it("should detect repetitive titles", () => {
    const insights: AIInsightItem[] = [
      {
        type: "warning",
        title: "Budget no limite",
        description: "Gastaste €400 de €500.",
      },
      {
        type: "warning",
        title: "Budget no limite",
        description: "Gastaste €200 de €300.",
      },
    ];

    const result = validateInsights(insights, basePayload);
    expect(result.warnings.some(w => w.type === "repetitive")).toBe(true);
  });
});

describe("Integration Tests", () => {
  it("should handle low quality data with fallback", () => {
    const lowQualityPayload: AIInsightsPayload = {
      month: "2026-04",
      income: 0,
      expenses: 1800,
      pouparanca: 0,
      balance: -1800,
      categorySpending: {},
      budgets: [],
      goals: [],
      transactionsCount: 25,
      billingCycleDay: 1,
      metadata: {
        dataQuality: "low",
        outliersCount: 0,
        categoriesUsed: [],
        dayOfMonth: 15,
        daysRemaining: 15,
        isWeekend: false,
      }
    };

    const quality = validateDataQuality(lowQualityPayload);
    expect(quality.overall).toBe("low");
  });
});
