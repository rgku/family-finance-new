import '@testing-library/jest-dom';

jest.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

jest.mock('@/hooks/DataProvider', () => {
  const { createMockData } = require('./__mocks__/useData');
  return {
    useData: () => createMockData(),
    DataProvider: ({ children }: { children: React.ReactNode }) => children,
    useDataContext: () => ({
      transactions: [],
      goals: [],
      budgets: [],
    }),
  };
});
