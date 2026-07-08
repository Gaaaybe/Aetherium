import { useState } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge } from '@/shared/ui';
import { BookOpen, User, MapPin, Flag, Edit2, Save, X, Plus, Trash2, Zap, Sparkles } from 'lucide-react';
import { charactersService } from '@/services/characters.service';
import { toast } from '@/shared/ui/Toast';

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

  const handleSaveProfile = async () => {
    setIsProcessing(true);
    try {
      await _onSync({
        narrative: {
          ...character.narrative,
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
          ...character.narrative,
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
          ...character.narrative,
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
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-red-500 shrink-0" onClick={() => setMotivations(motivations.filter((_, i) => i !== idx))}>
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
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-red-500 shrink-0" onClick={() => setComplications(complications.filter((_, i) => i !== idx))}>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                        character.spiritualPrinciple.stage === 'DIVINE' 
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
