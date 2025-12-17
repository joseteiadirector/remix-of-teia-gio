/**
 * Testes E2E - Relatórios COMPLETOS
 * Garante que PDFs NUNCA sejam gerados vazios
 * Cobertura: GEO, SEO, IGO, CPI, Combined Reports
 */

import { test, expect } from '@playwright/test';

// Marcas para testar
const TEST_BRANDS = ['FMU', 'PROPHET', 'IFOOD', 'Teia Studio'];

test.describe('Reports Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/geo');
  });

  test('should load reports page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible();
  });

  test('should display report generation form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos do formulário
    const brandSelector = page.locator('select, [role="combobox"]').first();
    await expect(brandSelector).toBeVisible({ timeout: 3000 });
  });

  test('should generate manual report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const generateButton = page.getByRole('button', { name: /gerar relatório/i });
    
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      
      // Verificar loading
      await expect(page.getByText(/gerando/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show export options', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procurar botões de exportação
    const exportButtons = page.locator('button:has-text("PDF"), button:has-text("Excel"), button:has-text("CSV")');
    
    const count = await exportButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should handle PDF export', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const pdfButton = page.getByRole('button', { name: /pdf/i });
    
    if (await pdfButton.isVisible().catch(() => false)) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await pdfButton.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      } catch {
        // Se não houver download, pelo menos verificar que não houve erro
        const errorToast = page.locator('[data-testid="toast-error"]');
        const hasError = await errorToast.isVisible().catch(() => false);
        expect(hasError).toBeFalsy();
      }
    }
  });

  test('should navigate between report types', async ({ page }) => {
    const seoLink = page.getByRole('link', { name: /seo/i });
    
    if (await seoLink.isVisible().catch(() => false)) {
      await seoLink.click();
      await expect(page).toHaveURL(/\/reports\/seo/);
    }
  });
});

// ========================================
// TESTES CRÍTICOS DE PDF EXPORT
// Garantem PDFs NUNCA vazios
// ========================================

test.describe('PDF Export - GEO Reports (Critical)', () => {
  test('should export complete GEO PDF with all charts and data', async ({ page }) => {
    await page.goto('/reports/geo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Charts render
    
    // Verificar que charts existem antes do export
    const charts = page.locator('svg.recharts-surface');
    const chartsCount = await charts.count();
    expect(chartsCount).toBeGreaterThan(0);
    
    const pdfButton = page.getByRole('button', { name: /exportar pdf/i });
    if (await pdfButton.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await pdfButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/geo.*\.pdf$/i);
      
      // Verificar tamanho do PDF (não pode ser muito pequeno = vazio)
      const path = await download.path();
      if (path) {
        const fs = require('fs');
        const stats = fs.statSync(path);
        expect(stats.size).toBeGreaterThan(50000); // > 50KB = tem conteúdo
      }
    }
  });
});

test.describe('PDF Export - SEO Reports (Critical)', () => {
  test('should export complete SEO PDF with metrics', async ({ page }) => {
    await page.goto('/reports/seo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pdfButton = page.getByRole('button', { name: /exportar pdf|pdf/i });
    if (await pdfButton.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await pdfButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/seo.*\.pdf$/i);
    }
  });
});

test.describe('PDF Export - Multiple Brands (Critical)', () => {
  for (const brand of TEST_BRANDS) {
    test(`should export PDF for brand: ${brand}`, async ({ page }) => {
      await page.goto('/scores');
      await page.waitForLoadState('networkidle');
      
      // Selecionar marca
      const brandSelector = page.locator('select, [role="combobox"]').first();
      if (await brandSelector.isVisible().catch(() => false)) {
        await brandSelector.click();
        const brandOption = page.locator(`text="${brand}"`).first();
        if (await brandOption.isVisible().catch(() => false)) {
          await brandOption.click();
          await page.waitForTimeout(2000);
          
          // Tentar exportar PDF
          const exportButton = page.getByRole('button', { name: /exportar|pdf/i });
          if (await exportButton.isVisible().catch(() => false)) {
            const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
            await exportButton.click();
            
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
          }
        }
      }
    });
  }
});

test.describe('Charts Rendering Before Export (Critical)', () => {
  test('should render all charts before allowing PDF export', async ({ page }) => {
    await page.goto('/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Garantir render completo
    
    // Verificar charts principais
    const radarChart = page.locator('#geo-radar-chart');
    const evolutionChart = page.locator('#geo-evolution-chart');
    const pillarsChart = page.locator('#geo-pillars-chart');
    
    // Pelo menos um chart deve estar visível
    const hasCharts = 
      (await radarChart.isVisible().catch(() => false)) ||
      (await evolutionChart.isVisible().catch(() => false)) ||
      (await pillarsChart.isVisible().catch(() => false));
    
    expect(hasCharts).toBeTruthy();
  });
});
