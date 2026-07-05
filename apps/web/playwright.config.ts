import { defineConfig, devices } from '@playwright/test';

/**
 * Veja as opções de configuração em:
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Executar testes em arquivos em paralelo */
  fullyParallel: true,
  /* Falhar o build no CI se você acidentalmente deixou test.only no código */
  forbidOnly: !!process.env.CI,
  /* Tentar novamente apenas em CI */
  retries: process.env.CI ? 2 : 0,
  /* Opt-out de execução paralela em CI */
  workers: process.env.CI ? 1 : undefined,
  /* Repórter para usar. Veja https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configuração compartilhada para todos os projetos abaixo. Veja https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL para usar em ações como `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Coletar trace quando tentar novamente um teste falho. Veja https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configurar projetos para navegadores principais */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Executa seu servidor de desenvolvimento local antes de iniciar os testes */
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
