import { test as base, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'rang1kuwr@hotmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test1234!';

export async function openMobileMenu(page: any) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 768) {
    const menuButton = page.locator('button:has-text("Mais"), [data-testid="menu-button"], button[aria-label*="menu"], button[aria-label*="Mais"]').first();
    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  }
}

export const test = base.extend<{
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') && !currentUrl.includes('redirect=')) {
      await use(page);
      return;
    }
    
    if (currentUrl.includes('redirect=') || currentUrl.includes('/auth/') || !currentUrl.includes('/dashboard')) {
      await page.waitForTimeout(1000);
      
      const loginTab = page.locator('button:has-text("Entrar"), button:has-text("Login")').first();
      if (await loginTab.isVisible({ timeout: 3000 })) {
        await loginTab.click();
        await page.waitForTimeout(500);
      }
      
      const emailInput = page.locator('#email, input[type="email"]').first();
      const passwordInput = page.locator('#password, input[type="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 10000 }) && await passwordInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(TEST_EMAIL);
        await passwordInput.fill(TEST_PASSWORD);
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').last();
        await submitButton.click();
        
        try {
          await page.waitForURL('**/dashboard**', { timeout: 15000 });
        } catch {
          await page.waitForLoadState('networkidle');
        }
        await page.waitForTimeout(2000);
      }
    }
    
    await use(page);
  },
});
