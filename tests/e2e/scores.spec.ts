/**
 * Testes E2E - Scores GEO e SEO
 * Testa visualização de scores e métricas
 */

import { test, expect } from '@playwright/test';

test.describe('GEO Scores Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scores');
  });

  test('should load scores page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /geo escore/i })).toBeVisible();
  });

  test('should display score cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há cards de score
    const scoreCards = page.locator('[class*="card"]');
    const count = await scoreCards.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should show brand selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const brandSelector = page.locator('select, [role="combobox"]').first();
    await expect(brandSelector).toBeVisible({ timeout: 3000 });
  });

  test('should trigger metrics calculation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const updateButton = page.getByRole('button', { name: /atualizar|calcular/i });
    
    if (await updateButton.isVisible().catch(() => false)) {
      await updateButton.click();
      
      // Verificar loading state
      await expect(page.getByText(/calculando|atualizando/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display charts', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Aguardar renderização de gráficos
    await page.waitForTimeout(2000);
    
    // Verificar se há elementos de gráfico (recharts)
    const charts = page.locator('svg.recharts-surface');
    const hasCharts = await charts.first().isVisible().catch(() => false);
    
    expect(hasCharts).toBeTruthy();
  });
});

test.describe('SEO Scores Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seo-scores');
  });

  test('should load SEO scores page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /seo escore/i })).toBeVisible();
  });

  test('should show comparison metrics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar se há métricas de comparação
    const metrics = page.locator('text=/seo score|geo score|gap/i');
    const count = await metrics.count();
    
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Metrics Pages', () => {
  test('should load SEO metrics page', async ({ page }) => {
    await page.goto('/seo-metrics');
    await expect(page.getByRole('heading', { name: /métricas seo/i })).toBeVisible();
  });

  test('should load GEO metrics page', async ({ page }) => {
    await page.goto('/geo-metrics');
    await expect(page.getByRole('heading', { name: /métricas geo/i })).toBeVisible();
  });
});

// ========================================
// TESTES DE EXPORTAÇÃO PDF - SCORES
// ========================================

test.describe('PDF Export from Scores Page (Critical)', () => {
  test('should export complete GEO scores PDF with all pillars', async ({ page }) => {
    await page.goto('/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Charts + data load
    
    // Verificar pilares renderizados
    const pillars = page.locator('text=/Autoridade|Relevância|Base Técnica|Estrutura|Inteligência/i');
    const pillarsCount = await pillars.count();
    expect(pillarsCount).toBeGreaterThan(0);
    
    // Exportar PDF
    const exportButton = page.getByRole('button', { name: /exportar pdf|export/i });
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      
      // Validar tamanho não-vazio
      const path = await download.path();
      if (path) {
        const fs = require('fs');
        const stats = fs.statSync(path);
        expect(stats.size).toBeGreaterThan(40000); // > 40KB = completo
      }
    }
  });
});

test.describe('SEO Scores Export (Critical)', () => {
  test('should export SEO PDF with metrics comparison', async ({ page }) => {
    await page.goto('/seo-scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const exportButton = page.getByRole('button', { name: /exportar|pdf/i });
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/seo.*\.pdf$/i);
    }
  });
});
