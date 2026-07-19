import { Card, CardContent, Badge, Button, DynamicIcon } from '@/shared/ui';
import { MarkdownText } from '@/shared/components';
import { useSwipeToDismiss, useIsTouchDevice } from '@/shared/hooks';
import { Trash2, Sparkles, Globe, Lock, Pencil, Download } from 'lucide-react';
import type { PeculiaridadeResponse } from '@/services/types';

interface SwipeablePeculiaridadeCardProps {
  peculiaridade: PeculiaridadeResponse;
  onEditar: () => void;
  onDeletar: () => void;
  onTogglePublic: () => void;
  onExportar: () => void;
  onVerResumo?: () => void;
  isDeletando?: boolean;
  togglePublicId: string | null;
}

export function SwipeablePeculiaridadeCard({
  peculiaridade,
  onEditar,
  onDeletar,
  onTogglePublic,
  onExportar,
  onVerResumo,
  isDeletando = false,
  togglePublicId,
}: SwipeablePeculiaridadeCardProps) {
  const isTouchDevice = useIsTouchDevice();
  const swipeHandlers = useSwipeToDismiss(onDeletar, 80);

  return (
    <div className="relative overflow-hidden w-full group">
      {/* Botão de deletar ao swipe (apenas touch) */}
      {isTouchDevice && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 dark:bg-red-700 px-6">
          <span className="text-white font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Deletar
          </span>
        </div>
      )}

      <div 
        {...(isTouchDevice ? swipeHandlers : {})} 
        className={`relative group bg-white dark:bg-gray-800 rounded-lg shadow-md border-t-4 border-purple-500 overflow-hidden transition-all hover:shadow-lg ${onVerResumo ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        onClick={(e) => {
          // Ignora clique se for nos botões ou inputs
          if ((e.target as HTMLElement).closest('button, input, a')) return;
          onVerResumo?.();
        }}
      >
        <Card
          hover
          className="w-full border-none shadow-none transition-all duration-300 overflow-hidden relative"
        >
          {/* Background Gradient Subtle */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 pointer-events-none opacity-40"></div>

          <CardContent className="p-4 sm:p-6 relative z-10 flex flex-col sm:flex-row gap-6">
            {/* Ícone à esquerda - 80x80px */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
               <div className="w-20 h-20 rounded-xl overflow-hidden bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center border border-purple-200/50 dark:border-purple-700/50 group-hover:scale-105 transition-transform shadow-inner">
                {peculiaridade.icone ? (
                  <DynamicIcon name={peculiaridade.icone} className="w-14 h-14 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                )}
              </div>
            </div>

            {/* Conteúdo à direita */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl tracking-tight truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase">
                      {peculiaridade.nome}
                    </h3>
                    <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider">Customizado</Badge>
                    {peculiaridade.espiritual && (
                      <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">Espiritual</Badge>
                    )}
                  </div>
                  {peculiaridade.isPublic && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">
                      <Globe className="w-3 h-3" /> Público
                    </span>
                  )}
                </div>

                {/* Ações rápidas */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportar}
                    title="Exportar peculiaridade"
                    className="h-10 w-10 p-0 text-indigo-500 hover:text-indigo-700"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePublic}
                    title={peculiaridade.isPublic ? 'Tornar privada' : 'Publicar'}
                    loading={togglePublicId === peculiaridade.id}
                    disabled={togglePublicId !== null && togglePublicId !== peculiaridade.id}
                    className={`h-10 w-10 p-0 ${peculiaridade.isPublic ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {peculiaridade.isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEditar}
                    title="Editar"
                    className="h-10 w-10 p-0 shadow-sm"
                  >
                    <Pencil className="w-5 h-5" />
                  </Button>

                  {!isTouchDevice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDeletar}
                      loading={isDeletando}
                      className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Deletar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Descrição em Markdown com Limite de Altura e Fade-out */}
              {peculiaridade.descricao && (
                <div className="relative">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-100 dark:border-gray-800 max-h-48 overflow-hidden">
                    <MarkdownText>{peculiaridade.descricao}</MarkdownText>
                  </div>
                  {/* Gradiente de Fade-out para indicar mais conteúdo */}
                  {peculiaridade.descricao.length > 200 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none rounded-b-lg"></div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
