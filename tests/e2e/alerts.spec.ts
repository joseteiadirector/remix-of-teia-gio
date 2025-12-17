/**
 * Testes E2E - Alertas
 * Testa sistema de alertas e notificações
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('Alerts System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/alerts`);
  });

  test('should display alerts page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /alertas|alerts/i })).toBeVisible();
  });

  test('should show alerts list or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há lista de alertas ou estado vazio
    const alertsList = page.locator('[data-testid="alerts-list"]');
    const emptyState = page.locator('text=/nenhum.*alerta|sem.*alertas|no.*alerts/i');
    
    const hasAlerts = await alertsList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasAlerts || isEmpty).toBeTruthy();
  });

  test('should filter alerts by status', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const filterButton = page.getByRole('button', { name: /filtrar|filter/i });
    
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(300);
      
      // Verificar opções de filtro
      const filterOptions = page.locator('[role="menuitem"], [role="option"]');
      const count = await filterOptions.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display alert details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procurar por primeiro alerta
    const firstAlert = page.locator('[data-testid="alert-item"]').first();
    
    if (await firstAlert.isVisible().catch(() => false)) {
      await firstAlert.click();
      await page.waitForTimeout(500);
      
      // Verificar se detalhes aparecem
      const alertDetails = page.locator('[data-testid="alert-details"]');
      await expect(alertDetails).toBeVisible({ timeout: 2000 });
    }
  });

  test('should mark alert as read', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const markReadButton = page.getByRole('button', { name: /marcar.*lido|mark.*read/i });
    
    if (await markReadButton.isVisible().catch(() => false)) {
      await markReadButton.click();
      await page.waitForTimeout(500);
      
      // Verificar feedback
      const toast = page.locator('[role="status"], [data-sonner-toast]');
      await expect(toast.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should configure alert preferences', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /configurar|settings|preferências/i });
    
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Verificar modal ou página de configurações
      const settingsModal = page.locator('[role="dialog"], [data-settings]');
      await expect(settingsModal.first()).toBeVisible({ timeout: 2000 });
    }
  });
});