import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowUp, CircleHelp, Edit2, Gauge, Minus, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Input, Modal, ModalFooter, Textarea, Tooltip, toast } from '@/shared/ui';
import { charactersService } from '@/services/characters.service';
import type { CharacterCustomResource, CharacterCustomResourceInput, CharacterResourceStyle } from '@/services/characters.types';

interface CustomResourcesCardProps {
  characterId: string;
  initialResources: CharacterCustomResource[];
}

const colorStyles = {
  indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500', soft: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  blue: { text: 'text-blue-500', bg: 'bg-blue-500', soft: 'bg-blue-500/10', border: 'border-blue-500/20' },
  emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', soft: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  amber: { text: 'text-amber-500', bg: 'bg-amber-500', soft: 'bg-amber-500/10', border: 'border-amber-500/20' },
  rose: { text: 'text-rose-500', bg: 'bg-rose-500', soft: 'bg-rose-500/10', border: 'border-rose-500/20' },
  violet: { text: 'text-violet-500', bg: 'bg-violet-500', soft: 'bg-violet-500/10', border: 'border-violet-500/20' },
} as const;

const emptyForm: CharacterCustomResourceInput = {
  name: '',
  description: '',
  style: 'COUNTER',
  color: 'indigo',
  current: 0,
  minimum: 0,
  maximum: null,
  step: 1,
};

export function CustomResourcesCard({ characterId, initialResources }: CustomResourcesCardProps) {
  const [resources, setResources] = useState(initialResources);
  const [editing, setEditing] = useState<CharacterCustomResource | null>(null);
  const [form, setForm] = useState<CharacterCustomResourceInput>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CharacterCustomResource | null>(null);

  useEffect(() => setResources(initialResources || []), [initialResources]);

  const commitResources = (next: CharacterCustomResource[]) => {
    const transitionDocument = document as Document & {
      startViewTransition?: (update: () => void) => void;
    };
    if (!transitionDocument.startViewTransition) {
      setResources(next);
      return;
    }
    transitionDocument.startViewTransition(() => {
      flushSync(() => setResources(next));
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (resource: CharacterCustomResource) => {
    setEditing(resource);
    setForm({
      name: resource.name,
      description: resource.description || '',
      style: resource.style,
      color: resource.color,
      current: resource.current,
      minimum: resource.minimum,
      maximum: resource.maximum,
      step: resource.step,
    });
    setIsFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Informe um nome para o recurso.');
    if ((form.style === 'BAR' || form.style === 'DOTS') && form.maximum == null) {
      return toast.error('Barra e pontos precisam de um valor máximo.');
    }
    if (form.maximum != null && form.maximum < form.minimum) {
      return toast.error('O valor máximo não pode ser menor que o mínimo.');
    }
    if (form.style === 'DOTS' && form.maximum != null && form.maximum - form.minimum > 30) {
      return toast.error('O estilo de pontos permite no máximo 30 posições.');
    }

    setIsSaving(true);
    try {
      const next = editing
        ? await charactersService.updateCustomResource(characterId, editing.id, form)
        : await charactersService.createCustomResource(characterId, form);
      commitResources(next);
      setIsFormOpen(false);
      toast.success(editing ? 'Recurso atualizado!' : 'Recurso criado!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível salvar o recurso.');
    } finally {
      setIsSaving(false);
    }
  };

  const adjust = async (resource: CharacterCustomResource, direction: -1 | 1) => {
    if (updatingId) return;
    setUpdatingId(resource.id);
    try {
      commitResources(await charactersService.adjustCustomResource(characterId, resource.id, resource.step * direction));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível alterar o recurso.');
    } finally {
      setUpdatingId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= resources.length || updatingId) return;
    const reordered = [...resources];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    commitResources(reordered);
    setUpdatingId(resources[index].id);
    try {
      commitResources(await charactersService.reorderCustomResources(characterId, reordered.map(resource => resource.id)));
    } catch (error: any) {
      commitResources(resources);
      toast.error(error?.response?.data?.message || 'Não foi possível reordenar os recursos.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderValue = (resource: CharacterCustomResource) => {
    const colors = colorStyles[resource.color];
    if (resource.style === 'BAR') {
      const range = Math.max(1, (resource.maximum ?? resource.minimum + 1) - resource.minimum);
      const percentage = Math.max(0, Math.min(100, ((resource.current - resource.minimum) / range) * 100));
      return (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-black text-gray-500">
            <span>{resource.current}</span><span>{resource.maximum}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className={`h-full rounded-full transition-all ${colors.bg}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      );
    }
    if (resource.style === 'DOTS') {
      const count = Math.max(0, (resource.maximum ?? resource.minimum) - resource.minimum);
      const filled = Math.max(0, resource.current - resource.minimum);
      return (
        <div className="flex flex-wrap gap-1.5" aria-label={`${resource.current} de ${resource.maximum}`}>
          {Array.from({ length: count }, (_, index) => (
            <span key={index} className={`h-3 w-3 rounded-full border ${colors.border} ${index < filled ? colors.bg : 'bg-transparent'}`} />
          ))}
        </div>
      );
    }
    return <span className={`text-2xl font-black ${colors.text}`}>{resource.current}</span>;
  };

  return (
    <>
      <Card style={{ viewTransitionName: 'custom-resources-card' }} className="h-fit self-start border-none shadow-md bg-white dark:bg-gray-900 border-l-4 border-l-blue-500/20 transition-all duration-500 ease-out animate-in fade-in slide-in-from-top-2">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
            <Gauge className="w-4 h-4 text-blue-500" /> Recursos
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 px-2 gap-1 text-[10px]" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Criar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 py-3">
          {resources.length === 0 && (
            <button type="button" onClick={openCreate} className="w-full rounded-xl border border-dashed border-gray-300 p-4 text-xs text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-700">
              Crie barras, pontos ou contadores para recursos narrativos.
            </button>
          )}
          {resources.map((resource, index) => {
            const colors = colorStyles[resource.color];
            const atMinimum = resource.current <= resource.minimum;
            const atMaximum = resource.maximum != null && resource.current >= resource.maximum;
            return (
              <div key={resource.id} className={`rounded-xl border p-3 transition-all duration-300 ease-out animate-in fade-in slide-in-from-right-2 ${colors.border} ${colors.soft}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-black text-gray-800 dark:text-gray-100">{resource.name}</span>
                      {resource.description && (
                        <Tooltip content={resource.description} position="bottom-left">
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-white/5 dark:hover:text-gray-200"
                            aria-label={`Informações sobre ${resource.name}`}
                          >
                            <CircleHelp className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                    {renderValue(resource)}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0" onClick={() => adjust(resource, -1)} disabled={!!updatingId || atMinimum}><Minus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0" onClick={() => adjust(resource, 1)} disabled={!!updatingId || atMaximum}><Plus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0" onClick={() => openEdit(resource)} title="Editar"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 !p-0 text-red-500" onClick={() => setDeleting(resource)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {resources.length > 1 && (
                  <div className="mt-2 flex justify-end gap-1 border-t border-black/5 pt-1 dark:border-white/5">
                    <button className="p-1 text-gray-400 disabled:opacity-25" onClick={() => move(index, -1)} disabled={index === 0 || !!updatingId} title="Mover para cima"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button className="p-1 text-gray-400 disabled:opacity-25" onClick={() => move(index, 1)} disabled={index === resources.length - 1 || !!updatingId} title="Mover para baixo"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? 'Editar recurso' : 'Novo recurso'} size="sm">
        <div className="space-y-4 p-1">
          <Input label="Nome" maxLength={60} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          <Textarea label="Descrição (opcional)" maxLength={500} rows={3} value={form.description || ''} onChange={event => setForm({ ...form, description: event.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">Estilo
              <select className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.style} onChange={event => setForm({ ...form, style: event.target.value as CharacterResourceStyle, maximum: event.target.value === 'COUNTER' ? form.maximum : (form.maximum ?? 5) })}>
                <option value="COUNTER">Contador</option><option value="BAR">Barra</option><option value="DOTS">Pontos</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cor
              <select className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.color} onChange={event => setForm({ ...form, color: event.target.value as CharacterCustomResource['color'] })}>
                <option value="indigo">Índigo</option><option value="blue">Azul</option><option value="emerald">Verde</option><option value="amber">Âmbar</option><option value="rose">Rosa</option><option value="violet">Violeta</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor atual" type="number" value={form.current} onChange={event => setForm({ ...form, current: Number(event.target.value) })} />
            <Input label="Passo" type="number" min={1} value={form.step} onChange={event => setForm({ ...form, step: Math.max(1, Number(event.target.value)) })} />
            <Input label="Mínimo" type="number" value={form.minimum} onChange={event => setForm({ ...form, minimum: Number(event.target.value) })} />
            <Input label={form.style === 'COUNTER' ? 'Máximo (opcional)' : 'Máximo'} type="number" value={form.maximum ?? ''} onChange={event => setForm({ ...form, maximum: event.target.value === '' ? null : Number(event.target.value) })} />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={save} loading={isSaving}>Salvar</Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={async () => {
        if (!deleting) return;
        try {
          commitResources(await charactersService.deleteCustomResource(characterId, deleting.id));
          toast.success('Recurso excluído.');
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Não foi possível excluir o recurso.');
          throw error;
        }
      }} title="Excluir recurso" message={`Excluir “${deleting?.name || ''}”?`} confirmText="Excluir" variant="danger" />
    </>
  );
}
