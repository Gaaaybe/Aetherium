import { useMemo } from 'react';
import { useCatalog } from '@/context/useCatalog';
import { ResumoAcervo } from '@/features/criador-de-poder/components/ResumoAcervo';
import { ResumoPoder } from '@/features/criador-de-poder/components/ResumoPoder';
import { calcularDetalhesPoder } from '@/features/criador-de-poder/regras/calculadoraCusto';
import {
  acervoResponseToAcervo,
  poderResponseToPoder,
} from '@/features/criador-de-poder/utils/poderApiConverter';
import type { AcervoResponse, PoderResponse } from '@/services/types';

interface ResumoVinculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  poder?: PoderResponse;
  acervo?: AcervoResponse;
  onEditPower?: () => void;
}

export function ResumoVinculoModal({ isOpen, onClose, poder, acervo, onEditPower }: ResumoVinculoModalProps) {
  const { efeitos, modificacoes } = useCatalog();

  const poderConvertido = useMemo(
    () => (poder ? poderResponseToPoder(poder) : null),
    [poder],
  );

  const acervoConvertido = useMemo(
    () => (acervo ? acervoResponseToAcervo(acervo) : null),
    [acervo],
  );

  const detalhesPoder = useMemo(() => {
    if (!poderConvertido) {
      return null;
    }

    return calcularDetalhesPoder(poderConvertido, efeitos, modificacoes);
  }, [poderConvertido, efeitos, modificacoes]);

  if (poderConvertido && detalhesPoder) {
    return (
      <ResumoPoder
        isOpen={isOpen}
        onClose={onClose}
        poder={poderConvertido}
        detalhes={detalhesPoder}
        onEdit={onEditPower}
      />
    );
  }

  if (acervoConvertido) {
    return <ResumoAcervo isOpen={isOpen} onClose={onClose} acervo={acervoConvertido} />;
  }

  return null;
}
