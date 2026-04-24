import { Transaction, Goal, Budget } from '@/hooks/DataProvider';

export interface MockDataOverrides {
  transactions?: Partial<Transaction>[];
  goals?: Partial<Goal>[];
  budgets?: Partial<Budget>[];
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `txn_${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-id',
    description: overrides.description || 'Test Transaction',
    amount: overrides.amount || 100,
    type: overrides.type || 'expense',
    category: overrides.category || 'Alimentação',
    date: overrides.date || '2026-04-01',
    created_at: overrides.created_at || new Date().toISOString(),
  };
}

export function createMockGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: `goal_${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-id',
    name: overrides.name || 'Test Goal',
    target_amount: overrides.target_amount || 1000,
    current_amount: overrides.current_amount || 500,
    deadline: overrides.deadline || '2026-12-31',
    icon: overrides.icon || 'savings',
    goal_type: overrides.goal_type || 'savings',
    created_at: overrides.created_at || new Date().toISOString(),
  };
}

export function createMockBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: `budget_${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-id',
    category: overrides.category || 'Alimentação',
    month: overrides.month || '2026-04',
    limit_amount: overrides.limit_amount || 500,
    created_at: overrides.created_at || new Date().toISOString(),
  };
}

export function createMockData(overrides: MockDataOverrides = {}) {
  const defaultTransactions: Transaction[] = [
    createMockTransaction({
      id: 'txn-1',
      description: 'Supermercado',
      amount: 400,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-04-05',
    }),
    createMockTransaction({
      id: 'txn-2',
      description: 'Salário',
      amount: 2500,
      type: 'income',
      category: 'Salário',
      date: '2026-04-01',
    }),
    createMockTransaction({
      id: 'txn-3',
      description: 'Netflix',
      amount: 15.99,
      type: 'expense',
      category: 'Netflix',
      date: '2026-04-10',
    }),
  ];

  const defaultGoals: Goal[] = [
    createMockGoal({
      id: 'goal-1',
      name: 'Férias',
      target_amount: 1000,
      current_amount: 500,
    }),
  ];

  const defaultBudgets: Budget[] = [
    createMockBudget({
      id: 'budget-1',
      category: 'Alimentação',
      limit_amount: 500,
    }),
    createMockBudget({
      id: 'budget-2',
      category: 'Lazer',
      limit_amount: 300,
    }),
  ];

  return {
    transactions: (overrides.transactions?.map(createMockTransaction) || defaultTransactions) as Transaction[],
    goals: (overrides.goals?.map(createMockGoal) || defaultGoals) as Goal[],
    budgets: (overrides.budgets?.map(createMockBudget) || defaultBudgets) as Budget[],
  };
}

export function createEmptyMockData() {
  return {
    transactions: [] as Transaction[],
    goals: [] as Goal[],
    budgets: [] as Budget[],
  };
}
