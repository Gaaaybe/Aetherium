import { test as baseTest } from '@playwright/test';

// Token JWT mockado estruturalmente válido sem expiração, cujo payload tem tamanho exatamente múltiplo de 4 (80 caracteres).
// Payload decodificado: { "sub": "user-1", "email": "test@example.com", "name": "OrionAA" }
// Evita 100% de erros no window.atob do Chromium e não precisa de padding '='.
const VALID_MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiT3Jpb25BQSJ9.signature';

export const test = baseTest.extend({
  authenticatedPage: async ({ page, request }, use) => {
    let token = VALID_MOCK_JWT;
    
    // Tenta fazer o login real na API se ela estiver respondendo
    try {
      const response = await request.post('http://localhost:3333/auth', {
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
        timeout: 1000,
      });
      if (response.ok()) {
        const json = await response.json();
        if (json.access_token) {
          token = json.access_token;
        }
      }
    } catch (e) {
      // Em caso de falha de conexão (ex: API offline), prossegue com o token mockado
    }

    // Injeta o token no localStorage no início da navegação da página
    await page.addInitScript((t) => {
      window.localStorage.setItem('aetherium-token', t);
      window.localStorage.setItem('aetherium-user', JSON.stringify({
        id: 'user-1',
        name: 'OrionAA',
        email: 'test@example.com',
      }));
    }, token);

    await use(page);
  },
});

export { expect } from '@playwright/test';
