export interface MockSupabaseOptions {
  transactions?: any[];
  budgets?: any[];
  goals?: any[];
  shouldError?: boolean;
  errorMessage?: string;
}

export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const {
    transactions = [],
    budgets = [],
    goals = [],
    shouldError = false,
    errorMessage = 'Mock error',
  } = options;

  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockImplementation((data) => ({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { ...data, id: 'mock-id', created_at: new Date().toISOString() },
        error: null,
      }),
    })),
    update: jest.fn().mockImplementation((data) => ({
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { ...data },
        error: null,
      }),
    })),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(async () => {
      if (shouldError) {
        return { data: null, error: new Error(errorMessage) };
      }
      return { data: null, error: null };
    }),
    rpc: jest.fn().mockImplementation(async () => {
      if (shouldError) {
        return { data: null, error: new Error(errorMessage) };
      }
      return { data: null, error: null };
    }),
  };
}

export function createMockQueryClient() {
  return {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  };
}
