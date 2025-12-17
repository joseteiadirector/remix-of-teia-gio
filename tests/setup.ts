/**
 * Setup para testes E2E (Playwright)
 * 
 * Para rodar testes:
 * 1. npm install -D @playwright/test
 * 2. npx playwright install
 * 3. npx playwright test
 */

// Configuração base para testes
export const TEST_CONFIG = {
  baseURL: 'http://localhost:8080',
  timeout: 30000,
  retries: 2,
};

// Dados de teste
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

export const TEST_BRAND = {
  name: 'Test Brand',
  domain: 'testbrand.com',
};
