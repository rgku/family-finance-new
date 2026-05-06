# FamFlow - Family Finance App

## Purpose
App de gestão financeira familiar com IA, orçamentos, metas, e partilha de relatórios.

## Tech Stack
- **Framework**: Next.js 16.2.3 (App Router), React 19.2.4, TypeScript 5
- **Styling**: Tailwind CSS 4, lucide-react icons
- **DB/Auth**: Supabase (PostgreSQL, Auth, Realtime, SSR)
- **AI**: Cohere API (insights, forecast, optimization)
- **Payments**: Stripe
- **Push**: OneSignal + react-onesignal
- **Email**: Resend (implied by README)
- **PDF**: @react-pdf/renderer, pdfjs-dist
- **OCR**: Tesseract.js + html2canvas
- **Charts**: Recharts
- **State**: @tanstack/react-query
- **Offline**: IndexedDB (idb), Service Workers (PWA)
- **Testing**: Jest + RTL (unit), Playwright (E2E + a11y)
- **Linting**: ESLint 9 + eslint-config-next

## Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes (auth, ai, family, reports, transactions)
│   ├── dashboard/      # Dashboard pages (transactions, goals, budgets, analytics...)
│   ├── auth/           # Auth pages (callback)
│   └── onboarding/     # Onboarding flow
├── components/          # UI components + charts + skeletons
├── hooks/               # Custom hooks (data, AI, subscriptions, offline sync...)
│   └── __tests__/      # Hook unit tests
└── lib/                 # Utilities
    ├── ai/             # AI logic (Cohere, prompts, validation)
    ├── supabase/       # Supabase clients (client/server)
    ├── onesignal/      # OneSignal config/init
    └── offline-db.ts   # IndexedDB for offline support
```

## Key Features
- Dashboard com "In My Pocket" (spending power)
- Transações recorrentes automáticas
- Método envelope (dedução de orçamentos)
- Metas de poupança com contribuições
- AI insights, forecast, optimization
- Relatórios PDF + partilha Instagram
- Notificações push (OneSignal)
- Suporte offline (PWA + IndexedDB)
- Família multi-membro
