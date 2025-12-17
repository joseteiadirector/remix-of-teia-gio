import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * 
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout para cada teste
  timeout: 30 * 1000,
  
  // Número de tentativas em caso de falha
  retries: process.env.CI ? 2 : 0,
  
  // Workers paralelos
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: 'html',
  
  use: {
    // URL base
    baseURL: 'http://localhost:8080',
    
    // Screenshots em falhas
    screenshot: 'only-on-failure',
    
    // Vídeos em falhas
    video: 'retain-on-failure',
    
    // Trace em falhas
    trace: 'on-first-retry',
  },

  // Configurar projetos para diferentes browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
