/**
 * TanStack Query client configuration for POS.
 * Optimized for offline-first operation.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes (longer for offline)
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

