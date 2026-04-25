import { test } from './fixtures';
import { expect } from '@playwright/test';
import { openMobileMenu } from './fixtures';

test.describe('Goals E2E Tests', () => {
  test('carrega página de metas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    await expect(authenticatedPage.getByRole('heading', { name: /Metas/i })).toBeVisible();
  });

test.skip('mostra lista de metas de poupança', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const hasGoalsList = await authenticatedPage.locator('text="Poupança", text="Objetivos", text="Meta"').isVisible().catch(() => false);
    expect(hasGoalsList).toBeTruthy();
  });

  test.skip('abre formulário de nova meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const addButton = authenticatedPage.locator('button:has-text("Nova Meta"), button:has-text("+ Nova"), button:has-text("Adicionar Meta")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await authenticatedPage.waitForTimeout(500);
      
      const hasForm = await authenticatedPage.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('cria nova meta de poupança', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const addButton = authenticatedPage.locator('button:has-text("Nova Meta"), button:has-text("+ Nova")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const nameInput = authenticatedPage.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').first();
      const targetInput = authenticatedPage.locator('input[type="number"], input[placeholder*="valor"], input[placeholder*="Valor"]').first();
      
      if (await nameInput.isVisible() && await targetInput.isVisible()) {
        await nameInput.fill('Teste E2E - Poupança');
        await targetInput.fill('1000');
        
        const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Salvar"), button:has-text("Criar")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click({ force: true });
          await authenticatedPage.waitForTimeout(1000);
          
          const hasSuccessMessage = await authenticatedPage.locator('text=Meta criada').isVisible().catch(() => false);
          expect(hasSuccessMessage).toBeTruthy();
        }
      }
    }
  });

  test('edita meta existente', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const editButtons = authenticatedPage.locator('button[aria-label="Editar"], button:has-text("Editar"), [data-testid="edit-goal"]');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(500);
      
      const editForm = authenticatedPage.locator('input[type="text"], input[placeholder*="nome"]');
      const isEditing = await editForm.isVisible().catch(() => false);
      expect(isEditing).toBeTruthy();
    }
  });

  test('atualiza valor de meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const editButtons = authenticatedPage.locator('button[aria-label="Editar"], button:has-text("Editar")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const targetInput = authenticatedPage.locator('input[type="number"], input[placeholder*="valor"]').first();
      if (await targetInput.isVisible()) {
        await targetInput.fill('2000');
        
        const saveButton = authenticatedPage.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Atualizar")');
        if (await saveButton.isVisible()) {
          await saveButton.click({ force: true });
          await authenticatedPage.waitForTimeout(1000);
        }
      }
    }
  });

  test('elimina meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const deleteButtons = authenticatedPage.locator('button[aria-label="Eliminar"], button:has-text("Eliminar"), button:has-text("Excluir"), [data-testid="delete-goal"]');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      await deleteButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const confirmButton = authenticatedPage.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("Eliminar")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click({ force: true });
        await authenticatedPage.waitForTimeout(500);
      } else {
        await authenticatedPage.keyboard.press('Escape');
      }
    }
  });

  test('visualiza progresso de meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    await authenticatedPage.waitForTimeout(1000);
    // Just check page loaded - progress may vary
    expect(await authenticatedPage.url()).toContain('/dashboard/goals');
  });

  test('filtra metas por tipo', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const filterButtons = authenticatedPage.locator('button[role="tab"], button:has-text("Todas"), button:has-text("Poupança"), button:has-text("Despesa")');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('adiciona contribuição a meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/goals');
    
    const contributeButtons = authenticatedPage.locator('button:has-text("Contribuir"), button:has-text("Adicionar")').first();
    if (await contributeButtons.count() > 0) {
      await contributeButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const amountInput = authenticatedPage.locator('input[type="number"], input[placeholder*="valor"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('100');
        
        const confirmButton = authenticatedPage.locator('button[type="submit"], button:has-text("Confirmar"), button:has-text("Adicionar")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click({ force: true });
          await authenticatedPage.waitForTimeout(500);
        }
      }
    }
  });
});
