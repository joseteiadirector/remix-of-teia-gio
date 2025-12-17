/**
 * Test Helpers
 * Funções auxiliares reutilizáveis para testes E2E
 */

import { Page, expect } from '@playwright/test';
import { TEST_USER, TEST_BRAND } from '../setup';

/**
 * Faz login com credenciais de teste
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/auth');
  
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/senha|password/i);
  const submitButton = page.getByRole('button', { name: /entrar|login/i });
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();
  
  // Aguardar redirecionamento
  await page.waitForURL(/\/dashboard|\/$/);
}

/**
 * Faz logout da aplicação
 */
export async function logout(page: Page) {
  const userButton = page.getByRole('button', { name: /usuário|user|perfil/i });
  
  if (await userButton.isVisible().catch(() => false)) {
    await userButton.click();
    await page.waitForTimeout(300);
    
    const logoutButton = page.getByRole('menuitem', { name: /sair|logout/i });
    await logoutButton.click();
    
    // Aguardar redirecionamento para auth
    await page.waitForURL(/\/auth/);
  }
}

/**
 * Cria uma nova marca
 */
export async function createBrand(page: Page, name = TEST_BRAND.name, domain = TEST_BRAND.domain) {
  await page.goto('/brands');
  
  const createButton = page.getByRole('button', { name: /criar|nova.*marca|new.*brand/i });
  await createButton.click();
  await page.waitForTimeout(300);
  
  const nameInput = page.getByLabel(/nome|name/i);
  const domainInput = page.getByLabel(/domínio|domain/i);
  
  await nameInput.fill(name);
  await domainInput.fill(domain);
  
  const submitButton = page.getByRole('button', { name: /salvar|save|criar|create/i });
  await submitButton.click();
  
  // Aguardar confirmação
  await page.waitForTimeout(1000);
}

/**
 * Aguarda o carregamento completo da página
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  
  // Aguardar skeletons desaparecerem
  const skeletons = page.locator('[data-testid="skeleton"], [role="status"]');
  const count = await skeletons.count();
  
  if (count > 0) {
    await page.waitForTimeout(2000);
  }
}

/**
 * Verifica se há toast de sucesso
 */
export async function expectSuccessToast(page: Page) {
  const toast = page.locator('[data-sonner-toast], [role="status"]');
  await expect(toast.first()).toBeVisible({ timeout: 3000 });
}

/**
 * Verifica se há toast de erro
 */
export async function expectErrorToast(page: Page) {
  const errorToast = page.locator('text=/erro|error|falha|fail/i');
  await expect(errorToast.first()).toBeVisible({ timeout: 3000 });
}

/**
 * Navega para uma página específica
 */
export async function navigateTo(page: Page, route: string) {
  await page.goto(route);
  await waitForPageLoad(page);
}

/**
 * Seleciona uma marca do dropdown
 */
export async function selectBrand(page: Page, brandName: string) {
  const brandSelect = page.getByRole('combobox', { name: /marca|brand/i });
  
  if (await brandSelect.isVisible().catch(() => false)) {
    await brandSelect.click();
    await page.waitForTimeout(300);
    
    const brandOption = page.getByRole('option', { name: new RegExp(brandName, 'i') });
    await brandOption.click();
  }
}

/**
 * Aguarda requisição de API completar
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    response => {
      const url = response.url();
      return typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

/**
 * Intercepta e mocka resposta de API
 */
export async function mockApiResponse(page: Page, urlPattern: string | RegExp, mockData: any) {
  await page.route(urlPattern, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
}

/**
 * Tira screenshot com nome descritivo
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}

/**
 * Verifica se elemento tem loading state
 */
export async function expectLoadingState(page: Page, selector: string) {
  const element = page.locator(selector);
  const isLoading = await element.getAttribute('data-loading');
  expect(isLoading).toBe('true');
}

/**
 * Aguarda elemento desaparecer
 */
export async function waitForElementToDisappear(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toHaveCount(0, { timeout: 5000 });
}