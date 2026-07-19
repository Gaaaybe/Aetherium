import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '@/shared/ui';

describe('Tooltip', () => {
  it('abre por clique e fecha com Escape', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Descrição do recurso"><button type="button">Ajuda</button></Tooltip>);

    await user.click(screen.getByRole('button', { name: 'Ajuda' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Descrição do recurso');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('abre ao receber foco pelo teclado', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Informação acessível"><button type="button">Ajuda</button></Tooltip>);

    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Informação acessível');
  });
});
