# Code Style & Conventions

## TypeScript
- Strict mode enabled
- Target: ES2017
- Module: ESNext with bundler resolution
- Path alias: `@/*` maps to `./src/*`
- Incremental compilation enabled
- Include: `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`

## Naming Conventions
- **Files**: camelCase for hooks (`useTransactions.ts`), PascalCase for components (`TransactionItem.tsx`)
- **Components**: PascalCase (React components)
- **Hooks**: camelCase with `use` prefix (`useSpendingPower`, `useBudgetAlerts`)
- **Types/Interfaces**: PascalCase (`AIForecast`, `Budget`, `Transaction`)
- **API routes**: kebab-case folders (`ai/forecast/route.ts`)

## Code Patterns
- Next.js App Router with server/client components
- Custom hooks for data fetching (Supabase + React Query)
- API routes in `src/app/api/` with Next.js route handlers
- Components use `"use client"` directive when needed
- Offline-first with IndexedDB + sync on reconnect
- PWA with Service Workers for mobile app experience

## Testing
- Jest + React Testing Library for unit tests
- Test files: `__tests__/**/*.test.ts(x)` 
- Setup file: `src/hooks/__tests__/setup.ts`
- Coverage threshold: 70% (branches, functions, lines, statements)
- Coverage from: `src/lib/ai/**`, `src/hooks/**`
- Playwright for E2E + accessibility testing

## Linting
- ESLint 9 with flat config (`eslint.config.mjs`)
- Next.js core web vitals + TypeScript configs
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
