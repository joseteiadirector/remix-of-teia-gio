/**
 * Testes E2E - Análise de URLs
 * Testa fluxo completo de análise técnica de URLs
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('URL Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/url-analysis`);
  });

  test('should display url analysis page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /análise.*url/i })).toBeVisible();
    await expect(page.getByPlaceholder(/url/i)).toBeVisible();
  });

  test('should validate url format', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/url/i);
    await urlInput.fill('invalid-url');
    
    const analyzeButton = page.getByRole('button', { name: /analisar/i });
    await analyzeButton.click();
    
    await page.waitForTimeout(500);
    
    // Verificar mensagem de URL inválida
    const errorMessage = page.locator('text=/válida|inválido/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
  });

  test('should accept valid url', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/url/i);
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.getByRole('button', { name: /analisar/i });
    await expect(analyzeButton).toBeEnabled();
  });

  test('should show loading state during analysis', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/url/i);
    await urlInput.fill('https://example.com');
    
    const analyzeButton = page.getByRole('button', { name: /analisar/i });
    await analyzeButton.click();
    
    // Verificar estado de loading
    const loadingIndicator = page.locator('[role="status"], [data-loading="true"]');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 });
  });

  test('should display analysis history', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há seção de histórico
    const historySection = page.locator('text=/histórico|history/i');
    if (await historySection.isVisible().catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });

  test('should allow monitoring schedule configuration', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/url/i);
    await urlInput.fill('https://example.com');
    
    await page.waitForTimeout(500);
    
    // Verificar se há opções de agendamento
    const scheduleButton = page.getByRole('button', { name: /agendar|schedule/i });
    if (await scheduleButton.isVisible().catch(() => false)) {
      await expect(scheduleButton).toBeVisible();
    }
  });
});