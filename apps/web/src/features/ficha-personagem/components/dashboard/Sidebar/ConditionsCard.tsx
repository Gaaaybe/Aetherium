import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, ModalFooter, Tooltip, toast } from '@/shared/ui';
import { AlertTriangle, Info, X, Search, ShieldAlert, Dices, Skull, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CONDICOES, Condicao } from '@/data';
import { SyncCharacterData, CharacterResponse } from '@/services/characters.types';
import { renderDescriptionWithTooltips } from '@/features/ficha-personagem/utils/conditionsHelper';

interface ConditionsCardProps {
  conditions: string[];
  onSync: (data: SyncCharacterData) => Promise<void>;
  character: CharacterResponse;
}

export function ConditionsCard({ conditions, onSync, character }: ConditionsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatamar, setSelectedPatamar] = useState<string>('todos');
  const [privadoSense, setPrivadoSense] = useState('');
  const [confusoRoll, setConfusoRoll] = useState<{
    result: number;
    direction?: number;
    directionLabel?: string;
  } | null>(null);


  const rollConfuso = () => {
    const d6 = Math.floor(Math.random() * 6) + 1;
    let direction: number | undefined;
    let directionLabel: string | undefined;

    if (d6 === 1) {
      direction = Math.floor(Math.random() * 8) + 1;
      const directions = [
        'Norte',
        'Nordeste',
        'Leste',
        'Sudeste',
        'Sul',
        'Sudoeste',
        'Oeste',
        'Noroeste'
      ];
      directionLabel = directions[direction - 1];
    }

    setConfusoRoll({ result: d6, direction, directionLabel });
  };

  const handleAddPrivado = async () => {
    const sense = privadoSense.trim();
    const condName = sense ? `Privado (${sense})` : 'Privado';
    if (conditions.includes(condName)) {
      setPrivadoSense('');
      return;
    }
    const newConditions = [...conditions, condName];
    await onSync({ conditions: newConditions });
    setPrivadoSense('');
  };

  // Mapeamento de Evoluções
  const EVOLUTIONS: Record<string, string> = {
    Abalado: 'Apavorado',
    Fraco: 'Debilitado',
    Debilitado: 'Inconsciente',
    Frustrado: 'Esmorecido',
    Fatigado: 'Exausto',
    Exausto: 'Inconsciente',
  };

  const handleAddCondition = async (condName: string) => {
    let newConditions = [...conditions];
    if (newConditions.includes(condName)) {
      const evo = EVOLUTIONS[condName];
      if (evo) {
        newConditions = newConditions.filter(c => c !== condName);
        let current = evo;
        while (newConditions.includes(current)) {
          const next = EVOLUTIONS[current];
          if (next) {
            newConditions = newConditions.filter(c => c !== current);
            current = next;
          } else {
            break;
          }
        }
        if (!newConditions.includes(current)) {
          newConditions.push(current);
        }
      }
    } else {
      newConditions.push(condName);
    }
    await onSync({ conditions: newConditions });
  };

  const handleRemoveCondition = async (condName: string) => {
    const newConditions = conditions.filter(c => c !== condName);
    await onSync({ conditions: newConditions });
  };

  const filteredCondicoes = useMemo(() => {
    return CONDICOES.filter((c) => {
      const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPatamar = selectedPatamar === 'todos' || c.patamar.toLowerCase() === selectedPatamar.toLowerCase();
      return matchesSearch && matchesPatamar;
    });
  }, [searchTerm, selectedPatamar]);

  const getPatamarBadgeStyle = (patamar: string) => {
    switch (patamar.toLowerCase()) {
      case 'fraca':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'média':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'forte':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'extrema':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-900/30';
    }
  };

  const deathState = character?.death?.state || 'ALIVE';
  const deathCounter = character?.death?.counter || 0;

  return (
    <>
      <Card className="border-none shadow-md bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black flex items-center gap-2 text-gray-500 uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Condições e Estados
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-7 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-3 rounded-lg flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30"
          >
            Gerenciar
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Marcadores de Morte / Estado de Morte */}
          <div className={`mb-4 p-3.5 rounded-2xl border space-y-3 transition-colors ${
            deathState === 'DEAD'
              ? 'border-red-200 dark:border-red-950/80 bg-red-100/10 dark:bg-red-950/20'
              : deathState === 'DYING'
              ? 'border-red-100 dark:border-red-950/40 bg-red-50/20 dark:bg-red-950/10'
              : 'border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className={`w-4 h-4 transition-colors ${
                  deathState === 'DEAD'
                    ? 'text-red-600 animate-pulse'
                    : deathState === 'DYING'
                    ? 'text-red-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                  deathState !== 'ALIVE'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {deathState === 'DEAD' ? 'Personagem Morto' : deathState === 'DYING' ? 'Estado: Morrendo' : 'Estado: Normal'}
                </span>
              </div>
              
              {deathCounter > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await onSync({ deathState: 'ALIVE', deathCounter: 0 });
                    toast.success('Estado de morte resetado narrativamente!');
                  }}
                  className="h-6 text-[8px] font-extrabold uppercase text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 rounded-lg flex items-center gap-1 border border-red-200/50 dark:border-red-900/30 animate-fade-in"
                  title="Reset Narrativo (Fim da Cena)"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </Button>
              )}
            </div>

            {/* Markers Row */}
            <div className={`flex items-center justify-between py-1 bg-white/50 dark:bg-black/20 rounded-xl px-3 border transition-colors ${
              deathState !== 'ALIVE'
                ? 'border-red-50 dark:border-red-900/20'
                : 'border-gray-100 dark:border-gray-800/40'
            }`}>
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                Marcadores:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((val) => {
                  const isActive = deathCounter >= val;
                  return (
                    <button
                      key={val}
                      onClick={async () => {
                        const nextCounter = val;
                        const nextState = nextCounter >= 3 ? 'DEAD' : 'DYING';
                        await onSync({ deathCounter: nextCounter, deathState: nextState });
                      }}
                      className={`p-1 rounded-lg transition-all ${
                        isActive
                          ? 'text-red-600 dark:text-red-500 scale-110 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]'
                          : 'text-gray-300 dark:text-gray-700 hover:text-red-300'
                      }`}
                      title={`Definir marcadores para ${val}/3`}
                    >
                      <Skull className="w-4 h-4 fill-current" />
                    </button>
                  );
                })}
                <span className={`text-xs font-black ml-1 transition-colors ${
                  deathCounter > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {deathCounter}/3
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
            {conditions.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic py-1">
                <Info className="w-3 h-3 text-gray-400" />
                Nenhuma condição ativa
              </div>
            ) : (
              conditions.map((condition) => {
                const baseConditionName = condition.includes('(') ? condition.split('(')[0].trim() : condition;
                const condData = CONDICOES.find(c => c.nome.toLowerCase() === baseConditionName.toLowerCase());
                const isConfuso = baseConditionName.toLowerCase() === 'confuso';
                const badgeElement = (
                  <Badge
                    variant="outline"
                    className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 pr-1 flex items-center gap-1 font-bold rounded-lg shadow-sm cursor-help"
                  >
                    {condition}
                    {isConfuso && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          rollConfuso();
                        }}
                        className="hover:text-amber-600 dark:hover:text-amber-300 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950 rounded p-0.5 transition-colors ml-1"
                        title="Rolar Comportamento Confuso (1d6)"
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveCondition(condition);
                      }}
                      className="hover:text-red-500 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors"
                      title={`Remover ${condition}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                );

                if (condData) {
                  return (
                    <Tooltip
                      key={condition}
                      position="top"
                      content={
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold uppercase text-[10px] text-white">
                              {condData.nome}
                            </span>
                            <span className="text-[9px] px-1 bg-gray-700 rounded text-gray-300 font-extrabold uppercase">
                              {condData.patamar}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-200 font-medium leading-relaxed italic">
                            {condData.descricao}
                          </p>
                        </div>
                      }
                    >
                      {badgeElement}
                    </Tooltip>
                  );
                }

                return <div key={condition}>{badgeElement}</div>;
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal de Gerenciamento de Condições ────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerenciar Condições e Estados"
        size="xl"
      >
        <div className="py-2 space-y-6">
          {/* Header/Pesquisa */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar condição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 self-stretch sm:self-auto shrink-0 overflow-x-auto pb-1 sm:pb-0">
              {['todos', 'fraca', 'média', 'forte', 'extrema'].map((pat) => (
                <button
                  key={pat}
                  onClick={() => setSelectedPatamar(pat)}
                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                    selectedPatamar === pat
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {pat === 'todos' ? 'Todos' : pat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Condições */}
          <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {filteredCondicoes.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 italic">
                Nenhuma condição encontrada para a busca
              </div>
            ) : (
              filteredCondicoes.map((cond: Condicao) => {
                const isPrivado = cond.nome === 'Privado';
                const isActive = isPrivado 
                  ? conditions.some(c => c.startsWith('Privado'))
                  : conditions.includes(cond.nome);

                return (
                  <div
                    key={cond.id}
                    className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isActive
                        ? 'bg-indigo-50/20 border-indigo-200 dark:border-indigo-900/40 dark:bg-indigo-950/10'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-xs font-black uppercase text-gray-900 dark:text-gray-100 tracking-tight">
                          {cond.nome}
                        </h4>
                        <Badge variant="outline" className={`text-[8px] font-extrabold uppercase px-1.5 py-0 rounded-md ${getPatamarBadgeStyle(cond.patamar)}`}>
                          {cond.patamar}
                        </Badge>
                        {cond.evolucao && (
                          <Badge variant="secondary" className="bg-gray-50 dark:bg-gray-950 text-gray-400 border-none font-bold text-[8px] px-1.5 py-0 flex items-center gap-1 rounded-md">
                            <ShieldAlert className="w-2.5 h-2.5 text-gray-400" />
                            Evolui para: {cond.evolucao}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 italic font-medium">
                        {renderDescriptionWithTooltips(cond.descricao, cond.nome, 'bottom')}
                      </div>

                      {isPrivado && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              placeholder="Sentido (ex: Olfato)"
                              value={privadoSense}
                              onChange={(e) => setPrivadoSense(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPrivado();
                                }
                              }}
                              className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 font-bold"
                            />
                            <Button
                              size="sm"
                              onClick={handleAddPrivado}
                              className="font-black uppercase text-[9px] px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                            >
                              Adicionar
                            </Button>
                          </div>
                          
                          {/* Senses active list */}
                          {conditions.filter(c => c.startsWith('Privado')).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {conditions
                                .filter(c => c.startsWith('Privado'))
                                .map(c => (
                                  <Badge
                                    key={c}
                                    variant="outline"
                                    className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-[9px] px-2 py-0.5 pr-1 flex items-center gap-1 font-bold rounded-lg"
                                  >
                                    {c}
                                    <button
                                      onClick={() => handleRemoveCondition(c)}
                                      className="hover:text-red-500 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors"
                                      title={`Remover ${c}`}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center justify-end">
                      {!isPrivado && (
                        isActive ? (
                          <div className="flex items-center gap-2">
                            {cond.evolucao && (
                              <Button
                                size="sm"
                                onClick={() => handleAddCondition(cond.nome)}
                                className="font-black uppercase text-[9px] px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-sm"
                                title="Evoluir condição para o próximo estágio"
                              >
                                Evoluir
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleRemoveCondition(cond.nome)}
                              className="font-black uppercase text-[9px] px-3.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all border border-red-100 dark:border-red-900/20"
                            >
                              Remover
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddCondition(cond.nome)}
                            className="font-black uppercase text-[9px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm"
                          >
                            Ativar
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <ModalFooter className="pt-4 border-t border-gray-100 dark:border-gray-900">
          <Button
            variant="ghost"
            onClick={() => setIsModalOpen(false)}
            className="font-black uppercase text-[10px] tracking-widest px-6"
          >
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {confusoRoll && (
        <Modal
          isOpen={!!confusoRoll}
          onClose={() => setConfusoRoll(null)}
          title="Comportamento Confuso (1d6)"
          size="sm"
        >
          <div className="py-2 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-lg animate-bounce">
                {confusoRoll.result}
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">
                  {confusoRoll.result === 1 && "1: Movimentação Aleatória"}
                  {(confusoRoll.result === 2 || confusoRoll.result === 3) && "2-3: Balbuciando / Sem Ações"}
                  {(confusoRoll.result === 4 || confusoRoll.result === 5) && "4-5: Ataque Hostil"}
                  {confusoRoll.result === 6 && "6: Clareza Mental"}
                </h4>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed max-w-xs">
                  {confusoRoll.result === 1 && (
                    <>
                      Seu personagem se move em uma direção aleatória.
                      <div className="mt-3 p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 text-[10px] font-black uppercase">
                        Direção Rolada (1d8): {confusoRoll.direction} — {confusoRoll.directionLabel}
                      </div>
                    </>
                  )}
                  {(confusoRoll.result === 2 || confusoRoll.result === 3) && (
                    "Você não pode realizar nenhuma ação nesta rodada (exceto reações) e fica balbuciando incoherentemente."
                  )}
                  {(confusoRoll.result === 4 || confusoRoll.result === 5) && (
                    "Você deve atacar a criatura mais próxima (ou a si mesmo, caso esteja sozinho na cena)."
                  )}
                  {confusoRoll.result === 6 && (
                    "A confusão cessa! A condição termina imediatamente e você pode agir normalmente neste turno."
                  )}
                </div>
              </div>
            </div>
            {confusoRoll.result === 6 && (
              <Button
                onClick={async () => {
                  await handleRemoveCondition('Confuso');
                  setConfusoRoll(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl shadow-sm transition-all"
              >
                Encerrar Condição (Confuso)
              </Button>
            )}
          </div>
          <ModalFooter className="pt-2 border-t border-gray-100 dark:border-gray-900">
            <Button
              variant="ghost"
              onClick={() => setConfusoRoll(null)}
              className="w-full font-black uppercase text-[10px] tracking-widest"
            >
              Fechar
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
