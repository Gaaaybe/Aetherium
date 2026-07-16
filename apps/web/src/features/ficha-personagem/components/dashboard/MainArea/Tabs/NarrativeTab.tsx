import { useState } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge } from '@/shared/ui';
import { BookOpen, User, MapPin, Flag, Edit2, Save, X, Plus, Trash2, Zap, Sparkles } from 'lucide-react';
import { charactersService } from '@/services/characters.service';
import { toast } from '@/shared/ui/Toast';
import { getPsychicPenalties } from '@aetherium/rules-engine';

interface NarrativeTabProps {
  character: CharacterResponse;
  _onSync: (data: SyncCharacterData) => Promise<void>;
}

export function NarrativeTab({ character, _onSync }: NarrativeTabProps) {
  const [isEditingProfile, setIsEditingOrigin] = useState(false);
  const [isEditingMotivations, setIsEditingMotivations] = useState(false);
  const [isEditingComplications, setIsEditingComplications] = useState(false);

  // Form States
  const [origin, setOrigin] = useState(character.narrative.origin);
  const [motivations, setMotivations] = useState<string[]>([...character.narrative.motivations]);
  const [complications, setComplications] = useState<string[]>([...character.narrative.complications]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Deity Devotion States
  const [isEditingDeity, setIsEditingDeity] = useState(false);
  const [deityName, setDeityName] = useState(character.narrative.deity?.name || '');
  const [deityAspects, setDeityAspects] = useState<string[]>(character.narrative.deity?.aspects || []);
  const [newAspect, setNewAspect] = useState('');
  const [deityPrecepts, setDeityPrecepts] = useState(character.narrative.deity?.precepts || '');
  const [deityMinorPrecepts, setDeityMinorPrecepts] = useState(character.narrative.deity?.minorPrecepts || '');
  const [deityTaboos, setDeityTaboos] = useState(character.narrative.deity?.taboos || '');
  const [deityPersonality, setDeityPersonality] = useState(character.narrative.deity?.personality || '');
  const [deityIsSealed, setDeityIsSealed] = useState(character.narrative.deity?.isSealed || false);

  // Sync state when character updates from backend
  useState(() => {
    // Initial sync
    if (character.narrative.deity) {
      setDeityName(character.narrative.deity.name || '');
      setDeityAspects(character.narrative.deity.aspects || []);
      setDeityPrecepts(character.narrative.deity.precepts || '');
      setDeityMinorPrecepts(character.narrative.deity.minorPrecepts || '');
      setDeityTaboos(character.narrative.deity.taboos || '');
      setDeityPersonality(character.narrative.deity.personality || '');
      setDeityIsSealed(character.narrative.deity.isSealed || false);
    }
  });

  const handleSaveDeity = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          deity: {
            name: deityName,
            aspects: deityAspects.filter(a => a.trim() !== ''),
            precepts: deityPrecepts,
            minorPrecepts: deityMinorPrecepts,
            taboos: deityTaboos,
            personality: deityPersonality,
            isSealed: deityIsSealed,
          }
        }
      });
      setIsEditingDeity(false);
      toast.success('Informações da divindade salvas!');
    } catch {
      toast.error('Erro ao salvar informações da divindade.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSeal = async () => {
    setIsProcessing(true);
    try {
      const currentDeity = character.narrative.deity || {
        name: '',
        aspects: [],
        precepts: '',
        minorPrecepts: '',
        taboos: '',
        personality: '',
        isSealed: false,
      };
      const nextSealedState = !currentDeity.isSealed;
      await _onSync({
        narrative: {
          deity: {
            ...currentDeity,
            isSealed: nextSealedState,
          }
        }
      });
      setDeityIsSealed(nextSealedState);
      toast.success(nextSealedState ? 'Espírito selado!' : 'Espírito restaurado!');
    } catch {
      toast.error('Erro ao alterar estado do espírito.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          origin,
        }
      });
      setIsEditingOrigin(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMotivations = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          motivations: motivations.filter(m => m.trim() !== ''),
        }
      });
      setIsEditingMotivations(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveComplications = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          complications: complications.filter(c => c.trim() !== ''),
        }
      });
      setIsEditingComplications(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAwaken = async () => {
    if (!window.confirm('Despertar o Princípio Espiritual custa 15 PdA. Deseja continuar?')) return;
    setIsProcessing(true);
    try {
      await charactersService.unlockSpiritualPrinciple(character.id, { stage: 'NORMAL' });
      toast.success('Princípio Espiritual despertado!');
      window.location.reload(); // Refresh to get updated PdA and principle
    } catch (err) {
      toast.error('Erro ao despertar princípio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEvolve = async () => {
    if (character.level < 35) {
      toast.error('Você precisa de nível 35 para evoluir para o estágio Divino.');
      return;
    }
    if (!window.confirm('Evoluir para o estágio Divino é um passo permanente. Deseja continuar?')) return;

    setIsProcessing(true);
    try {
      await charactersService.evolveSpiritualPrinciple(character.id);
      toast.success('Você atingiu o estágio DIVINO!');
      window.location.reload();
    } catch (err) {
      toast.error('Erro ao evoluir princípio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetStress = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          psychicState: {
            stress: 0
          }
        }
      });
      toast.success('Você descansou e recuperou seu estresse psíquico!');
    } catch {
      toast.error('Erro ao realizar o descanso.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Coluna Principal - Origem & Histórias & Motivações/Complicações */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Card: Origem & História */}
          <Card className="border-none shadow-md bg-white dark:bg-gray-900 w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Origem & História
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              {/* Context Metadata Row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 w-full">
                <div className="min-w-0 break-words flex-1 sm:flex-none">
                  <span className="font-bold uppercase tracking-wider">Nome:</span>{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300 break-all">{character.narrative.name || character.narrative.identity}</span>
                </div>
                <div className="sm:border-l sm:pl-6 border-gray-200 dark:border-gray-750 min-w-0 break-words flex-1 sm:flex-none">
                  <span className="font-bold uppercase tracking-wider">Identidade:</span>{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300 break-all">{character.narrative.identity || 'Nenhuma'}</span>
                </div>
              </div>

              <div className="pt-2 w-full min-w-0">
                {isEditingProfile ? (
                  <div className="space-y-4 w-full">
                    <Textarea
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="mt-1 min-h-[250px] font-sans text-sm leading-relaxed p-4 bg-gray-50/50 dark:bg-gray-800/20 focus:bg-white dark:focus:bg-gray-900 border-gray-200 dark:border-gray-850 rounded-xl w-full break-words"
                      placeholder="Escreva detalhadamente a origem, história e background do seu personagem..."
                    />
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveProfile} loading={isProcessing}>
                        <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-650" onClick={() => { setIsEditingOrigin(false); setOrigin(character.narrative.origin); }}>
                        <X className="w-4 h-4 mr-2" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="prose dark:prose-invert max-w-none w-full min-w-0">
                      {character.narrative.origin ? (
                        <p className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words w-full">
                          {character.narrative.origin}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic py-6 text-center">
                          Nenhuma história ou origem definida ainda.
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/30" onClick={() => setIsEditingOrigin(true)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar História
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sub-grid: Motivações & Complicações */}
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 w-full">
            {/* Card: Motivações */}
            <Card padding="sm" className="border-none shadow-md bg-white dark:bg-gray-900 w-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                  <User className="w-4 h-4 text-indigo-500" />
                  Motivações
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {isEditingMotivations ? (
                  <div className="space-y-3 w-full">
                    {motivations.map((m, idx) => (
                      <div key={idx} className="flex gap-2 w-full">
                        <Input
                          value={m}
                          onChange={(e) => {
                            const newM = [...motivations];
                            newM[idx] = e.target.value;
                            setMotivations(newM);
                          }}
                          placeholder="Escreva uma motivação..."
                          className="flex-1 min-w-0"
                        />
                        <Button variant="ghost" size="sm" className="h-10 w-10 !p-0 text-red-500 shrink-0" onClick={() => setMotivations(motivations.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setMotivations([...motivations, ''])}>
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Motivação
                    </Button>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-150 dark:border-gray-800/80">
                      <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveMotivations} loading={isProcessing}>
                        <Save className="w-4 h-4 mr-2" /> Salvar
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-red-550 dark:text-red-400" onClick={() => { setIsEditingMotivations(false); setMotivations([...character.narrative.motivations]); }}>
                        <X className="w-4 h-4 mr-2" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    {character.narrative.motivations.length > 0 ? (
                      <ul className="space-y-2 w-full">
                        {character.narrative.motivations.map((motivation, index) => (
                          <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 w-full min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words flex-1 min-w-0">{motivation}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-4 text-center">Nenhuma motivação definida.</p>
                    )}
                    <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/30" onClick={() => setIsEditingMotivations(true)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar Motivações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card: Complicações */}
            <Card padding="sm" className="border-none shadow-md bg-white dark:bg-gray-900 w-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Complicações
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {isEditingComplications ? (
                  <div className="space-y-3 w-full">
                    {complications.map((c, idx) => (
                      <div key={idx} className="flex gap-2 w-full">
                        <Input
                          value={c}
                          onChange={(e) => {
                            const newC = [...complications];
                            newC[idx] = e.target.value;
                            setComplications(newC);
                          }}
                          placeholder="Escreva uma complicação..."
                          className="flex-1 min-w-0"
                        />
                        <Button variant="ghost" size="sm" className="h-10 w-10 !p-0 text-red-500 shrink-0" onClick={() => setComplications(complications.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setComplications([...complications, ''])}>
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Complicação
                    </Button>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-150 dark:border-gray-800/80">
                      <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveComplications} loading={isProcessing}>
                        <Save className="w-4 h-4 mr-2" /> Salvar
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-red-550 dark:text-red-400" onClick={() => { setIsEditingComplications(false); setComplications([...character.narrative.complications]); }}>
                        <X className="w-4 h-4 mr-2" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    {character.narrative.complications.length > 0 ? (
                      <ul className="space-y-2 w-full">
                        {character.narrative.complications.map((complication, index) => (
                          <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 w-full min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words flex-1 min-w-0">{complication}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-4 text-center">Nenhuma complicação definida.</p>
                    )}
                    <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/30" onClick={() => setIsEditingComplications(true)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar Complicações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Card: Domínio Sagrado - Devoção */}
          {character.domainMasteries?.some(dm => dm.domainId === 'sagrado') && (
            <Card className="border-none shadow-md bg-white dark:bg-gray-900 w-full relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${character.narrative.deity?.isSealed ? 'bg-red-500' : 'bg-amber-500'}`} />
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Domínio Sagrado: Devoção
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={character.narrative.deity?.isSealed ? 'caos' : 'default'}
                    className={`text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 ${character.narrative.deity?.isSealed
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-emerald-500 text-white border-emerald-405'
                      }`}
                  >
                    {character.narrative.deity?.isSealed ? 'Espírito Selado' : 'Devoção Ativa'}
                  </Badge>
                  {!isEditingDeity && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSeal}
                      loading={isProcessing}
                      className={`text-xs px-2.5 py-1 h-7 border rounded ${character.narrative.deity?.isSealed
                        ? 'border-emerald-200 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:hover:bg-emerald-950/20'
                        : 'border-red-200 hover:bg-red-50 text-red-650 dark:border-red-900/30 dark:hover:bg-red-950/20'
                        }`}
                    >
                      {character.narrative.deity?.isSealed ? 'Restaurar Espírito' : 'Selar Espírito'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 w-full pt-2">
                {isEditingDeity ? (
                  <div className="space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nome da Divindade"
                        value={deityName}
                        onChange={(e) => setDeityName(e.target.value)}
                        placeholder="Ex: Solaris, Lunara, Ignis..."
                      />
                      <Input
                        label="Personalidade da Divindade"
                        value={deityPersonality}
                        onChange={(e) => setDeityPersonality(e.target.value)}
                        placeholder="Ex: Severa, Misericordiosa, Caótica..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Aspectos (2 a 4 recomendados)</label>
                      <div className="flex gap-2">
                        <Input
                          value={newAspect}
                          onChange={(e) => setNewAspect(e.target.value)}
                          placeholder="Adicionar aspecto (Ex: Fogo, Justiça...)"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newAspect.trim()) {
                                setDeityAspects([...deityAspects, newAspect.trim()]);
                                setNewAspect('');
                              }
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newAspect.trim()) {
                              setDeityAspects([...deityAspects, newAspect.trim()]);
                              setNewAspect('');
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {deityAspects.map((aspect, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 pl-2.5 pr-1.5 py-0.5 flex items-center gap-1.5"
                          >
                            {aspect}
                            <button
                              type="button"
                              onClick={() => setDeityAspects(deityAspects.filter((_, i) => i !== idx))}
                              className="hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Deveres</label>
                        <Textarea
                          value={deityPrecepts}
                          onChange={(e) => setDeityPrecepts(e.target.value)}
                          placeholder="Ações que os devotos devem cumprir..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Preceitos Menores</label>
                        <Textarea
                          value={deityMinorPrecepts}
                          onChange={(e) => setDeityMinorPrecepts(e.target.value)}
                          placeholder="Costumes, rituais ou práticas menores esperadas..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Proibições (Tabus)</label>
                        <Textarea
                          value={deityTaboos}
                          onChange={(e) => setDeityTaboos(e.target.value)}
                          placeholder="Comportamentos proibidos e tabus..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveDeity} loading={isProcessing}>
                        <Save className="w-4 h-4 mr-2" /> Salvar Devoção
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-500 hover:text-red-650"
                        onClick={() => {
                          setIsEditingDeity(false);
                          setDeityName(character.narrative.deity?.name || '');
                          setDeityAspects(character.narrative.deity?.aspects || []);
                          setDeityPrecepts(character.narrative.deity?.precepts || '');
                          setDeityMinorPrecepts(character.narrative.deity?.minorPrecepts || '');
                          setDeityTaboos(character.narrative.deity?.taboos || '');
                          setDeityPersonality(character.narrative.deity?.personality || '');
                          setDeityIsSealed(character.narrative.deity?.isSealed || false);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {character.narrative.deity?.name ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Divindade</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 break-all break-words">{character.narrative.deity.name}</span>
                          </div>
                          {character.narrative.deity.personality && (
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Personalidade</span>
                              <span className="font-bold text-gray-700 dark:text-gray-300 break-all break-words">{character.narrative.deity.personality}</span>
                            </div>
                          )}
                        </div>

                        {character.narrative.deity.aspects && character.narrative.deity.aspects.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Aspectos Cultuados</span>
                            <div className="flex flex-wrap gap-1.5">
                              {character.narrative.deity.aspects.map((a, idx) => (
                                <Badge key={idx} variant="default" className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 font-semibold text-xs rounded-full break-all break-words">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                          {character.narrative.deity.precepts && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/50 min-w-0">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">Deveres</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-all break-words">{character.narrative.deity.precepts}</p>
                            </div>
                          )}
                          {character.narrative.deity.minorPrecepts && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/50 min-w-0">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">Preceitos Menores</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-all break-words">{character.narrative.deity.minorPrecepts}</p>
                            </div>
                          )}
                          {character.narrative.deity.taboos && (
                            <div className="p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100/50 dark:border-red-950/20 min-w-0">
                              <span className="text-[10px] font-bold text-red-650 dark:text-red-400 uppercase tracking-widest block mb-1">Proibições & Tabus</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-all break-words">{character.narrative.deity.taboos}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic py-6 text-center">
                        Nenhuma divindade ou preceitos configurados ainda para o seu Domínio Sagrado.
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      onClick={() => setIsEditingDeity(true)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Configurar Divindade & Devoção
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card: Domínio Psíquico - Estado Psíquico */}
          {character.domainMasteries?.some(dm => dm.domainId === 'psiquico') && (
            <Card className="border-none shadow-md bg-white dark:bg-gray-900 w-full relative overflow-hidden mt-6">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-650" />
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-purple-600 animate-pulse" />
                  Domínio Psíquico: Estado Mental
                </CardTitle>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetStress}
                    loading={isProcessing}
                    className="text-xs px-2.5 py-1 h-7 border border-purple-200 hover:bg-purple-50 text-purple-600 dark:border-purple-900/30 dark:hover:bg-purple-950/20 rounded"
                  >
                    Realizar Descanso (Resetar Estresse)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 w-full pt-2">
                {(() => {
                  const stress = character.narrative.psychicState?.stress ?? 0;
                  const level = character.level ?? 1;
                  const penalties = getPsychicPenalties(stress, level);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="bg-purple-50/50 dark:bg-purple-950/10 p-3 rounded-xl border border-purple-100/40 dark:border-purple-900/20 text-center">
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider block mb-1">Estresse</span>
                          <span className="text-xl font-black text-purple-700 dark:text-purple-400">{stress}</span>
                        </div>
                        <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/40 dark:border-blue-900/20 text-center">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block mb-1">Nível</span>
                          <span className="text-xl font-black text-blue-700 dark:text-blue-400">{level}</span>
                        </div>
                        {(() => {
                          const excess = stress - level;
                          return (
                            <div className={`p-3 rounded-xl border text-center transition-all ${excess > 0
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-100 text-red-700 dark:text-red-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 text-emerald-700 dark:text-emerald-450'
                              }`}>
                              <span className="text-[9px] font-black uppercase tracking-wider block mb-1">Diferença</span>
                              <span className="text-xl font-black">{excess > 0 ? `+${excess}` : excess}</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium bg-gray-50 dark:bg-gray-800/20 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80">
                        <strong>Regra de Penalidades:</strong> As penalidades psíquicas são aplicadas com base na <strong>diferença</strong> (Estresse menos Nível). Sempre que o estresse ultrapassar o seu nível nos limites de +3, +5, +8 e +11, as penalidades correspondentes são ativadas.
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Efeitos e Penalidades Ativos</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${penalties.esmorecido
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-805 dark:text-amber-350 font-bold shadow-sm'
                            : 'bg-gray-50/50 border-gray-100 text-gray-450 dark:bg-gray-950/20 dark:border-gray-900/50'
                            }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${penalties.esmorecido ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div className="text-xs flex-1">
                              <span className="flex items-center justify-between font-extrabold">
                                <span>+3: Esmorecido</span>
                                <span className="text-[10px] font-mono opacity-80">
                                  {penalties.excess >= 3 ? 'ATIVO' : `${penalties.excess}/+3`}
                                </span>
                              </span>
                              <span className="text-[10px] font-medium opacity-80 block mt-0.5">O personagem sofre 2 desvantagens atributos mentais</span>
                            </div>
                          </div>

                          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${penalties.danoPsiquico
                            ? 'bg-red-500/10 border-red-500/20 text-red-805 dark:text-red-355 font-bold shadow-sm'
                            : 'bg-gray-50/50 border-gray-100 text-gray-450 dark:bg-gray-950/20 dark:border-gray-900/50'
                            }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${penalties.danoPsiquico ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div className="text-xs flex-1">
                              <span className="flex items-center justify-between font-extrabold">
                                <span>+5: Dano Psíquico</span>
                                <span className="text-[10px] font-mono opacity-80">
                                  {penalties.excess >= 5 ? 'ATIVO' : `${penalties.excess}/+5`}
                                </span>
                              </span>
                              <span className="text-[10px] font-medium opacity-80 block mt-0.5">Sofre 1d[PV Máx] a cada novo uso</span>
                            </div>
                          </div>

                          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${penalties.custoDuplicado
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-850 dark:text-orange-355 font-bold shadow-sm'
                            : 'bg-gray-50/50 border-gray-100 text-gray-450 dark:bg-gray-950/20 dark:border-gray-900/50'
                            }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${penalties.custoDuplicado ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div className="text-xs flex-1">
                              <span className="flex items-center justify-between font-extrabold">
                                <span>+8: Custo de PE Dobrado</span>
                                <span className="text-[10px] font-mono opacity-80">
                                  {penalties.excess >= 8 ? 'ATIVO' : `${penalties.excess}/+8`}
                                </span>
                              </span>
                              <span className="text-[10px] font-medium opacity-80 block mt-0.5">Habilidades psíquicas custam dobro de PE</span>
                            </div>
                          </div>

                          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${penalties.perdaEnergia
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-805 dark:text-rose-355 font-bold shadow-sm'
                            : 'bg-gray-50/50 border-gray-100 text-gray-450 dark:bg-gray-950/20 dark:border-gray-900/50'
                            }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${penalties.perdaEnergia ? 'bg-rose-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div className="text-xs flex-1">
                              <span className="flex items-center justify-between font-extrabold">
                                <span>+11: Perda de Energia</span>
                                <span className="text-[10px] font-mono opacity-80">
                                  {penalties.excess >= 11 ? 'ATIVO' : `${penalties.excess}/+11`}
                                </span>
                              </span>
                              <span className="text-[10px] font-medium opacity-80 block mt-0.5">Perde 1d[Energia Máx] a cada uso</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral - Princípio Espiritual */}
        <div className="lg:col-span-1 min-w-0">
          <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-hidden relative group w-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                Princípio Espiritual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 w-full">
              <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/20 w-full">
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-amber-700/60 dark:text-amber-400/60 uppercase tracking-tighter">Estágio Espiritual</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${character.spiritualPrinciple.stage === 'DIVINE'
                        ? 'bg-amber-500 text-white border-amber-400'
                        : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>
                        {character.spiritualPrinciple.stage === 'DIVINE' ? 'Divino' : 'Mortal'}
                      </span>
                      {!character.spiritualPrinciple.isUnlocked && (
                        <Badge variant="caos" className="text-[9px] px-2 py-0 h-5 flex items-center uppercase font-black tracking-tighter ring-1 ring-caos-500/20">Bloqueado</Badge>
                      )}
                    </div>
                  </div>

                  <div className="w-full">
                    {!character.spiritualPrinciple.isUnlocked ? (
                      <Button
                        size="sm"
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full shadow-md shadow-amber-500/20 transition-all active:scale-95"
                        onClick={handleAwaken}
                        loading={isProcessing}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Despertar
                      </Button>
                    ) : character.spiritualPrinciple.stage === 'NORMAL' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 w-full transition-all"
                        onClick={handleEvolve}
                        loading={isProcessing}
                      >
                        <Flag className="w-3.5 h-3.5" /> Evoluir (NV 35)
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-between w-full">
                <div className="space-y-1 min-w-[100px] flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rank Atual</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <p className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight break-words flex-1 min-w-0">{character.calamityRank}</p>
                  </div>
                </div>
                <div className="space-y-1 min-w-[100px] flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bônus Eficiência</p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">+{character.efficiencyBonus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
