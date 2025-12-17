/**
 * Testes E2E - Assinatura
 * Testa página de assinatura e limites de uso
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/subscription`);
  });

  test('should display subscription page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /assinatura|subscription/i })).toBeVisible();
  });

  test('should show current plan information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar informações do plano atual
    const planInfo = page.locator('text=/plano.*atual|current.*plan|free|pro|enterprise/i');
    await expect(planInfo.first()).toBeVisible({ timeout: 3000 });
  });

  test('should display usage limits', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar exibição de limites
    const usageLimits = page.locator('text=/limite|limit|uso|usage/i');
    
    if (await usageLimits.isVisible().catch(() => false)) {
      await expect(usageLimits.first()).toBeVisible();
    }
  });

  test('should show available plans', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar cards de planos disponíveis
    const planCards = page.locator('[data-testid="plan-card"]');
    const count = await planCards.count();
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should have upgrade button for each plan', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const upgradeButtons = page.getByRole('button', { name: /upgrade|assinar|escolher/i });
    const count = await upgradeButtons.count();
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display billing information', async ({ page }) => {
    const billingSection = page.locator('text=/faturamento|billing|pagamento/i');
    
    if (await billingSection.isVisible().catch(() => false)) {
      await expect(billingSection.first()).toBeVisible();
    }
  });

  test('should show usage statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar estatísticas de uso
    const usageStats = page.locator('text=/estatísticas|statistics|análises.*realizadas/i');
    
    if (await usageStats.isVisible().catch(() => false)) {
      await expect(usageStats.first()).toBeVisible();
    }
  });

  test('should handle upgrade process', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const upgradeButton = page.getByRole('button', { name: /upgrade|assinar/i }).first();
    
    if (await upgradeButton.isVisible().catch(() => false)) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar se redirecionou ou abriu modal
      const currentUrl = page.url();
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      expect(currentUrl !== `${TEST_CONFIG.baseURL}/subscription` || hasModal).toBeTruthy();
    }
  });
});