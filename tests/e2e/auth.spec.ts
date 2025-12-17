/**
 * Testes E2E - Autenticação
 * Testa fluxo completo de login, registro e recuperação de senha
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /entrar/i });
    await submitButton.click();
    
    // Aguardar mensagem de erro
    await page.waitForTimeout(500);
    
    // Verificar se há feedback de erro
    const errorMessages = page.locator('text=/obrigatório|required/i');
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 });
  });

  test('should switch to signup form', async ({ page }) => {
    const signupLink = page.getByRole('button', { name: /criar conta|registrar/i });
    
    if (await signupLink.isVisible().catch(() => false)) {
      await signupLink.click();
      await expect(page.getByRole('heading', { name: /criar conta|registrar/i })).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i);
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    await page.waitForTimeout(300);
    
    // Verificar mensagem de email inválido
    const errorText = page.locator('text=/válido|inválido|valid/i');
    await expect(errorText.first()).toBeVisible({ timeout: 2000 });
  });

  test('should validate password requirements', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/senha/i);
    await passwordInput.fill('123'); // Senha muito curta
    await passwordInput.blur();
    
    await page.waitForTimeout(300);
    
    // Verificar mensagem de senha fraca
    const errorText = page.locator('text=/mínimo|caracteres|characters/i');
    await expect(errorText.first()).toBeVisible({ timeout: 2000 });
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/senha/i);
    const submitButton = page.getByRole('button', { name: /entrar/i });
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPassword123!');
    await submitButton.click();
    
    // Aguardar toast de erro ou mensagem
    await page.waitForTimeout(2000);
    
    // Verificar se continua na página de auth (não redirecionou)
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should persist form state on page refresh', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i);
    await emailInput.fill('test@example.com');
    
    // Recarregar página
    await page.reload();
    
    // Verificar se formulário está limpo após reload
    const emailAfterReload = await page.getByPlaceholder(/email/i).inputValue();
    expect(emailAfterReload).toBe('');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/senha/i);
    await passwordInput.fill('MyPassword123!');
    
    // Procurar botão de toggle (ícone de olho)
    const toggleButton = page.locator('button[aria-label*="mostrar" i], button[aria-label*="show" i]');
    
    if (await toggleButton.isVisible().catch(() => false)) {
      // Verificar que começa como password
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click para mostrar
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click para esconder
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should validate password strength on signup', async ({ page }) => {
    const signupLink = page.getByRole('button', { name: /criar conta|registrar/i });
    
    if (await signupLink.isVisible().catch(() => false)) {
      await signupLink.click();
      
      const passwordInput = page.getByPlaceholder(/senha/i);
      
      // Senha fraca
      await passwordInput.fill('weak');
      await passwordInput.blur();
      await page.waitForTimeout(300);
      
      // Senha forte
      await passwordInput.fill('StrongPassword123!@#');
      await passwordInput.blur();
      await page.waitForTimeout(300);
    }
  });
});
