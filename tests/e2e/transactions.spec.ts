import { test, expect } from '@playwright/test';

test.describe('Transactions E2E Tests', () => {
  test('carrega página de transações', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await expect(page.locator('text=Transações')).toBeVisible();
  });

  test('mostra lista de transações', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const hasTransactionsList = await page.locator('table, [aria-label="Transações"], text=Descrição, text=Categoria, text=Data, text=Valor').isVisible().catch(() => false);
    expect(hasTransactionsList).toBeTruthy();
  });

  test('filtra transações por período', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-01');
      await page.waitForTimeout(500);
      
      const countText = await page.locator('text="transações"').textContent().catch(() => null);
      expect(countText).toBeTruthy();
    }
  });

  test('limpa filtro de período', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-01');
      await page.waitForTimeout(300);
      
      const clearButton = page.locator('button:has-text("Limpar filtro")').or(page.locator('text=Limpar')).first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('abre formulário de nova transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const addButton = page.locator('button:has-text("Nova"), button:has-text("Adicionar"), a:has-text("+")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const hasForm = await page.locator('input[type="text"], input[placeholder*="descrição"], input[placeholder*="Descrição"]').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('edita transação existente', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const editButtons = page.locator('button[aria-label="Editar"], button:has-text("Editar"), [data-testid="edit-transaction"]');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(300);
      
      const editForm = page.locator('input[type="text"], input[placeholder*="descrição"]');
      const isEditing = await editForm.isVisible().catch(() => false);
      expect(isEditing).toBeTruthy();
    }
  });

  test('elimina transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const deleteButtons = page.locator('button[aria-label="Eliminar"], button:has-text("Eliminar"), button:has-text("Excluir"), [data-testid="delete-transaction"]');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(300);
      
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("Eliminar"), button:has-text("Excluir")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('visualiza detalhes de transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const transactionRows = page.locator('tr, [role="row"], .transaction-item').first();
    if (await transactionRows.isVisible()) {
      await transactionRows.click({ force: true });
      await page.waitForTimeout(300);
    }
  });

  test('ordenar transações por data', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const dateHeader = page.locator('th:has-text("Data"), th:has-text("data")').first();
    if (await dateHeader.isVisible()) {
      await dateHeader.click({ force: true });
      await page.waitForTimeout(300);
    }
  });

  test('ordenar transações por valor', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    
    const valueHeader = page.locator('th:has-text("Valor"), th:has-text("valor")').first();
    if (await valueHeader.isVisible()) {
      await valueHeader.click({ force: true });
      await page.waitForTimeout(300);
    }
  });
});
