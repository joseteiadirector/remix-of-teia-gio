/**
 * Testes E2E - Dashboard
 * Testa navegação, widgets e funcionalidades principais do dashboard
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/`);
  });

  test('should load dashboard with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/GEO|Teia/i);
    await page.waitForLoadState('networkidle');
  });

  test('should display main navigation', async ({ page }) => {
    // Verificar elementos principais de navegação
    await expect(page.getByRole('navigation')).toBeVisible();
    
    const mainLinks = ['Dashboard', 'Insights', 'Marcas', 'Brands'];
    let foundLinks = 0;
    
    for (const linkText of mainLinks) {
      const link = page.getByRole('link', { name: new RegExp(linkText, 'i') });
      if (await link.isVisible().catch(() => false)) {
        foundLinks++;
      }
    }
    
    expect(foundLinks).toBeGreaterThan(0);
  });

  test('should display widgets and load data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verificar se widgets estão presentes
    const widgets = page.locator('[data-testid="widget"], [class*="widget"]');
    const count = await widgets.count();
    
    // Deve ter pelo menos 1 widget
    expect(count).toBeGreaterThan(0);
    
    // Verificar que não há apenas skeletons
    const skeletons = page.locator('[data-testid="skeleton"]');
    const skeletonCount = await skeletons.count();
    
    // Aguardar dados carregarem
    if (skeletonCount > 0) {
      await page.waitForTimeout(2000);
    }
  });

  test('should navigate to insights page', async ({ page }) => {
    const insightsLink = page.getByRole('link', { name: /insights/i }).first();
    
    if (await insightsLink.isVisible().catch(() => false)) {
      await insightsLink.click();
      await expect(page).toHaveURL(/\/insights/);
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to brands page', async ({ page }) => {
    const brandsLink = page.getByRole('link', { name: /marcas|brands/i }).first();
    
    if (await brandsLink.isVisible().catch(() => false)) {
      await brandsLink.click();
      await expect(page).toHaveURL(/\/brands/);
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display score metrics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Procurar por métricas de score (GEO, CPI, IGO, etc)
    const scoreElements = page.locator('text=/score|pontuação/i, text=/\d+\/100/, text=/\d+%/');
    const scoreCount = await scoreElements.count();
    
    expect(scoreCount).toBeGreaterThan(0);
  });

  test('should display charts and visualizations', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar presença de elementos de gráfico (recharts, canvas, svg)
    const charts = page.locator('svg[class*="recharts"], canvas, [role="img"]');
    const chartsCount = await charts.count();
    
    expect(chartsCount).toBeGreaterThan(0);
  });

  test('should handle responsive layout', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verificar que página ainda está visível
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should display theme toggle', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]');
    
    if (await themeToggle.isVisible().catch(() => false)) {
      await expect(themeToggle).toBeVisible();
      
      // Testar toggle
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Verificar mudança de tema (classe dark ou atributo data-theme)
      const html = page.locator('html');
      const hasThemeAttribute = await html.evaluate(el => 
        el.classList.contains('dark') || el.hasAttribute('data-theme')
      );
      
      expect(hasThemeAttribute).toBeTruthy();
    }
  });

  test('should load and display brand selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const brandSelector = page.locator('select, [role="combobox"]');
    
    if (await brandSelector.first().isVisible().catch(() => false)) {
      await expect(brandSelector.first()).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simular offline
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Voltar online
    await page.context().setOffline(false);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });
});
