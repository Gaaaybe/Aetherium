import { test, expect } from '@playwright/test';

test.describe('Aetherium Landing & Navigation E2E', () => {
  test('deve carregar a Landing Page com o título do app', async ({ page }) => {
    // Navega para a URL base com o basename
    await page.goto('/Aetherium/');

    // Verifica que o título principal está visível
    const title = page.locator('h1', { hasText: 'Aetherium' }).first();
    await expect(title).toBeVisible();

    // Verifica a presença do subtítulo do app
    const subtitle = page.locator('text=Plataforma Digital para Spirit and Caos').first();
    await expect(subtitle).toBeVisible();
  });

  test('deve navegar para a página Sobre', async ({ page }) => {
    await page.goto('/Aetherium/');

    // Clica no link "Sobre" da navegação
    const sobreLink = page.locator('a', { hasText: 'Sobre' });
    await expect(sobreLink).toBeVisible();
    await sobreLink.click();

    // Verifica que a URL mudou
    await expect(page).toHaveURL(/\/Aetherium\/sobre/);

    // Verifica que o título ou conteúdo da página Sobre é renderizado
    const content = page.locator('text=Gabriel Menezes');
    await expect(content).toBeVisible();
  });

  test('deve exibir botão de Entrar na barra de navegação', async ({ page }) => {
    await page.goto('/Aetherium/');

    // Verifica o botão de login
    const loginButton = page.locator('button, a', { hasText: 'Entrar' }).first();
    await expect(loginButton).toBeVisible();
  });
});
