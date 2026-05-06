# Task Completion Checklist

## Before Marking Task Complete

### 1. Lint Check
```powershell
npm run lint
```
Fix all ESLint errors and warnings.

### 2. Unit Tests
```powershell
npm run test
```
Ensure all Jest tests pass.

### 3. Test Coverage (if adding new code)
```powershell
npm run test:coverage
```
Verify 70%+ coverage on new code in `src/lib/ai/**` and `src/hooks/**`.

### 4. Build Check
```powershell
npm run build
```
Ensure production build succeeds without errors.

### 5. Type Check
TypeScript errors will be caught by `tsc --noEmit` during build. Fix all type errors.

### 6. E2E Tests (for UI changes)
```powershell
npm run test:e2e
```
Run Playwright tests if significant UI changes were made.

### 7. Accessibility (for UI changes)
```powershell
npm run test:a11y
```
Verify accessibility compliance with axe-core.

## Notes
- Next.js config has CSP temporarily disabled for OneSignal testing
- PDF support requires special webpack config for `pdfjs-dist` and `canvas`
- Stale times configured: dynamic=30s, static=60s
- Security headers configured (XSS protection, frame options, HSTS)
