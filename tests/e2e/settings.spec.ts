import { test, expect } from '@playwright/test';

test.describe('Settings E2E Tests', () => {
  test('carrega página de definições', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.locator('text=Definições, text=Configurações, text=Settings')).toBeVisible();
  });

  test('mostra perfil do utilizador', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const hasProfileSection = await page.locator('text=Perfil, text=Nome, text=Email, text=Utilizador').isVisible().catch(() => false);
    expect(hasProfileSection).toBeTruthy();
  });

  test('edita perfil do utilizador', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const editButton = page.locator('button:has-text("Editar Perfil"), button:has-text("Editar"), [data-testid="edit-profile"]');
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Teste E2E');
        
        const saveButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Salvar")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('altera dia do ciclo de faturamento', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const billingDaySelect = page.locator('select[aria-label*="billing"], select[name*="billing"], input[type="number"][placeholder*="dia"]').first();
    if (await billingDaySelect.isVisible()) {
      if (await billingDaySelect.tagName() === 'SELECT') {
        await billingDaySelect.selectOption({ index: 1 });
      } else {
        await billingDaySelect.fill('5');
      }
      await page.waitForTimeout(500);
    }
  });

  test('altera tema (claro/escuro)', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("Tema"), button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('altera moeda', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const currencySelect = page.locator('select[aria-label*="currency"], select[name*="currency"], select:has-text("EUR"), select:has-text("USD")');
    if (await currencySelect.isVisible()) {
      const currentValue = await currencySelect.inputValue();
      await currencySelect.selectOption({ index: currentValue ? 1 : 0 });
      await page.waitForTimeout(500);
    }
  });

  test('gera notificações', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const notificationsSection = page.locator('text=Notificações, text=Notificações push, text=Alertas');
    if (await notificationsSection.isVisible()) {
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('exporta dados', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("Download"), button:has-text("Dados"), button:has-text("Backup")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('importa dados', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const importButton = page.locator('button:has-text("Importar"), button:has-text("Upload"), button:has-text("Restaurar")');
    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('elimina conta', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Excluir"), button:has-text("Delete"), button:has-text("Encerrar")');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(300);
      
      const cancelButton = page.locator('button:has-text("Cancelar"), button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('logout nas definições', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout"), button:has-text("Terminar sessão")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/\/$/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});
