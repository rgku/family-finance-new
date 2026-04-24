import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSubscriptionTracker } from '../useSubscriptionTracker';

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

describe('useSubscriptionTracker', () => {
  beforeEach(() => {
    __setMockData({ transactions: [] });
  });

  it('deteta subscriptions por keyword (Netflix, Spotify, etc)', () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    __setMockData({
      transactions: [
        { id: '1', description: 'Netflix Portugal', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: `${monthStr}-10` },
        { id: '2', description: 'Spotify Premium', amount: 9.99, type: 'expense' as const, category: 'Spotify', date: `${monthStr}-12` },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    expect(result.current.subscriptions.length).toBeGreaterThan(0);
    expect(result.current.subscriptions.some(s => s.name.includes('Netflix'))).toBe(true);
  });

  it('marca como zombie após 60 dias sem cobrança', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 67);
    const oldDateString = oldDate.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: oldDateString },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    const netflixSub = result.current.subscriptions.find(s => s.name === 'Netflix');
    expect(netflixSub?.isZombie).toBe(true);
    expect(netflixSub?.daysSinceLastCharge).toBeGreaterThan(60);
  });

  it('calcula poupança potencial de zombies', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 67);
    const oldDateString = oldDate.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: oldDateString },
        { id: '2', description: 'Spotify', amount: 9.99, type: 'expense' as const, category: 'Spotify', date: oldDateString },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    expect(result.current.potentialSavings).toBeCloseTo(25.98, 2);
    expect(result.current.zombieCount).toBe(2);
  });

  it('retorna totalMonthly correto', () => {
    const now = new Date();
    const recentDate1 = new Date();
    recentDate1.setDate(now.getDate() - 5);
    const recentDate2 = new Date();
    recentDate2.setDate(now.getDate() - 35);
    
    const date1String = recentDate1.toISOString().split('T')[0];
    const date2String = recentDate2.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: date1String },
        { id: '2', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: date2String },
        { id: '3', description: 'Spotify', amount: 9.99, type: 'expense' as const, category: 'Spotify', date: date1String },
        { id: '4', description: 'Spotify', amount: 9.99, type: 'expense' as const, category: 'Spotify', date: date2String },
        { id: '5', description: 'Disney+', amount: 8.99, type: 'expense' as const, category: 'Disney+', date: date1String },
        { id: '6', description: 'Disney+', amount: 8.99, type: 'expense' as const, category: 'Disney+', date: date2String },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    expect(result.current.totalMonthly).toBeCloseTo(34.97, 2);
    expect(result.current.activeCount).toBe(3);
  });

  it('ordena subscriptions por amount (maior primeiro)', () => {
    const now = new Date();
    const recentDate = new Date();
    recentDate.setDate(now.getDate() - 5);
    const recentDateString = recentDate.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Disney+', amount: 8.99, type: 'expense' as const, category: 'Disney+', date: recentDateString },
        { id: '2', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: recentDateString },
        { id: '3', description: 'Spotify', amount: 9.99, type: 'expense' as const, category: 'Spotify', date: recentDateString },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    const amounts = result.current.subscriptions.map(s => s.amount);
    expect(amounts).toEqual(amounts.slice().sort((a, b) => b - a));
  });

  it('deteta subscription por categoria', () => {
    const now = new Date();
    const recentDate = new Date();
    recentDate.setDate(now.getDate() - 5);
    const recentDateString = recentDate.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Adobe Creative Cloud', amount: 59.99, type: 'expense' as const, category: 'Adobe', date: recentDateString },
        { id: '2', description: 'Microsoft 365', amount: 9.99, type: 'expense' as const, category: 'Microsoft 365', date: recentDateString },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    expect(result.current.subscriptions.length).toBeGreaterThan(0);
    expect(result.current.subscriptions.some(s => s.name.includes('Adobe'))).toBe(true);
    expect(result.current.subscriptions.some(s => s.name.includes('Microsoft'))).toBe(true);
  });

  it('retorna totalYearly como 12x totalMonthly', () => {
    const now = new Date();
    const recentDate = new Date();
    recentDate.setDate(now.getDate() - 5);
    const recentDateString = recentDate.toISOString().split('T')[0];

    __setMockData({
      transactions: [
        { id: '1', description: 'Netflix', amount: 15.99, type: 'expense' as const, category: 'Netflix', date: recentDateString },
      ],
    });

    const { result } = renderHook(() => useSubscriptionTracker());

    expect(result.current.totalYearly).toBeCloseTo(result.current.totalMonthly * 12, 2);
  });
});
