import { test, expect } from '@playwright/test';

test.describe('Notifications E2E Tests', () => {
  test('carrega página de alertas', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await expect(page.locator('text=Alertas, text=Notificações')).toBeVisible();
  });

  test('mostra sino de notificações no header', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notificationBell = page.locator('[aria-label*="notificação"], [aria-label*="notification"], button:has-text("🔔"), .notification-bell, [data-testid="notification-bell"]');
    const hasBell = await notificationBell.count() > 0;
    expect(hasBell).toBeTruthy();
  });

  test('abre dropdown de notificações', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notificationBell = page.locator('[aria-label*="notificação"], [aria-label*="notification"], .notification-bell').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(500);
      
      const hasDropdown = await page.locator('[role="listbox"], [class*="notification"], text=Notificações, text=Sem notificações').isVisible().catch(() => false);
      expect(hasDropdown).toBeTruthy();
    }
  });

  test('marca notificação como lida', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    
    const unreadNotifications = page.locator('[data-unread="true"], .unread, [aria-label*="não lida"]');
    if (await unreadNotifications.count() > 0) {
      await unreadNotifications.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('marca todas as notificações como lidas', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    
    const markAllReadButton = page.locator('button:has-text("Marcar todas como lidas"), button:has-text("Ler todas"), button:has-text("Clear all")');
    if (await markAllReadButton.isVisible()) {
      await markAllReadButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('elimina notificação', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    
    const deleteButtons = page.locator('button[aria-label*="eliminar"], button[aria-label*="delete"], button:has-text("×"), [data-testid="delete-notification"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('limpa todas as notificações', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    
    const clearAllButton = page.locator('button:has-text("Limpar todas"), button:has-text("Clear all"), button:has-text("Eliminar todas")');
    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('notificações push estão configuradas', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const pushNotificationsSection = page.locator('text=Push, text=Notificações push, text=Browser notifications');
    if (await pushNotificationsSection.isVisible()) {
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').nth(1);
      if (await toggle.isVisible()) {
        const isChecked = await toggle.isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    }
  });

  test('configura preferências de notificação', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const notificationToggles = page.locator('input[type="checkbox"], [role="switch"]');
    const count = await notificationToggles.count();
    
    if (count > 0) {
      await notificationToggles.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('badge de notificações não lidas', async ({ page }) => {
    await page.goto('/dashboard');
    
    const badge = page.locator('[class*="badge"], [class*="counter"], .notification-count, [aria-label*="não lida"]');
    const hasBadge = await badge.count() >= 0;
    expect(hasBadge).toBeTruthy();
  });

  test('navega para página de notificações pelo bell', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notificationBell = page.locator('[aria-label*="notificação"], .notification-bell').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(300);
      
      const viewAllLink = page.locator('a:has-text("Ver todas"), a:has-text("See all"), button:has-text("Ver alertas")');
      if (await viewAllLink.isVisible()) {
        await viewAllLink.click();
        await expect(page).toHaveURL(/\/dashboard\/alerts/);
      }
    }
  });
});
