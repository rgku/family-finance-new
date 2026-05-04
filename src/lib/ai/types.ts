export const AI_PROVIDER_CONFIG = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    maxTokens: 1024,
    temperature: 0.3,
  },
  cohere: {
    baseUrl: "https://api.cohere.com/v1",
  },
} as const;

export type AIProvider = "groq" | "cohere";

export interface SpendingAnomaly {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  severity: "high" | "medium" | "low";
  description: string;
}

export interface SubscriptionData {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  zombieCount: number;
  potentialSavings: number;
  zombieInsight?: {
    name: string;
    amount: number;
    daysSinceLastCharge: number;
  };
  allSubscriptions?: Array<{
    name: string;
    amount: number;
    lastDate: string;
    daysSinceLastCharge: number;
  }>;
}

export interface AIInsightItem {
  type: "info" | "warning" | "success" | "tip" | "alert";
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentage?: number;
  previousAmount?: number;
  confidence?: "high" | "medium" | "low";
  severity?: "high" | "medium" | "low";
}

export interface AIForecastItem {
  category: string;
  predictedAmount: number;
  confidenceLow: number;
  confidenceHigh: number;
  reasoning: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

export interface AIBudgetSuggestion {
  category: string;
  currentLimit: number;
  suggestedLimit: number;
  reason: string;
  impactOnGoals: string;
}

export interface AIInsightsPayload {
  month: string;
  income: number;
  expenses: number;
  pouparanca: number;
  balance: number;
  categorySpending: Record<string, number>;
  budgets: { category: string; limit: number; spent: number }[];
  goals: { name: string; target: number; current: number; deadline?: string }[];
  transactionsCount: number;
  previousMonthSpending?: Record<string, number>;
  billingCycleDay: number;
  subscriptions?: SubscriptionData;
  spendingAnomalies?: SpendingAnomaly[];
  metadata?: {
    dataQuality: "high" | "medium" | "low";
    outliersCount: number;
    categoriesUsed: string[];
    dayOfMonth: number;
    daysRemaining: number;
    isWeekend: boolean;
  };
}

export interface AIForecastPayload {
  familyId: string;
  targetMonth: string;
  historyByCategory: Record<string, { amount: number; month: string }[]>;
  recurringPatterns: { description: string; amount: number; frequency: string }[];
  billingCycleDay: number;
}

export interface AIBudgetOptimizePayload {
  familyId: string;
  currentBudgets: { category: string; limit: number; spent: number }[];
  recentSpending: Record<string, number[]>;
  goals: { name: string; target: number; current: number; deadline?: string }[];
  totalIncome: number;
}