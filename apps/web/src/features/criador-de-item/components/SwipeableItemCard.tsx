import { Coins, Copy, Download, FlaskConical, FolderOpen, Gem, Globe, HandCoins, Layers, Lock, Package, Shield, Sword, Trash2, Zap } from 'lucide-react';
import { Badge, Button, Card, CardContent, DynamicIcon } from '@/shared/ui';
import { useIsTouchDevice, useSwipeToDismiss } from '@/shared/hooks';
import { MarkdownText } from '@/shared/components';
import type { ItemResponse } from '@/services/types';

interface SwipeableItemCardProps {
  item: ItemResponse;
  onCarregar: () => void;
  onDuplicar: () => void;
  onDeletar: () => void;
  onTogglePublic: () => void;
  onVerResumo: () => void;
  onUsarComoTemplate?: () => void;
  onExportar?: () => void;
  formatarData: (data: string) => string;
  carregandoId: string | null;
  duplicandoId: string | null;
  deletandoId: string | null;
  togglePublicId: string | null;
  exportandoId?: string | null;
}

export const TIPO_ITEM_VISUAL: Record<string, { color: string; gradient: string; border: string }> = {
  weapon: { color: 'text-rose-600', gradient: 'from-rose-500/5', border: 'border-rose-500' },
  'defensive-equipment': { color: 'text-blue-600', gradient: 'from-blue-500/5', border: 'border-blue-500' },
  consumable: { color: 'text-emerald-600', gradient: 'from-emerald-500/5', border: 'border-emerald-500' },
  artifact: { color: 'text-purple-600', gradient: 'from-purple-500/5', border: 'border-purple-500' },
  accessory: { color: 'text-amber-500', gradient: 'from-amber-500/5', border: 'border-amber-500' },
  general: { color: 'text-slate-600', gradient: 'from-slate-500/5', border: 'border-slate-500' },
  'upgrade-material': { color: 'text-cyan-600', gradient: 'from-cyan-500/5', border: 'border-cyan-500' },
};

function getTipoItemLabel(tipo: ItemResponse['tipo']) {
  const labels: Record<ItemResponse['tipo'], string> = {
    weapon: 'Arma',
    'defensive-equipment': 'Equipamento Defensivo',
    consumable: 'Consumivel',
    artifact: 'Artefato',
    accessory: 'Acessorio',
    general: 'Geral',
    'upgrade-material': 'Material de Upgrade',
  };

  return labels[tipo] ?? tipo;
}

function getTipoItemIcon(tipo: ItemResponse['tipo']) {
  if (tipo === 'weapon') return <Sword className="w-4 h-4" />;
  if (tipo === 'defensive-equipment') return <Shield className="w-4 h-4" />;
  if (tipo === 'consumable') return <FlaskConical className="w-4 h-4" />;
  if (tipo === 'artifact') return <Gem className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
}

export function SwipeableItemCard({
  item,
  onCarregar,
  onDuplicar,
  onDeletar,
  onTogglePublic,
  onVerResumo,
  onUsarComoTemplate,
  onExportar,
  formatarData,
  carregandoId,
  duplicandoId,
  deletandoId,
  togglePublicId,
  exportandoId,
}: SwipeableItemCardProps) {
  const isTouchDevice = useIsTouchDevice();
  const swipeHandlers = useSwipeToDismiss(onDeletar, 80);
  const visual = TIPO_ITEM_VISUAL[item.tipo] || TIPO_ITEM_VISUAL.general;

  const formatarRunic = (valor: number) => new Intl.NumberFormat('pt-BR').format(valor);

  return (
    <div className="relative overflow-hidden h-full">
      {isTouchDevice && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600 dark:bg-red-700 px-6">
          <span className="text-white font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Deletar
          </span>
        </div>
      )}

      <div {...(isTouchDevice ? swipeHandlers : {})} className="bg-white dark:bg-gray-800 h-full">
        <Card hover className={`h-full min-h-[18rem] border-t-4 ${visual.border} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-b ${visual.gradient} to-transparent pointer-events-none opacity-50`}></div>
          <CardContent className="p-4 h-full relative z-10">
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onVerResumo}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {item.icone && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/20 border border-gray-200/30 dark:border-gray-700/30 group-hover:scale-105 transition-transform shadow-sm">
                      <DynamicIcon name={item.icone} className={`w-14 h-14 ${visual.color}`} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                      {getTipoItemIcon(item.tipo)}
                      <span className="text-xs uppercase tracking-wide">{getTipoItemLabel(item.tipo)}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base break-words hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {item.nome}
                    </h3>

                    {item.isPublic && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                        <Globe className="w-3 h-3" /> Publico
                      </span>
                    )}
                  </div>
                </div>

                <Badge variant="secondary" size="sm" className="flex-shrink-0">
                  Nivel {item.nivelItem}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3">
                {item.descricao ? (
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 break-words cursor-pointer min-h-[3rem] prose-sm dark:prose-invert prose-p:my-0 prose-headings:text-xs prose-ul:my-1 prose-li:my-0"
                    onClick={onVerResumo}
                  >
                    <MarkdownText>{item.descricao}</MarkdownText>
                  </div>
                ) : (
                  <div className="min-h-[3rem]" />
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2 border-y border-gray-100/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-2 group/stat">
                    <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-0.5">V. Real</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatarRunic(item.valorBase ?? 0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 group/stat">
                    <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <HandCoins className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-0.5">Venda</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatarRunic(item.precoVenda ?? 0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 group/stat">
                    <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-0.5">Poderes</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.powerIds.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 group/stat">
                    <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-0.5">Acervos</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.powerArrayIds.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                  {formatarData(item.createdAt)}
                </p>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePublic}
                    title={item.isPublic ? 'Tornar privado' : 'Publicar'}
                    loading={togglePublicId === item.id}
                    disabled={togglePublicId !== null && togglePublicId !== item.id}
                    className={item.isPublic ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                  >
                    {item.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicar}
                    title="Duplicar"
                    loading={duplicandoId === item.id}
                    disabled={duplicandoId !== null && duplicandoId !== item.id}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeletar}
                    className="text-red-500 hover:text-red-700"
                    title="Deletar"
                    loading={deletandoId === item.id}
                    disabled={deletandoId !== null && deletandoId !== item.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUsarComoTemplate}
                    className="text-purple-500 hover:text-purple-700"
                    title="Usar como Template"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>

                  {onExportar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onExportar}
                      className="text-blue-500 hover:text-blue-700"
                      title="Exportar como JSON"
                      loading={exportandoId === item.id}
                      disabled={exportandoId !== null && exportandoId !== item.id}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={onCarregar}
                loading={carregandoId === item.id}
                loadingText="Carregando..."
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