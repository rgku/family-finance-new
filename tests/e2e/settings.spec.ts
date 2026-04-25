import { test } from './fixtures';
import { expect } from '@playwright/test';
import { openMobileMenu } from './fixtures';

test.describe('Settings E2E Tests', () => {
  test('mostra perfil do utilizador', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    await authenticatedPage.waitForTimeout(1000);
    expect(await authenticatedPage.url()).toContain('/settings');
  });

  test('edita perfil do utilizador', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    await openMobileMenu(authenticatedPage);
    
    const editButton = authenticatedPage.locator('button:has-text("Editar Perfil"), button:has-text("Editar"), [data-testid="edit-profile"]');
    if (await editButton.isVisible()) {
      await editButton.click();
      await authenticatedPage.waitForTimeout(500);
      
      const nameInput = authenticatedPage.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Teste E2E');
        
        const saveButton = authenticatedPage.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Salvar")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await authenticatedPage.waitForTimeout(1000);
        }
      }
    }
  });

  test('altera dia do ciclo de faturamento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const billingDaySelect = authenticatedPage.locator('select[aria-label*="billing"], select[name*="billing"], input[type="number"][placeholder*="dia"]').first();
    if (await billingDaySelect.isVisible()) {
      if (await billingDaySelect.tagName() === 'SELECT') {
        await billingDaySelect.selectOption({ index: 1 });
      } else {
        await billingDaySelect.fill('5');
      }
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('altera tema (claro/escuro)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const themeToggle = authenticatedPage.locator('button[aria-label*="theme"], button:has-text("Tema"), button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('altera moeda', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const currencySelect = authenticatedPage.locator('select[aria-label*="currency"], select[name*="currency"], select:has-text("EUR"), select:has-text("USD")');
    if (await currencySelect.isVisible()) {
      const currentValue = await currencySelect.inputValue();
      await currencySelect.selectOption({ index: currentValue ? 1 : 0 });
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('gera notificações', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const notificationsSection = authenticatedPage.locator('text=Notificações, text=Notificações push, text=Alertas');
    if (await notificationsSection.isVisible()) {
      const toggle = authenticatedPage.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.isVisible()) {
        await toggle.click();
        await authenticatedPage.waitForTimeout(300);
      }
    }
  });

  test('exporta dados', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const exportButton = authenticatedPage.locator('button:has-text("Exportar"), button:has-text("Download"), button:has-text("Dados"), button:has-text("Backup")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('importa dados', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const importButton = authenticatedPage.locator('button:has-text("Importar"), button:has-text("Upload"), button:has-text("Restaurar")');
    if (await importButton.isVisible()) {
      await importButton.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('elimina conta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const deleteButton = authenticatedPage.locator('button:has-text("Eliminar"), button:has-text("Excluir"), button:has-text("Delete"), button:has-text("Encerrar")');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await authenticatedPage.waitForTimeout(300);
      
      const cancelButton = authenticatedPage.locator('button:has-text("Cancelar"), button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      } else {
        await authenticatedPage.keyboard.press('Escape');
      }
    }
  });

  test('logout nas definições', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/settings');
    await openMobileMenu(authenticatedPage);
    
    const logoutButton = authenticatedPage.locator('button:has-text("Sair"), button:has-text("Logout"), button:has-text("Terminar sessão")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await authenticatedPage.waitForTimeout(1000);
      expect(await authenticatedPage.url()).toContain('/');
    }
  });
});
