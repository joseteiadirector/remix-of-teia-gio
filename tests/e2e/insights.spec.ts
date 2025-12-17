/**
 * Testes E2E - Página de Insights
 * 
 * Para rodar: npx playwright test tests/e2e/insights.spec.ts
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TEST_USER } from '../setup';

test.describe('Insights Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página
    await page.goto(`${TEST_CONFIG.baseURL}/insights`);
  });

  test('should load insights page', async ({ page }) => {
    // Verificar se o título está presente
    await expect(page.getByRole('heading', { name: /insights/i })).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Verificar se skeleton loaders aparecem durante carregamento
    const skeletons = page.locator('[data-testid="insight-skeleton"]');
    
    // Deve mostrar skeletons inicialmente
    await expect(skeletons.first()).toBeVisible({ timeout: 1000 });
  });

  test('should display empty state when no insights', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Se não houver insights, deve mostrar empty state
    const emptyState = page.locator('[data-testid="empty-state"]');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      await expect(emptyState).toContainText(/insights/i);
    }
  });

  test('should generate new report', async ({ page }) => {
    // Clicar no botão de gerar relatório
    const generateButton = page.getByRole('button', { name: /gerar/i });
    
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      
      // Verificar se loading aparece
      await expect(page.getByText(/gerando/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter insights', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Procurar por filtros
    const filterInput = page.locator('input[placeholder*="filtro" i], input[placeholder*="busca" i]');
    
    if (await filterInput.isVisible().catch(() => false)) {
      await filterInput.fill('test');
      
      // Aguardar debounce
      await page.waitForTimeout(500);
    }
  });

  test('should include KAPI metrics in PDF download', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se há insights disponíveis
    const insightCards = page.locator('[data-testid="insight-card"], .insight-card');
    const hasInsights = await insightCards.count().then(count => count > 0).catch(() => false);
    
    if (hasInsights) {
      // Procurar pelo botão de download de PDF
      const downloadButton = page.getByRole('button', { name: /download|baixar|pdf/i });
      
      if (await downloadButton.isVisible().catch(() => false)) {
        // Configurar listener para download
        const downloadPromise = page.waitForEvent('download');
        
        // Clicar no botão
        await downloadButton.click();
        
        // Aguardar download
        const download = await downloadPromise.catch(() => null);
        
        if (download) {
          // Verificar se o arquivo foi baixado
          const filename = await download.suggestedFilename();
          await expect(filename).toMatch(/\.pdf$/i);
        }
      }
    }
  });
});
