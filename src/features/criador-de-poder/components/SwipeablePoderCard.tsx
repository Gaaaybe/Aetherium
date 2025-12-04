import { Card, CardContent, Badge, Button } from '../../../shared/ui';
import { useSwipeToDismiss, useIsTouchDevice } from '../../../shared/hooks';
import type { PoderSalvo } from '../types';

interface SwipeablePoderCardProps {
  poder: PoderSalvo;
  onCarregar: () => void;
  onDuplicar: () => void;
  onExportar: () => void;
  onDeletar: () => void;
  formatarData: (data: string) => string;
  carregandoId: string | null;
  deletandoId: string | null;
  duplicandoId: string | null;
  exportandoId: string | null;
}

export function SwipeablePoderCard({
  poder,
  onCarregar,
  onDuplicar,
  onExportar,
  onDeletar,
  formatarData,
  carregandoId,
  deletandoId,
  duplicandoId,
  exportandoId
}: SwipeablePoderCardProps) {
  const isTouchDevice = useIsTouchDevice();
  const swipeHandlers = useSwipeToDismiss(onDeletar, 80);

  return (
    <div className="relative overflow-hidden">
      {/* Botão de deletar revelado ao swipe (apenas touch) */}
      {isTouchDevice && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 dark:bg-red-700 px-6">
          <span className="text-white font-semibold">🗑️ Deletar</span>
        </div>
      )}

      {/* Card principal */}
      <div
        {...(isTouchDevice ? swipeHandlers : {})}
        className="bg-white dark:bg-gray-800"
      >
        <Card hover>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Cabeçalho com nome e badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base break-words">
                    {poder.nome}
                  </h3>
                </div>
                <Badge variant="secondary" size="sm" className="flex-shrink-0">
                  {poder.efeitos.length} {poder.efeitos.length === 1 ? 'efeito' : 'efeitos'}
                </Badge>
              </div>
              
              {/* Descrição */}
              {poder.descricao && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                  {poder.descricao}
                </p>
              )}
              
              {/* Rodapé com data e ações */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                  {formatarData(poder.dataCriacao)}
                </p>
                
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onCarregar}
                    loading={carregandoId === poder.id}
                    loadingText="..."
                    className="min-w-[90px]"
                  >
                    📂 Carregar
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicar}
                    title="Duplicar"
                    loading={duplicandoId === poder.id}
                    disabled={duplicandoId !== null && duplicandoId !== poder.id}
                  >
                    📋
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportar}
                    title="Exportar JSON"
                    loading={exportandoId === poder.id}
                    disabled={exportandoId !== null && exportandoId !== poder.id}
                  >
                    ⬇️
                  </Button>
                  {!isTouchDevice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDeletar}
                      className="text-red-600 hover:text-red-700"
                      title="Deletar"
                      loading={deletandoId === poder.id}
                      disabled={deletandoId !== null && deletandoId !== poder.id}
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
