import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

export interface RenderHookWithProvidersOptions {
  queryClient?: QueryClient;
  initialData?: Record<string, unknown>;
}

export function renderHookWithProviders<TProps, TResult>(
  renderHookCallback: (props: TProps) => TResult,
  options: RenderHookWithProvidersOptions = {}
) {
  const queryClient = options.queryClient || createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return renderHook(renderHookCallback, { wrapper });
}

export async function waitForHook<T>(callback: () => T, timeout = 1000) {
  return waitFor(callback, { timeout });
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
