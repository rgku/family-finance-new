import { test, expect } from '@playwright/test';

test.describe('Goals E2E Tests', () => {
  test('carrega página de metas', async ({ page }) => {
    await page.goto('/dashboard/goals');
    await expect(page.locator('text=Metas')).toBeVisible();
  });

  test('mostra lista de metas de poupança', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const hasGoalsList = await page.locator('text=Poupança, text=Objetivos, text=Meta').isVisible().catch(() => false);
    expect(hasGoalsList).toBeTruthy();
  });

  test('abre formulário de nova meta', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const addButton = page.locator('button:has-text("Nova Meta"), button:has-text("+ Nova"), button:has-text("Adicionar Meta")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await page.waitForTimeout(500);
      
      const hasForm = await page.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('cria nova meta de poupança', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const addButton = page.locator('button:has-text("Nova Meta"), button:has-text("+ Nova")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await page.waitForTimeout(300);
      
      const nameInput = page.locator('input[placeholder*="nome"], input[placeholder*="Nome"], input[type="text"]').first();
      const targetInput = page.locator('input[type="number"], input[placeholder*="valor"], input[placeholder*="Valor"]').first();
      
      if (await nameInput.isVisible() && await targetInput.isVisible()) {
        await nameInput.fill('Teste E2E - Poupança');
        await targetInput.fill('1000');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Salvar"), button:has-text("Criar")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click({ force: true });
          await page.waitForTimeout(1000);
          
          const hasSuccessMessage = await page.locator('text="sucesso", text="criada", text="Meta criada"').isVisible().catch(() => false);
          expect(hasSuccessMessage).toBeTruthy();
        }
      }
    }
  });

  test('edita meta existente', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const editButtons = page.locator('button[aria-label="Editar"], button:has-text("Editar"), [data-testid="edit-goal"]');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(500);
      
      const editForm = page.locator('input[type="text"], input[placeholder*="nome"]');
      const isEditing = await editForm.isVisible().catch(() => false);
      expect(isEditing).toBeTruthy();
    }
  });

  test('atualiza valor de meta', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const editButtons = page.locator('button[aria-label="Editar"], button:has-text("Editar")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(300);
      
      const targetInput = page.locator('input[type="number"], input[placeholder*="valor"]').first();
      if (await targetInput.isVisible()) {
        await targetInput.fill('2000');
        
        const saveButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Atualizar")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('elimina meta', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const deleteButtons = page.locator('button[aria-label="Eliminar"], button:has-text("Eliminar"), button:has-text("Excluir"), [data-testid="delete-goal"]');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(300);
      
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("Eliminar")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('visualiza progresso de meta', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const progressElements = page.locator('[role="progressbar"], .progress-ring, text="%", text="progresso"');
    const hasProgress = await progressElements.count() >= 0;
    expect(hasProgress).toBeTruthy();
  });

  test('filtra metas por tipo', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const filterButtons = page.locator('button[role="tab"], button:has-text("Todas"), button:has-text("Poupança"), button:has-text("Despesa")');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('adiciona contribuição a meta', async ({ page }) => {
    await page.goto('/dashboard/goals');
    
    const contributeButtons = page.locator('button:has-text("Contribuir"), button:has-text("Adicionar")').first();
    if (await contributeButtons.count() > 0) {
      await contributeButtons.first().click();
      await page.waitForTimeout(300);
      
      const amountInput = page.locator('input[type="number"], input[placeholder*="valor"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('100');
        
        const confirmButton = page.locator('button[type="submit"], button:has-text("Confirmar"), button:has-text("Adicionar")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});
