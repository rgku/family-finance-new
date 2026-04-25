import { test as base, expect } from '@playwright/test';

// Test credentials - use environment variables in production
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@famflow.app';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test1234!';

// Extend Playwright test with authentication
export const test = base.extend<{
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Check if already logged in (on dashboard)
    const url = page.url();
    if (url.includes('/dashboard')) {
      await use(page);
      return;
    }
    
    // Try to login
    try {
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
      const passwordInput = page.locator('input[type="password"], input[placeholder*="senha"], input[placeholder*="Senha"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill(TEST_EMAIL);
        await passwordInput.fill(TEST_PASSWORD);
        await submitButton.click({ force: true });
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Login not attempted - may already be logged in or on different page');
    }
    
    await use(page);
  },
});

export { expect };
