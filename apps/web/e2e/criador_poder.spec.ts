import { test, expect } from './fixtures/auth.fixture';

test.describe('Criador de Poder E2E', () => {
  test('deve criar um poder simples com sucesso e salvar', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Intercepta o POST para criar poder
    await page.route('http://localhost:3333/powers', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const payload = request.postDataJSON();
        
        // Valida que os dados enviados são os que preenchemos na tela
        expect(payload.nome).toBe('Poder Super E2E');
        expect(payload.effects).toHaveLength(1);
        expect(payload.effects[0].grau).toBe(5);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'uuid-novo-poder-123',
            ...payload,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Navega para a página do Criador de Poder
    await page.goto('/Aetherium/criador');

    // Preenche o nome do poder
    const nomeInput = page.locator('input[placeholder="Ex: Bola de Fogo"]').first();
    await expect(nomeInput).toBeVisible();
    await nomeInput.click();
    await nomeInput.fill('Poder Super E2E');

    // Seleciona um domínio
    const dominioSelect = page.locator('select').first();
    await expect(dominioSelect).toBeVisible();
    await dominioSelect.selectOption('natural');

    // Abre o modal de selecionar efeito
    const addEfeitoButton = page.locator('button:has-text("Adicionar Primeiro Efeito"), button:has-text("Adicionar Efeito")').first();
    await expect(addEfeitoButton).toBeVisible();
    await addEfeitoButton.click();

    // Seleciona o efeito "Dano" no modal
    const modalEfeito = page.locator('h2:has-text("Selecionar Efeito")').first();
    await expect(modalEfeito).toBeVisible();

    const cardDano = page.locator('h4:has-text("Dano")').first();
    await expect(cardDano).toBeVisible();
    await cardDano.click();

    // O modal deve ter fechado e o card do efeito Dano deve estar visível
    const cardEfeito = page.locator('h3:has-text("Dano")').first();
    await expect(cardEfeito).toBeVisible();

    // Ajusta o grau do efeito Dano para 5
    const sliderInput = page.locator('input[type="range"]').first();
    await expect(sliderInput).toBeVisible();
    await sliderInput.fill('5');

    // O custo do poder deve ter atualizado dinamicamente para 10 PdA
    // (Dano tem custoBase=1 + modificador=1 -> 2 PdA/grau; grau=5; 2 * 5 = 10 PdA)
    const pdaBadge = page.locator('span:has-text("10 PdA"), div:has-text("10 PdA")').first();
    await expect(pdaBadge).toBeVisible();

    // Clica no botão de Salvar
    const salvarButton = page.locator('button:has-text("Salvar")').first();
    await expect(salvarButton).toBeVisible();
    await salvarButton.click();

    // Deve exibir o toast de sucesso
    const successToast = page.getByText('Poder "Poder Super E2E" salvo com sucesso!').first();
    await expect(successToast).toBeVisible();
  });
});
