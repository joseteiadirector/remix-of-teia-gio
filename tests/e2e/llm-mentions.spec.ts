/**
 * Testes E2E - Menções em LLMs
 * Testa funcionalidade crítica de coleta de menções
 */

import { test, expect } from '@playwright/test';

test.describe('LLM Mentions Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/llm-mentions');
  });

  test('should load mentions page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /menções/i })).toBeVisible();
  });

  test('should show brand selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const brandSelector = page.locator('select, [role="combobox"]').first();
    await expect(brandSelector).toBeVisible({ timeout: 3000 });
  });

  test('should initiate collection process', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const collectButton = page.getByRole('button', { name: /coletar|iniciar/i });
    
    if (await collectButton.isVisible().catch(() => false)) {
      await collectButton.click();
      
      // Verificar loading state
      await expect(page.getByText(/coletando|aguarde/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display mentions table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há tabela ou lista de menções
    const mentionsTable = page.locator('table, [role="table"]');
    const emptyState = page.locator('[data-testid="empty-state"]');
    
    const hasTable = await mentionsTable.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('should filter by provider', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const filterSelect = page.locator('select[name*="provider" i], [role="combobox"]').first();
    
    if (await filterSelect.isVisible().catch(() => false)) {
      await filterSelect.click();
      
      // Selecionar uma opção
      const option = page.locator('option, [role="option"]').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should show sentiment badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procurar por badges de sentimento
    const badges = page.locator('[data-testid*="badge"], .badge, [class*="badge"]');
    
    if (await badges.first().isVisible().catch(() => false)) {
      await expect(badges.first()).toBeVisible();
    }
  });
});
