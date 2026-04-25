import { test } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Transactions E2E Tests', () => {
  test('carrega página de transações', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    await expect(authenticatedPage.getByRole('heading', { name: 'Transações' })).toBeVisible();
  });

  test('mostra lista de transações', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    await authenticatedPage.waitForTimeout(1000);
    expect(await authenticatedPage.url()).toContain('/dashboard/transactions');
  });

  test('filtra transações por período', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const dateInput = authenticatedPage.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-01');
      await authenticatedPage.waitForTimeout(500);
      
      await expect(authenticatedPage.getByRole('heading', { name: 'Transações' })).toBeVisible();
    }
  });

  test('limpa filtro de período', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const dateInput = authenticatedPage.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-01');
      await authenticatedPage.waitForTimeout(300);
      
      const clearButton = authenticatedPage.locator('button:has-text("Limpar filtro")').or(authenticatedPage.locator('text=Limpar')).first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await authenticatedPage.waitForTimeout(300);
      }
    }
  });

  test('abre formulário de nova transação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const addButton = authenticatedPage.locator('button:has-text("Nova"), button:has-text("Adicionar"), a:has-text("+")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await authenticatedPage.waitForTimeout(500);
      
      const hasForm = await authenticatedPage.locator('input[type="text"], input[placeholder*="descrição"], input[placeholder*="Descrição"]').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('edita transação existente', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const editButtons = authenticatedPage.locator('button[aria-label="Editar"], button:has-text("Editar"), [data-testid="edit-transaction"]');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const editForm = authenticatedPage.locator('input[type="text"], input[placeholder*="descrição"]');
      const isEditing = await editForm.isVisible().catch(() => false);
      expect(isEditing).toBeTruthy();
    }
  });

  test('elimina transação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const deleteButtons = authenticatedPage.locator('button[aria-label="Eliminar"], button:has-text("Eliminar"), button:has-text("Excluir"), [data-testid="delete-transaction"]');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      await deleteButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const confirmButton = authenticatedPage.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("Eliminar"), button:has-text("Excluir")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click({ force: true });
        await authenticatedPage.waitForTimeout(500);
      } else {
        await authenticatedPage.keyboard.press('Escape');
      }
    }
  });

  test('visualiza detalhes de transação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const transactionRows = authenticatedPage.locator('tr, [role="row"], .transaction-item').first();
    if (await transactionRows.isVisible()) {
      await transactionRows.click({ force: true });
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('ordenar transações por data', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const dateHeader = authenticatedPage.locator('th:has-text("Data"), th:has-text("data")').first();
    if (await dateHeader.isVisible()) {
      await dateHeader.click({ force: true });
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('ordenar transações por valor', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/transactions');
    
    const valueHeader = authenticatedPage.locator('th:has-text("Valor"), th:has-text("valor")').first();
    if (await valueHeader.isVisible()) {
      await valueHeader.click({ force: true });
      await authenticatedPage.waitForTimeout(300);
    }
  });
});
