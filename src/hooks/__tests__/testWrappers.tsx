import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from '../DataProvider';
import { createMockData } from './__mocks__/useData';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        logger: {
          log: console.log,
          warn: console.warn,
          error: () => {},
        },
      },
    },
  });
}

export interface WrapperOptions {
  queryClient?: QueryClient;
}

export function createWrapper(options: WrapperOptions = {}) {
  const queryClient = options.queryClient || createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DataProvider>{children}</DataProvider>
      </QueryClientProvider>
    );
  };
}

export function createWrapperWithMockData(data: ReturnType<typeof createMockData>) {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    jest.mock('../DataProvider', () => ({
      DataProvider: ({ children }: { children: ReactNode }) => children,
      useData: () => data,
    }));
    
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

export function mockFetch(response: unknown, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
  });
}

export function resetFetchMock() {
  (global.fetch as jest.Mock).mockReset();
}
