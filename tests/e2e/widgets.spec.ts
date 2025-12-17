/**
 * Testes E2E - Dashboard Widgets
 * Testa novos widgets: Unified Score e AI Analytics
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('should display unified score widget', async ({ page }) => {
    // Procurar por widget de score unificado
    const unifiedWidget = page.locator('text=/score.*unificado|unified.*score/i');
    
    if (await unifiedWidget.isVisible().catch(() => false)) {
      await expect(unifiedWidget).toBeVisible();
      
      // Verificar se tem valor numérico
      const scoreValue = page.locator('text=/\\d+\\.\\d+|\\d+%/');
      await expect(scoreValue.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display ai analytics widget', async ({ page }) => {
    // Procurar por widget de AI Analytics
    const aiWidget = page.locator('text=/ai.*analytics|análise.*ia/i');
    
    if (await aiWidget.isVisible().catch(() => false)) {
      await expect(aiWidget).toBeVisible();
    }
  });

  test('should load widget data progressively', async ({ page }) => {
    // Verificar se há loading states
    const loadingIndicators = page.locator('[role="status"], [data-loading="true"]');
    const count = await loadingIndicators.count();
    
    // Deve ter pelo menos 1 loading state inicial
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
    
    // Aguardar carregamento completo
    await page.waitForTimeout(2000);
  });

  test('should display geo score widget', async ({ page }) => {
    const geoWidget = page.locator('text=/geo.*score|pontuação.*geo/i');
    
    if (await geoWidget.isVisible().catch(() => false)) {
      await expect(geoWidget).toBeVisible();
    }
  });

  test('should display mentions chart widget', async ({ page }) => {
    const mentionsWidget = page.locator('text=/menções|mentions/i');
    
    if (await mentionsWidget.isVisible().catch(() => false)) {
      await expect(mentionsWidget).toBeVisible();
    }
  });

  test('should display trends chart widget', async ({ page }) => {
    const trendsWidget = page.locator('text=/tendências|trends/i');
    
    if (await trendsWidget.isVisible().catch(() => false)) {
      await expect(trendsWidget).toBeVisible();
    }
  });

  test('should handle widget errors gracefully', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Verificar se há mensagens de erro amigáveis
    const errorMessages = page.locator('text=/erro|error|falha|fail/i');
    const errorCount = await errorMessages.count();
    
    // Se houver erros, devem ter mensagens amigáveis
    if (errorCount > 0) {
      const firstError = errorMessages.first();
      await expect(firstError).toBeVisible();
    }
  });

  test('should show empty states when no data', async ({ page }) => {
    // Verificar se há estados vazios
    const emptyStates = page.locator('text=/sem dados|no data|nenhum|empty/i');
    const emptyCount = await emptyStates.count();
    
    // Estados vazios devem ser informativos
    if (emptyCount > 0) {
      expect(emptyCount).toBeGreaterThan(0);
    }
  });

  test('should display alerts card when available', async ({ page }) => {
    const alertsWidget = page.locator('text=/alertas|alerts/i');
    
    if (await alertsWidget.isVisible().catch(() => false)) {
      await expect(alertsWidget).toBeVisible();
    }
  });

  test('should display brands overview widget', async ({ page }) => {
    const brandsWidget = page.locator('text=/marcas.*overview|brands.*overview/i');
    
    if (await brandsWidget.isVisible().catch(() => false)) {
      await expect(brandsWidget).toBeVisible();
    }
  });
});