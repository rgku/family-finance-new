import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useFiscalSnapshot } from '../useFiscalSnapshot';

jest.mock('../DataProvider', () => {
  let mockTransactions: any[] = [];

  return {
    useData: () => ({
      transactions: mockTransactions,
    }),
    __setMockData: (data: { transactions?: any[] }) => {
      mockTransactions = data.transactions || [];
    },
    DataProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

const { __setMockData } = jest.requireMock('../DataProvider');

describe('useFiscalSnapshot', () => {
  beforeEach(() => {
    __setMockData({ transactions: [] });
  });

  it('calcula benefícios fiscais por categoria (PT)', () => {
    const currentYear = new Date().getFullYear();
    __setMockData({
      transactions: [
        { id: '1', description: 'Farmácia', amount: 500, type: 'expense' as const, category: 'Saúde', date: `${currentYear}-04-01` },
        { id: '2', description: 'Livros', amount: 400, type: 'expense' as const, category: 'Educação', date: `${currentYear}-04-05` },
      ],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    const saudeBenefit = result.current.benefits.find(b => b.category === 'Despesas de saúde');
    const educacaoBenefit = result.current.benefits.find(b => b.category === 'Despesas de educação');

    expect(saudeBenefit).toBeDefined();
    expect(saudeBenefit?.totalExpenses).toBe(500);
    expect(saudeBenefit?.deductiblePercentage).toBe(15);

    expect(educacaoBenefit).toBeDefined();
    expect(educacaoBenefit?.totalExpenses).toBe(400);
    expect(educacaoBenefit?.deductiblePercentage).toBe(30);
  });

  it('retorna vazio sem transações', () => {
    __setMockData({
      transactions: [],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    expect(result.current.benefits.every(b => b.totalExpenses === 0)).toBe(true);
    expect(result.current.totalDeductible).toBe(0);
    expect(result.current.totalPotentialRefund).toBe(0);
  });

  it('calcula apenas ano corrente', () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    __setMockData({
      transactions: [
        { id: '1', description: 'Farmácia 2026', amount: 500, type: 'expense' as const, category: 'Saúde', date: `${currentYear}-04-01` },
        { id: '2', description: 'Farmácia 2025', amount: 300, type: 'expense' as const, category: 'Saúde', date: `${lastYear}-04-01` },
      ],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    const saudeBenefit = result.current.benefits.find(b => b.category === 'Despesas de saúde');
    expect(saudeBenefit?.totalExpenses).toBe(500);
  });

  it('aplica taxas corretas por categoria', () => {
    const currentYear = new Date().getFullYear();
    __setMockData({
      transactions: [
        { id: '1', description: 'Farmácia', amount: 1000, type: 'expense' as const, category: 'Saúde', date: `${currentYear}-04-01` },
        { id: '2', description: 'Rendas', amount: 800, type: 'expense' as const, category: 'Habitação', date: `${currentYear}-04-05` },
      ],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    const saudeBenefit = result.current.benefits.find(b => b.category === 'Despesas de saúde');
    const habitacaoBenefit = result.current.benefits.find(b => b.category === 'Despesas de habitação');

    expect(saudeBenefit?.deductibleAmount).toBeCloseTo(1000 * 0.15, 2);
    expect(habitacaoBenefit?.deductibleAmount).toBeCloseTo(800 * 0.15, 2);
  });

  it('calcula potentialRefund como 20% do deductible', () => {
    const currentYear = new Date().getFullYear();
    __setMockData({
      transactions: [
        { id: '1', description: 'Farmácia', amount: 1000, type: 'expense' as const, category: 'Saúde', date: `${currentYear}-04-01` },
      ],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    const saudeBenefit = result.current.benefits.find(b => b.category === 'Despesas de saúde');
    const expectedDeductible = 1000 * 0.15;
    const expectedRefund = expectedDeductible * 0.20;

    expect(saudeBenefit?.potentialRefund).toBeCloseTo(expectedRefund, 2);
  });

  it('inclui todas as categorias fiscais PT', () => {
    __setMockData({
      transactions: [],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    expect(result.current.benefits.length).toBe(5);
    expect(result.current.benefits.some(b => b.category === 'Despesas de saúde')).toBe(true);
    expect(result.current.benefits.some(b => b.category === 'Despesas de educação')).toBe(true);
    expect(result.current.benefits.some(b => b.category === 'Despesas de habitação')).toBe(true);
  });

  it('calcula yearlyExpenses do ano corrente', () => {
    const currentYear = new Date().getFullYear();
    __setMockData({
      transactions: [
        { id: '1', description: 'Farmácia', amount: 500, type: 'expense' as const, category: 'Saúde', date: `${currentYear}-04-01` },
        { id: '2', description: 'Supermercado', amount: 300, type: 'expense' as const, category: 'Alimentação', date: `${currentYear}-04-05` },
      ],
    });

    const { result } = renderHook(() => useFiscalSnapshot());

    expect(result.current.yearlyExpenses).toBe(500);
  });
});
