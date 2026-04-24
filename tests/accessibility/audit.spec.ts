import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('home page sem violations críticas', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('dashboard page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('analytics page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('budgets page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard/budgets');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('goals page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('transactions page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });

  test('settings page sem violations críticas', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });
});
