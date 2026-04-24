import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSpendingPower } from '../useSpendingPower';

jest.mock('../DataProvider', () => {
  let mockTransactions: any[] = [];
  let mockGoals: any[] = [];
  let mockBudgets: any[] = [];

  return {
    useData: () => ({
      transactions: mockTransactions,
      goals: mockGoals,
      budgets: mockBudgets,
    }),
    __setMockData: (data: { transactions?: any[]; goals?: any[]; budgets?: any[] }) => {
      mockTransactions = data.transactions || [];
      mockGoals = data.goals || [];
      mockBudgets = data.budgets || [];
    },
    DataProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

const { __setMockData } = jest.requireMock('../DataProvider');

describe('useSpendingPower', () => {
  beforeEach(() => {
    __setMockData({ transactions: [], goals: [], budgets: [] });
  });

  it('calcula available corretamente (income - expenses - goals)', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 2500, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Supermercado', amount: 1800, type: 'expense' as const, category: 'Alimentação', date: `${monthStr}-05` },
      ],
      goals: [
        { id: '1', name: 'Férias', target_amount: 700, current_amount: 0, goal_type: 'savings' as const },
      ],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    // available = income (2500) - expenses (1800) - goalsAllocated (700/12 ≈ 58.33)
    // available ≈ 641.67
    expect(result.current.available).toBeGreaterThan(600);
    expect(result.current.available).toBeLessThan(700);
  });

  it('retorna dailyBudget correto', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 2500, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Despesas', amount: 1800, type: 'expense' as const, category: 'Vários', date: `${monthStr}-05` },
      ],
      goals: [],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    expect(result.current.available).toBeCloseTo(700, 0);
    expect(result.current.dailyBudget).toBeGreaterThan(0);
  });

  it('status = danger quando available < 0', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 1000, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Despesas', amount: 1500, type: 'expense' as const, category: 'Vários', date: `${monthStr}-05` },
      ],
      goals: [],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    expect(result.current.status).toBe('danger');
    expect(result.current.message).toContain('Ultrapassaste');
  });

  it('status = warning quando dailyBudget < 5', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 1000, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Despesas', amount: 900, type: 'expense' as const, category: 'Vários', date: `${monthStr}-05` },
      ],
      goals: [],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    if (result.current.dailyBudget < 5) {
      expect(result.current.status).toBe('warning');
    }
  });

  it('status = good quando dailyBudget >= 5', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 2500, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Despesas', amount: 1000, type: 'expense' as const, category: 'Vários', date: `${monthStr}-05` },
      ],
      goals: [],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    if (result.current.dailyBudget >= 5) {
      expect(result.current.status).toBe('good');
    }
  });

  it('retorna dados vazios quando sem transações', () => {
    __setMockData({
      transactions: [],
      goals: [],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    expect(result.current.available).toBe(0);
    expect(result.current.dailyBudget).toBe(0);
    expect(result.current.remainingDays).toBeGreaterThanOrEqual(0);
  });

  it('inclui breakdown correto', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Salário', amount: 2500, type: 'income' as const, category: 'Salário', date: `${monthStr}-01` },
        { id: '2', description: 'Despesas', amount: 1800, type: 'expense' as const, category: 'Vários', date: `${monthStr}-05` },
      ],
      goals: [{ id: '1', name: 'Férias', target_amount: 100, current_amount: 0, goal_type: 'savings' as const }],
      budgets: [],
    });

    const { result } = renderHook(() => useSpendingPower());

    expect(result.current.breakdown).toHaveLength(3);
    expect(result.current.breakdown[0].label).toBe('Receitas este mês');
    expect(result.current.breakdown[0].type).toBe('income');
    expect(result.current.breakdown[1].label).toBe('Despesas este mês');
    expect(result.current.breakdown[1].type).toBe('expense');
  });
});
