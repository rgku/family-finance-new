# Suggested Commands

## Development
- `npm run dev` - Start Next.js dev server (localhost:3000)
- `npm run build` - Production build
- `npm run start` - Start production server

## Code Quality
- `npm run lint` - Run ESLint (Next.js config + core-web-vitals)
- `npm run test` - Run Jest unit tests
- `npm run test:coverage` - Jest with coverage report (70% threshold)
- `npm run test:e2e` - Playwright E2E tests
- `npm run test:e2e:ui` - Playwright UI mode
- `npm run test:e2e:debug` - Playwright debug mode
- `npm run test:a11y` - Playwright accessibility tests

## Environment
- Copy `.env.example` to `.env.local` and configure:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `COHERE_API_KEY`
  - `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
  - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `RESEND_API_KEY`

## System Utilities (Windows/PowerShell)
- `Get-ChildItem` or `ls` - List files
- `Get-Content` - Read file
- `Select-String` - Search in files (grep equivalent)
- `git` - Version control (standard git commands)

## After Task Completion
1. `npm run lint` - Fix any lint errors
2. `npm run test` - Ensure tests pass
3. `npm run build` - Verify production build succeeds
