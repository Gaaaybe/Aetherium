import { Card, CardContent, Badge, Button, DynamicIcon } from '../../../shared/ui';
import { useSwipeToDismiss, useIsTouchDevice } from '../../../shared/hooks';
import { Trash2, FolderOpen, Copy, Download, Globe, Lock } from 'lucide-react';
import { MarkdownText } from '../../../shared/components';
import type { PoderSalvo } from '../types';

interface SwipeablePoderCardProps {
  poder: PoderSalvo;
  isPublic: boolean;
  onCarregar: () => void;
  onDuplicar: () => void;
  onExportar: () => void;
  onDeletar: () => void;
  onTogglePublic: () => void;
  onVerResumo: () => void;
  formatarData: (data: string) => string;
  carregandoId: string | null;
  deletandoId: string | null;
  duplicandoId: string | null;
  exportandoId: string | null;
  togglePublicId: string | null;
}

export const DOMINIO_VISUAL: Record<string, { color: string; gradient: string; borderColor: string }> = {
  natural: { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    gradient: 'from-emerald-500/5 to-transparent',
    borderColor: 'border-emerald-500'
  },
  sagrado: { 
    color: 'text-amber-500 dark:text-amber-400', 
    gradient: 'from-amber-500/5 to-transparent',
    borderColor: 'border-amber-500'
  },
  sacrilegio: { 
    color: 'text-rose-600 dark:text-rose-400', 
    gradient: 'from-rose-500/5 to-transparent',
    borderColor: 'border-rose-500'
  },
  psiquico: { 
    color: 'text-indigo-600 dark:text-indigo-400', 
    gradient: 'from-indigo-500/5 to-transparent',
    borderColor: 'border-indigo-500'
  },
  cientifico: { 
    color: 'text-sky-600 dark:text-sky-400', 
    gradient: 'from-sky-500/5 to-transparent',
    borderColor: 'border-sky-500'
  },
  peculiar: { 
    color: 'text-purple-600 dark:text-purple-400', 
    gradient: 'from-purple-500/5 to-transparent',
    borderColor: 'border-purple-500'
  },
  'arma-branca': { 
    color: 'text-slate-600 dark:text-slate-400', 
    gradient: 'from-slate-500/5 to-transparent',
    borderColor: 'border-slate-500'
  },
  'arma-fogo': { 
    color: 'text-orange-600 dark:text-orange-400', 
    gradient: 'from-orange-500/5 to-transparent',
    borderColor: 'border-orange-500'
  },
  'arma-tensao': { 
    color: 'text-lime-600 dark:text-lime-400', 
    gradient: 'from-lime-500/5 to-transparent',
    borderColor: 'border-lime-500'
  },
  'arma-explosiva': { 
    color: 'text-red-700 dark:text-red-500', 
    gradient: 'from-red-600/5 to-transparent',
    borderColor: 'border-red-600'
  },
  'arma-tecnologica': { 
    color: 'text-cyan-600 dark:text-cyan-400', 
    gradient: 'from-cyan-500/5 to-transparent',
    borderColor: 'border-cyan-500'
  },
  desarmado: {
    color: 'text-zinc-600 dark:text-zinc-400', 
    gradient: 'from-zinc-500/5 to-transparent',
    borderColor: 'border-zinc-500'
  },
};

export function SwipeablePoderCard({
  poder,
  isPublic,
  onCarregar,
  onDuplicar,
  onExportar,
  onDeletar,
  onTogglePublic,
  onVerResumo,
  formatarData,
  carregandoId,
  deletandoId,
  duplicandoId,
  exportandoId,
  togglePublicId
}: SwipeablePoderCardProps) {
  const isTouchDevice = useIsTouchDevice();
  const swipeHandlers = useSwipeToDismiss(onDeletar, 80);

  const visual = DOMINIO_VISUAL[poder.dominioId || 'natural'] || DOMINIO_VISUAL.natural;

  return (
    <div className="relative overflow-hidden h-full">
      {/* Botão de deletar revelado ao swipe (apenas touch) */}
      {isTouchDevice && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 dark:bg-red-700 px-6">
          <span className="text-white font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5" /> Deletar</span>
        </div>
      )}

      {/* Card principal */}
      <div
        {...(isTouchDevice ? swipeHandlers : {})}
        className="bg-white dark:bg-gray-800 h-full"
      >
        <Card hover className={`h-full min-h-[18rem] border-t-4 ${visual.borderColor} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-b ${visual.gradient} pointer-events-none opacity-50`}></div>
          <CardContent className="p-4 h-full relative z-10">
            <div className="flex flex-col gap-3 h-full">
              {/* Cabeçalho com nome e badge — clicável para abrir resumo */}
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={onVerResumo}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {poder.icone && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/20 border border-gray-200/30 dark:border-gray-700/30 group-hover:scale-105 transition-transform shadow-sm">
                      <DynamicIcon name={poder.icone} className={`w-14 h-14 ${visual.color}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg break-words hover:text-purple-600 dark:hover:text-purple-400 transition-colors leading-tight">
                    {poder.nome}
                  </h3>
                  {isPublic && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                      <Globe className="w-3 h-3" /> Público
                    </span>
                  )}
                  </div>
                </div>
                <Badge variant="secondary" size="sm" className="flex-shrink-0">
                  {poder.efeitos.length} {poder.efeitos.length === 1 ? 'efeito' : 'efeitos'}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3">
                {/* Descrição — Markdown e clicável */}
                {poder.descricao ? (
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 break-words cursor-pointer min-h-[3rem] prose-sm dark:prose-invert prose-p:my-0 prose-headings:text-xs prose-ul:my-1 prose-li:my-0"
                    onClick={onVerResumo}
                  >
                    <MarkdownText>{poder.descricao}</MarkdownText>
                  </div>
                ) : (
                  <div className="min-h-[3rem]" />
                )}

                {/* Rodapé — linha 1: data + ações secundárias */}
                <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                  {formatarData(poder.dataCriacao)}
                </p>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicar}
                    title="Duplicar"
                    loading={duplicandoId === poder.id}
                    disabled={duplicandoId !== null && duplicandoId !== poder.id}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExportar}
                    title="Exportar JSON"
                    loading={exportandoId === poder.id}
                    disabled={exportandoId !== null && exportandoId !== poder.id}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePublic}
                    title={isPublic ? 'Tornar privado' : 'Publicar'}
                    loading={togglePublicId === poder.id}
                    disabled={togglePublicId !== null && togglePublicId !== poder.id}
                    className={isPublic ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                  >
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeletar}
                    className="text-red-500 hover:text-red-700"
                    title="Deletar"
                    loading={deletandoId === poder.id}
                    disabled={deletandoId !== null && deletandoId !== poder.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Linha 2: Carregar */}
              <Button
                variant="primary"
                size="sm"
                onClick={onCarregar}
                loading={carregandoId === poder.id}
                loadingText="Carregando…"
                className="w-full flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" /> Carregar no Editor
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
