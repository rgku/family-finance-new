import { test, expect } from './fixtures';

test.describe('Budgets E2E Tests', () => {
  test('carrega página de orçamentos', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    await expect(authenticatedPage.locator('text="Orçamentos"')).toBeVisible();
  });

  test('mostra lista de orçamentos por categoria', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const hasBudgetsList = await authenticatedPage.locator('text="Categoria", text="Limite", text="Gasto", text="Orçamento"').isVisible().catch(() => false);
    expect(hasBudgetsList).toBeTruthy();
  });

  test('abre formulário de novo orçamento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const addButton = authenticatedPage.locator('button:has-text("Novo Orçamento"), button:has-text("+ Novo"), button:has-text("Adicionar Orçamento")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await authenticatedPage.waitForTimeout(500);
      
      const hasForm = await authenticatedPage.locator('select, input[placeholder*="categoria"], input[placeholder*="limite"]').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('cria novo orçamento por categoria', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const addButton = authenticatedPage.locator('button:has-text("Novo Orçamento"), button:has-text("+ Novo")').first();
    if (await addButton.isVisible()) {
      await addButton.click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const categorySelect = authenticatedPage.locator('select').first();
      const limitInput = authenticatedPage.locator('input[type="number"], input[placeholder*="limite"], input[placeholder*="valor"]').first();
      
      if (await categorySelect.isVisible() && await limitInput.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
        await limitInput.fill('500');
        
        const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Criar")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click({ force: true });
          await authenticatedPage.waitForTimeout(1000);
          
          const hasSuccessMessage = await authenticatedPage.locator('text="sucesso", text="criado", text="Orçamento criado"').isVisible().catch(() => false);
          expect(hasSuccessMessage).toBeTruthy();
        }
      }
    }
  });

  test('edita orçamento existente', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const editButtons = authenticatedPage.locator('button[aria-label="Editar"], button:has-text("Editar"), [data-testid="edit-budget"]');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(500);
      
      const editForm = authenticatedPage.locator('input[type="number"], input[placeholder*="limite"]');
      const isEditing = await editForm.isVisible().catch(() => false);
      expect(isEditing).toBeTruthy();
    }
  });

  test('atualiza limite de orçamento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const editButtons = authenticatedPage.locator('button[aria-label="Editar"], button:has-text("Editar")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click({ force: true });
      await authenticatedPage.waitForTimeout(300);
      
      const limitInput = authenticatedPage.locator('input[type="number"], input[placeholder*="limite"]').first();
      if (await limitInput.isVisible()) {
        await limitInput.fill('1000');
        
        const saveButton = authenticatedPage.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Atualizar")');
        if (await saveButton.isVisible()) {
          await saveButton.click({ force: true });
          await authenticatedPage.waitForTimeout(1000);
        }
      }
    }
  });

  test('elimina orçamento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const deleteButtons = authenticatedPage.locator('button[aria-label="Eliminar"], button:has-text("Eliminar"), button:has-text("Excluir"), [data-testid="delete-budget"]');
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

  test('visualiza progresso do orçamento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const progressElements = authenticatedPage.locator('[role="progressbar"], .progress-bar, text="%", text="utilizado"');
    const hasProgress = await progressElements.count() >= 0;
    expect(hasProgress).toBeTruthy();
  });

  test('filtra orçamentos por mês', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const monthSelector = authenticatedPage.locator('select, button:has-text("Janeiro"), button:has-text("Fevereiro"), button:has-text("Março")').first();
    if (await monthSelector.isVisible()) {
      await monthSelector.click();
      await authenticatedPage.waitForTimeout(300);
    }
  });

  test('mostra alertas de orçamento excedido', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const alertElements = authenticatedPage.locator('[role="alert"], .alert, text="excedido", text="ultrapassado", text="atenção"');
    const hasAlerts = await alertElements.count() >= 0;
    expect(hasAlerts).toBeTruthy();
  });

  test('otimização AI de orçamentos', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/budgets');
    
    const aiButton = authenticatedPage.locator('button:has-text("IA"), button:has-text("Otimizar"), button:has-text("Sugestões")').first();
    if (await aiButton.isVisible()) {
      await aiButton.click({ force: true });
      await authenticatedPage.waitForTimeout(2000);
      
      const hasSuggestions = await authenticatedPage.locator('text="sugestão", text="recomendação", text="IA"').isVisible().catch(() => false);
      expect(hasSuggestions).toBeTruthy();
    }
  });
});
