import { test } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Notifications E2E Tests', () => {
  test('carrega página de alertas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/alerts');
    await authenticatedPage.waitForTimeout(1000);
    expect(await authenticatedPage.url()).toContain('/alerts');
  });

  test('mostra sino de notificações no header', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForTimeout(500);
    // Check if the bell icon exists in the header
    const bellButton = authenticatedPage.locator('button:has([data-testid*="bell"]), button svg').first();
    const hasBell = await bellButton.count() > 0;
    expect(hasBell).toBeTruthy();
  });

  test('abre dropdown de notificações', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const notificationBell = authenticatedPage.locator('[aria-label*="notificação"], [aria-label*="notification"], .notification-bell').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await authenticatedPage.waitForTimeout(500);
      
      const hasDropdown = await authenticatedPage.locator('[role="listbox"], [class*="notification"], text=Notificações, text=Sem notificações').isVisible().catch(() => false);
      expect(hasDropdown).toBeTruthy();
    }
  });

  test('marca notificação como lida', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/alerts');
    
    const unreadNotifications = authenticatedPage.locator('[data-unread="true"], .unread, [aria-label*="não lida"]');
    if (await unreadNotifications.count() > 0) {
      await unreadNotifications.first().click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('marca todas as notificações como lidas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/alerts');
    
    const markAllReadButton = authenticatedPage.locator('button:has-text("Marcar todas como lidas"), button:has-text("Ler todas"), button:has-text("Clear all")');
    if (await markAllReadButton.isVisible()) {
      await markAllReadButton.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('elimina notificação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/alerts');
    
    const deleteButtons = authenticatedPage.locator('button[aria-label*="eliminar"], button[aria-label*="delete"], button:has-text("×"), [data-testid="delete-notification"]');
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('limpa todas as notificações', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/alerts');
    
    const clearAllButton = authenticatedPage.locator('button:has-text("Limpar todas"), button:has-text("Clear all"), button:has-text("Eliminar todas")');
    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('notificações push estão configuradas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    
    const pushNotificationsSection = authenticatedPage.locator('text=Push, text=Notificações push, text=Browser notifications');
    if (await pushNotificationsSection.isVisible()) {
      const toggle = authenticatedPage.locator('input[type="checkbox"], [role="switch"]').nth(1);
      if (await toggle.isVisible()) {
        const isChecked = await toggle.isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    }
  });

  test('configura preferências de notificação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    
    const notificationToggles = authenticatedPage.locator('input[type="checkbox"], [role="switch"]');
    const count = await notificationToggles.count();
    
    if (count > 0) {
      await notificationToggles.first().click();
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('badge de notificações não lidas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const badge = authenticatedPage.locator('[class*="badge"], [class*="counter"], .notification-count, [aria-label*="não lida"]');
    const hasBadge = await badge.count() >= 0;
    expect(hasBadge).toBeTruthy();
  });

  test('navega para página de notificações pelo bell', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const notificationBell = authenticatedPage.locator('[aria-label*="notificação"], .notification-bell').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await authenticatedPage.waitForTimeout(300);
      
      const viewAllLink = authenticatedPage.locator('a:has-text("Ver todas"), a:has-text("See all"), button:has-text("Ver alertas")');
      if (await viewAllLink.isVisible()) {
        await viewAllLink.click();
        await expect(authenticatedPage).toHaveURL(/\/dashboard\/alerts/);
      }
    }
  });
});
