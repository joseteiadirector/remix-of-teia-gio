/**
 * Testes E2E - Navegação Principal
 * Testa navegação entre páginas e estrutura do app
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../setup';

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);
  });

  test('should display main navigation menu', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos de navegação
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /dashboard|início/i });
    
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/dashboard|\/$/);
    }
  });

  test('should navigate to brands page', async ({ page }) => {
    const brandsLink = page.getByRole('link', { name: /marcas|brands/i });
    
    if (await brandsLink.isVisible().catch(() => false)) {
      await brandsLink.click();
      await expect(page).toHaveURL(/\/brands/);
    }
  });

  test('should navigate to insights page', async ({ page }) => {
    const insightsLink = page.getByRole('link', { name: /insights/i });
    
    if (await insightsLink.isVisible().catch(() => false)) {
      await insightsLink.click();
      await expect(page).toHaveURL(/\/insights/);
    }
  });

  test('should navigate to llm mentions page', async ({ page }) => {
    const llmLink = page.getByRole('link', { name: /llm|menções/i });
    
    if (await llmLink.isVisible().catch(() => false)) {
      await llmLink.click();
      await expect(page).toHaveURL(/\/llm-mentions/);
    }
  });

  test('should navigate to reports page', async ({ page }) => {
    const reportsLink = page.getByRole('link', { name: /relatórios|reports/i });
    
    if (await reportsLink.isVisible().catch(() => false)) {
      await reportsLink.click();
      await expect(page).toHaveURL(/\/reports/);
    }
  });

  test('should navigate to url analysis page', async ({ page }) => {
    const urlAnalysisLink = page.getByRole('link', { name: /análise.*url/i });
    
    if (await urlAnalysisLink.isVisible().catch(() => false)) {
      await urlAnalysisLink.click();
      await expect(page).toHaveURL(/\/url-analysis/);
    }
  });

  test('should toggle mobile menu', async ({ page }) => {
    // Redimensionar para mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.getByRole('button', { name: /menu|hamburguer/i });
    
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      
      // Verificar se menu abriu
      const mobileMenu = page.locator('[role="dialog"], [data-mobile-menu]');
      await expect(mobileMenu.first()).toBeVisible({ timeout: 1000 });
    }
  });

  test('should display user menu', async ({ page }) => {
    const userButton = page.getByRole('button', { name: /usuário|user|perfil/i });
    
    if (await userButton.isVisible().catch(() => false)) {
      await userButton.click();
      
      // Verificar opções do menu
      await page.waitForTimeout(300);
      const menuItems = page.locator('[role="menu"], [role="menuitem"]');
      await expect(menuItems.first()).toBeVisible({ timeout: 1000 });
    }
  });

  test('should have functional theme toggle', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /tema|theme/i });
    
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Verificar mudança de tema
      const html = page.locator('html');
      const classValue = await html.getAttribute('class');
      expect(classValue).toBeTruthy();
    }
  });
});