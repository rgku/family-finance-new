# FamFlow - Family Finance App

## Propósito
Aplicação de gerenciamento financeiro familiar com IA e notificações push. Permite controle de receitas, despesas, orçamentos, objetivos de poupança e insights personalizados via IA.

## Tech Stack

### Frontend
- **Next.js 16.2.3** - App Router (não é o Next.js tradicional - APIs podem diferir)
- **React 19.2.4**
- **TypeScript 5**
- **TailwindCSS 4**
- **Recharts** - Gráficos
- **@react-pdf/renderer** - Geração de PDFs
- **Lucide React** - Ícones

### Backend/Services
- **Supabase** - Auth, Database, Edge Functions
- **Cohere** - IA para insights financeiros
- **Stripe** - Pagamentos Premium
- **OneSignal** - Notificações push
- **IDB** - IndexedDB para cache local

### Testing/Quality
- **Jest** + ts-jest
- **ESLint 9**

## Estrutura de Código

```
src/
├── app/              # Next.js App Router routes
│   ├── api/          # API endpoints
│   ├── auth/         # Auth pages
│   ├── dashboard/    # Dashboard principal e sub-páginas
│   └── forgot-password/
├── components/       # Componentes React reutilizáveis
├── hooks/            # Custom React hooks
└── lib/              # Utilitários, serviços, configurações
```

## Convenções de Código

### TypeScript
- Strict mode ativado
- Tipagem estática obrigatória
- Interfaces para tipos complexos
- Path alias: `@/*` -> `./src/*`

### Next.js
- App Router (não Pages Router)
- Server Components por padrão
- Client Components com `'use client'` quando necessário
- Module Resolution: `bundler`

### Estilo
- TailwindCSS utility-first
- Componentes funcionais com React Hooks
- Lucide React para ícones

## Padrões de Design
- Clean Architecture (ver docs/PLANO_MELHORIAS.md)
- Componentes modulares e reutilizáveis
- Separação concerns: UI, lógica, dados

## Comandos Principais

### Desenvolvimento
```bash
npm run dev      # Iniciar dev server (localhost:3000)
npm run build    # Build produção
npm run start    # Start produção
```

### Qualidade
```bash
npm run lint     # ESLint
npm run test     # Jest tests
npm run test:coverage  # Jest com coverage
```

### Git
```bash
git status
git add .
git commit -m "message"
git push
```

## Entrypoints
- **Dev:** `npm run dev` -> http://localhost:3000
- **Build:** `npm run build` -> `.next/`
- **Prod:** `npm run start`

## Configurações Importantes
- **tsconfig.json:** TypeScript com paths alias
- **jest.config.js:** 70% coverage threshold
- **AGENTS.md:** Regras Next.js específicas (versão diferente)

## Documentação
- `docs/PLANO_MELHORIAS.md` - Plano de melhorias (Analytics, Reports)
- `CLAUDE.md` - Referencia AGENTS.md
