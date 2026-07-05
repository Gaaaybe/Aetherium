import { test, expect } from './fixtures/auth.fixture';

const mockCharacterData = {
  id: 'char-123',
  userId: 'user-1',
  level: 3,
  inspiration: 2,
  calamityRank: 'I',
  efficiencyBonus: 2,
  narrative: {
    identity: 'Combatente Rúnico',
    origin: 'Aetheria',
    motivations: ['Proteger a ordem'],
    complications: []
  },
  attributes: {
    strength: { baseValue: 12, extraBonus: 0, baseModifier: 1, rollModifier: 1 },
    dexterity: { baseValue: 14, extraBonus: 0, baseModifier: 2, rollModifier: 2 },
    constitution: { baseValue: 10, extraBonus: 0, baseModifier: 0, rollModifier: 0 },
    intelligence: { baseValue: 16, extraBonus: 0, baseModifier: 3, rollModifier: 3 },
    wisdom: { baseValue: 8, extraBonus: 0, baseModifier: -1, rollModifier: -1 },
    charisma: { baseValue: 11, extraBonus: 0, baseModifier: 0, rollModifier: 0 },
    keyPhysical: 'strength',
    keyMental: 'intelligence'
  },
  skills: [],
  spiritualPrinciple: {
    isUnlocked: true,
    stage: 'NORMAL'
  },
  domainMasteries: [],
  pda: {
    total: 12,
    spent: 10,
    extra: 0,
    available: 2
  },
  health: {
    maxPV: 30,
    currentPV: 20,
    temporaryPV: 0
  },
  energy: {
    maxPE: 20,
    currentPE: 15,
    temporaryPE: 0
  },
  slots: {
    maxSlots: 5,
    usedSlots: 2,
    availableSlots: 3
  },
  conditions: [],
  death: {
    state: 'ALIVE',
    counter: 0
  },
  inventory: {
    runics: 100,
    bag: []
  },
  equipment: {
    suitId: null,
    accessoryId: null,
    hands: [],
    quickAccess: [],
    numberOfHands: 2,
    maxQuickAccessSlots: 4
  },
  powers: [
    {
      id: 'p-dano-ref',
      powerId: 'p-dano',
      isEquipped: true,
      finalPdaCost: 2,
      slotCost: 1
    },
    {
      id: 'p-fortalecer-ref',
      powerId: 'p-fortalecer',
      isEquipped: true,
      finalPdaCost: 3,
      slotCost: 1
    }
  ],
  powerArrays: [],
  benefits: [],
  unarmedMastery: {
    degree: 0,
    marginImprovements: 0,
    multiplierImprovements: 0,
    damageType: 'FISICO',
    damageDie: '1d4',
    criticalMargin: 20,
    criticalMultiplier: 2,
    totalPdaCost: 0
  },
  combatStats: {
    dodge: 12,
    baseRD: 0,
    blockRD: 0
  },
  symbol: null,
  art: null,
  createdAt: '2026-07-04T12:00:00Z',
  updatedAt: '2026-07-04T13:00:00Z'
};

const mockPowersDetailed = [
  {
    id: 'p-dano',
    userId: null,
    nome: 'Ataque Rúnico',
    descricao: 'Causa dano de fogo rúnico.',
    isPublic: false,
    icone: null,
    notas: null,
    dominio: { name: 'natural', areaConhecimento: null, peculiarId: null },
    parametros: {
      acao: 1,
      alcance: 1,
      duracao: 0
    },
    custoTotal: { pda: 2, pe: 2, espacos: 1 },
    custoAlternativo: null,
    effects: [
      {
        id: 'ef-dano',
        effectBaseId: 'dano',
        grau: 1,
        configuracaoId: 'dano-fogo',
        inputValue: null,
        dadoModularizado: null,
        custo: { pda: 2, pe: 2, espacos: 1 },
        modifications: [],
        nota: null,
      }
    ],
    globalModifications: [],
    createdAt: '2026-07-04T12:00:00Z',
    updatedAt: null,
    userName: null,
  },
  {
    id: 'p-fortalecer',
    userId: null,
    nome: 'Fortalecer Ações',
    descricao: 'Concede ações extras temporárias.',
    isPublic: false,
    icone: null,
    notas: null,
    dominio: { name: 'natural', areaConhecimento: null, peculiarId: null },
    parametros: {
      acao: 1,
      alcance: 1,
      duracao: 0
    },
    custoTotal: { pda: 3, pe: 3, espacos: 1 },
    custoAlternativo: null,
    effects: [
      {
        id: 'ef-fortalecer',
        effectBaseId: 'fortalecer',
        grau: 2,
        configuracaoId: 'acoes',
        inputValue: null,
        dadoModularizado: null,
        custo: { pda: 3, pe: 3, espacos: 1 },
        modifications: [],
        nota: null,
      }
    ],
    globalModifications: [],
    createdAt: '2026-07-04T12:00:00Z',
    updatedAt: null,
    userName: null,
  }
];

test.describe('Ficha de Personagem E2E - Automação de Combate e Poderes', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const loc = msg.location();
      console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()} at ${loc?.url || 'unknown'}:${loc?.lineNumber || ''}`);
    });
    page.on('pageerror', err => console.error('BROWSER EXCEPTION:', err.stack || err.message));

    // Intercepta a chamada de carregamento do personagem
    await page.route('http://localhost:3333/characters/char-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCharacterData),
      });
    });

    // Intercepta a listagem geral de poderes
    await page.route('http://localhost:3333/powers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPowersDetailed),
      });
    });

    // Intercepta os fetches individuais detalhados que o dashboard faz
    await page.route('http://localhost:3333/characters/char-123/powers/full', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ powers: mockPowersDetailed }),
      });
    });

    await page.route('http://localhost:3333/characters/char-123/powers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPowersDetailed),
      });
    });

    await page.route('http://localhost:3333/characters/char-123/power-arrays/full', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ powerArrays: [] }),
      });
    });

    await page.route('http://localhost:3333/characters/char-123/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });

    // Intercepta as peculiaridades do usuário logado (usando glob para suportar query params)
    await page.route('http://localhost:3333/peculiarities*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Intercepta a busca de poderes do usuário logado
    await page.route('http://localhost:3333/powers/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPowersDetailed),
      });
    });

    // Intercepta a busca de acervos do usuário logado
    await page.route('http://localhost:3333/power-arrays/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Intercepta a busca individual de detalhes de cada poder
    await page.route('http://localhost:3333/powers/p-*', async (route) => {
      const url = route.request().url();
      const id = url.split('/').pop()?.split('?')[0];
      const power = mockPowersDetailed.find(p => p.id === id);
      if (power) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(power),
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    });

    // Intercepta a chamada de preview/resolve de poder no motor de automação
    await page.route('http://localhost:3333/powers/*/resolve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resolutionMode: 'ON_USE',
          mutations: [],
        }),
      });
    });

    // Intercepta a chamada de aplicação de mutações de poder
    await page.route('http://localhost:3333/powers/apply-mutations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('deve carregar a Ficha do Personagem com valores de vida e energia corretos', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/Aetherium/personagens/char-123');

    // Verifica se o nome do personagem aparece na tela
    const headerName = page.locator('h1', { hasText: 'Combatente Rúnico' }).first();
    await expect(headerName).toBeVisible();

    // Verifica os valores de PV e PE nos cards
    const pvLabel = page.getByText('20 / 30').first();
    await expect(pvLabel).toBeVisible();

    const peLabel = page.getByText('15 / 20').first();
    await expect(peLabel).toBeVisible();
  });

  test('deve usar o poder Ataque Rúnico e deduzir PE da ficha do personagem', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Intercepta a chamada de syncCharacter (debitar PE)
    await page.route('http://localhost:3333/characters/char-123/sync', async (route) => {
      const updated = {
        ...mockCharacterData,
        energy: {
          ...mockCharacterData.energy,
          currentPE: 13, // 15 - 2 = 13
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    });

    await page.goto('/Aetherium/personagens/char-123');

    // Encontra o card do poder "Ataque Rúnico" e o botão "Usar" dentro dele
    const powerCard = page.locator('div.group').filter({ has: page.locator('h4', { hasText: 'Ataque Rúnico' }) }).first();
    const usarButton = powerCard.locator('button:has-text("Usar")').first();
    await expect(usarButton).toBeVisible();
    await usarButton.click();

    // Modal de uso deve estar visível
    const modalTitle = page.getByText('Usar: Ataque Rúnico').first();
    await expect(modalTitle).toBeVisible();

    // Clica no botão de confirmação no modal (que diz "Usar (-2 PE)")
    const confirmarButton = page.locator('button:has-text("Usar")').filter({ hasText: 'PE' }).first();
    await expect(confirmarButton).toBeVisible();
    await confirmarButton.click();

    // Espera o valor de PE atualizar para 13
    const peLabel = page.getByText('13 / 20').first();
    await expect(peLabel).toBeVisible();
  });

  test('deve realizar descanso curto/longo e recuperar recursos', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Intercepta a chamada de rest
    await page.route('http://localhost:3333/characters/char-123/rest', async (route) => {
      const updated = {
        ...mockCharacterData,
        health: {
          ...mockCharacterData.health,
          currentPV: 30, // totalmente recuperado
        },
        energy: {
          ...mockCharacterData.energy,
          currentPE: 20, // totalmente recuperado
        },
        restChange: {
          pvChange: 10,
          peChange: 5
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    });

    await page.goto('/Aetherium/personagens/char-123');

    // Abre o modal de descanso
    const descansoButton = page.locator('button:has-text("Descansar"), button[title*="Descansar"]').first();
    await expect(descansoButton).toBeVisible();
    await descansoButton.click();

    // Clica no botão "Confirmar Descanso" no modal
    const confirmarDescansoButton = page.locator('button:has-text("Confirmar Descanso")').first();
    await expect(confirmarDescansoButton).toBeVisible();
    await confirmarDescansoButton.click();

    // Clica no botão "Fechar" no modal de resultado
    const fecharButton = page.locator('button:has-text("Fechar")').first();
    await expect(fecharButton).toBeVisible();
    await fecharButton.click();

    // Verifica que os recursos foram totalmente recuperados na interface
    const pvLabel = page.getByText('30 / 30').first();
    await expect(pvLabel).toBeVisible();

    const peLabel = page.getByText('20 / 20').first();
    await expect(peLabel).toBeVisible();
  });

  test('deve ativar o poder Fortalecer Ações, aplicar bônus de ação e desativar com sucesso', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Intercepta a chamada de syncCharacter (debitar PE)
    await page.route('http://localhost:3333/characters/char-123/sync', async (route) => {
      const updated = {
        ...mockCharacterData,
        energy: {
          ...mockCharacterData.energy,
          currentPE: 12, // 15 - 3 = 12
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    });

    await page.goto('/Aetherium/personagens/char-123');

    // 1. Encontra e usa o poder "Fortalecer Ações"
    const powerCard = page.locator('div.group').filter({ has: page.locator('h4', { hasText: 'Fortalecer Ações' }) }).first();
    const usarButton = powerCard.locator('button:has-text("Usar")').first();
    await expect(usarButton).toBeVisible();
    await usarButton.click();

    // 2. Confirma o uso do poder no modal (que diz "Usar (-3 PE)")
    const modalTitle = page.getByText('Usar: Fortalecer Ações').first();
    await expect(modalTitle).toBeVisible();

    const confirmarButton = page.locator('button:has-text("Usar")').filter({ hasText: 'PE' }).first();
    await expect(confirmarButton).toBeVisible();
    await confirmarButton.click();

    // 3. Verifica que o poder aparece nos Poderes Ativos tracker
    const activeTrackerHeader = page.getByText('Poderes Ativos (1)').first();
    await expect(activeTrackerHeader).toBeVisible();

    const activePowerCardName = page.locator('div').filter({ has: page.locator('p', { hasText: 'Fortalecer Ações' }) }).first();
    await expect(activePowerCardName).toBeVisible();

    // 4. Verifica que o contador de ações mostra a ação extra
    const actionsCounter = page.getByText('1 (+1)').first();
    await expect(actionsCounter).toBeVisible();

    // 5. Desativa o poder clicando no X (botão com title="Encerrar poder")
    const deactivateButton = page.locator('button[title="Encerrar poder"]').first();
    await expect(deactivateButton).toBeVisible();
    await deactivateButton.click();

    // 6. Verifica que o poder sumiu de Poderes Ativos e o contador voltou ao normal (não tem mais "+1")
    await expect(activeTrackerHeader).not.toBeVisible();
    await expect(actionsCounter).not.toBeVisible();
  });

});
