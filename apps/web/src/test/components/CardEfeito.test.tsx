import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CardEfeito } from '../../features/criador-de-poder/components/CardEfeito';

// Mock do hook useCatalog
vi.mock('@/context/useCatalog', () => ({
  useCatalog: () => ({
    modificacoes: [
      {
        id: 'mod-1',
        nome: 'Modificação de Teste',
        tipo: 'extra',
        custoFixo: 0,
        custoPorGrau: 1,
        descricao: 'Uma modificação de teste',
      },
    ],
  }),
}));

describe('CardEfeito Component', () => {
  const mockEfeitoDetalhado = {
    efeito: {
      id: 'efeito-123',
      efeitoBaseId: 'dano',
      grau: 5,
      modificacoesLocais: [],
      inputCustomizado: '',
      configuracaoSelecionada: '',
    },
    efeitoBase: {
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano ao alvo',
      parametrosPadrao: {
        acao: 1,
        alcance: 1,
        duracao: 0,
      },
      categorias: ['Ataque'],
      requerInput: false,
    },
    custoPorGrau: 1,
    custoFixo: 0,
    custoTotal: 5,
  };

  const mockHandlers = {
    onRemover: vi.fn(),
    onAtualizarGrau: vi.fn(),
    onAdicionarModificacao: vi.fn(),
    onRemoverModificacao: vi.fn(),
    onAtualizarInputCustomizado: vi.fn(),
    onAtualizarConfiguracao: vi.fn(),
    onAtualizarDadoModularizado: vi.fn(),
  };

  it('deve renderizar o nome do efeito e informações básicas', () => {
    render(<CardEfeito efeitoDetalhado={mockEfeitoDetalhado} {...mockHandlers} />);
    
    // Deve renderizar o título do efeito base
    expect(screen.getByText('Dano')).toBeInTheDocument();
    
    // Deve renderizar o custo de PdA
    expect(screen.getAllByText(/5\s+PdA/)[0]).toBeInTheDocument();
    
    // Deve renderizar o grau do efeito
    expect(screen.getByText(/Grau 5/)).toBeInTheDocument();
  });

  it('deve chamar onRemover quando o botão de remover for clicado', async () => {
    render(<CardEfeito efeitoDetalhado={mockEfeitoDetalhado} {...mockHandlers} />);
    
    const button = screen.getByRole('button', { name: /remover/i });
    await userEvent.click(button);
    
    expect(mockHandlers.onRemover).toHaveBeenCalledWith('efeito-123');
  });
});
