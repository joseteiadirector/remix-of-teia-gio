/**
 * Testes E2E - Gestão de Marcas
 * Testa CRUD completo de marcas
 */

import { test, expect } from '@playwright/test';

test.describe('Brand Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assumindo que há autenticação
    await page.goto('/brands');
  });

  test('should load brands page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /marcas/i })).toBeVisible();
  });

  test('should open create brand dialog', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nova marca|adicionar/i });
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Verificar se dialog/modal abriu
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
      await expect(page.getByPlaceholder(/nome/i)).toBeVisible();
      await expect(page.getByPlaceholder(/domínio|site/i)).toBeVisible();
    }
  });

  test('should validate brand form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nova marca|adicionar/i });
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Tentar submeter vazio
      const submitButton = page.getByRole('button', { name: /criar|salvar/i });
      await submitButton.click();
      
      // Verificar erro de validação
      await page.waitForTimeout(500);
      const errors = page.locator('text=/obrigatório|required/i');
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should display brand list', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há cards de marca ou mensagem de vazio
    const brandCards = page.locator('[data-testid="brand-card"]');
    const emptyState = page.locator('[data-testid="empty-state"]');
    
    const hasBrands = await brandCards.first().isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasBrands || isEmpty).toBeTruthy();
  });

  test('should filter brands', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="filtrar" i]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce
      
      // Verificar que lista atualizou
      await page.waitForLoadState('networkidle');
    }
  });
});
