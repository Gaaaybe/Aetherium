import { useState } from 'react';
import { Modal, ModalFooter } from '@/shared/ui/Modal';
import { Button, Input, Select, Textarea, toast } from '@/shared/ui';
import { ChevronRight, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import { isAxiosError } from 'axios';

interface CharactermancerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export function Charactermancer({ isOpen, onClose, onSuccess }: CharactermancerProps) {
  const { createCharacter } = useCharacters();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [origin, setOrigin] = useState('');
  const [motivationStr, setMotivationStr] = useState('');
  const [complicationStr, setComplicationStr] = useState('');
  const [art, setArt] = useState('');
  
  const [strength, setStrength] = useState<number>(10);
  const [dexterity, setDexterity] = useState<number>(10);
  const [constitution, setConstitution] = useState<number>(10);
  const [intelligence, setIntelligence] = useState<number>(10);
  const [wisdom, setWisdom] = useState<number>(10);
  const [charisma, setCharisma] = useState<number>(10);
  
  const [keyPhysical, setKeyPhysical] = useState<'strength' | 'dexterity' | 'constitution'>('strength');
  const [keyMental, setKeyMental] = useState<'intelligence' | 'wisdom' | 'charisma'>('wisdom');

  const [isUnlocked, setIsUnlocked] = useState(false);

  const totalAttributePoints = strength + dexterity + constitution + intelligence + wisdom + charisma;
  const initialPoints = 67; // Conforme a regra base do sistema
  const remainingPoints = initialPoints - totalAttributePoints;

  const resetForm = () => {
    setStep(1);
    setApiError(null);
    setName('');
    setIdentity('');
    setOrigin('');
    setMotivationStr('');
    setComplicationStr('');
    setArt('');
    setStrength(10);
    setDexterity(10);
    setConstitution(10);
    setIntelligence(10);
    setWisdom(10);
    setCharisma(10);
    setKeyPhysical('strength');
    setKeyMental('wisdom');
    setIsUnlocked(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = () => {
    if (!name || !origin) return false;
    
    const motivations = motivationStr.split(',').map(s => s.trim()).filter(Boolean);
    const complications = complicationStr.split(',').map(s => s.trim()).filter(Boolean);
    
    if (motivations.length + complications.length < 2) {
      setApiError('O personagem deve ter pelo menos duas entradas no total entre motivações e complicações.');
      return false;
    }
    
    setApiError(null);
    return true;
  };

  const validateStep2 = () => {
    if (remainingPoints < 0) {
      setApiError(`Você excedeu o limite de atributos em ${Math.abs(remainingPoints)} pontos.`);
      return false;
    }
    setApiError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        narrative: {
          name,
          identity,
          origin,
          motivations: motivationStr.split(',').map(s => s.trim()).filter(Boolean),
          complications: complicationStr.split(',').map(s => s.trim()).filter(Boolean),
        },
        attributes: {
          strength,
          dexterity,
          constitution,
          intelligence,
          wisdom,
          charisma,
          keyPhysical,
          keyMental,
        },
        spiritualPrinciple: {
          isUnlocked,
          stage: isUnlocked ? 'NORMAL' as const : undefined,
        },
        art: art || null,
      };

      const newChar = await createCharacter(payload);
      toast.success('Personagem criado com sucesso!');
      onSuccess(newChar.id);
      handleClose();
    } catch (err) {
      console.error(err);
      if (isAxiosError(err) && err.response?.status === 401) {
         setApiError('Sua sessão expirou. Faça login novamente.');
      } else if (isAxiosError(err) && err.response?.data?.message) {
         setApiError(err.response.data.message);
      } else {
         setApiError('Erro ao criar personagem. Verifique os dados.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Novo Personagem"
      size="lg"
    >
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center uppercase tracking-widest font-semibold">
          {step === 1 && 'Passo 1: Identidade e Origem'}
          {step === 2 && 'Passo 2: Atributos Base'}
          {step === 3 && 'Passo 3: Princípio Espiritual'}
        </p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
        </div>
      )}

      <div className="space-y-4 py-2 min-h-[300px]">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Input
              label="Nome do Personagem"
              placeholder="Ex: Arthur Morgan, Sir Galahad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Identidade (Arquétipo / Título)"
              placeholder="Ex: Detetive Paranormal, Foragido da Guilda"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
            <Input
              label="Origem (História Base)"
              placeholder="Ex: Nascido nas favelas de Kaelen..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Motivações (separadas por vírgula)"
                placeholder="Ex: Proteger os inocentes, Vingar sua família"
                value={motivationStr}
                onChange={(e) => setMotivationStr(e.target.value)}
                rows={2}
              />
              <Textarea
                label="Complicações (separadas por vírgula)"
                placeholder="Ex: Procurado pela guilda, Medo de fogo"
                value={complicationStr}
                onChange={(e) => setComplicationStr(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-xs text-gray-500 italic -mt-2">
              * O personagem deve ter pelo menos 2 registros na soma de motivações e complicações.
            </p>
            <Input
              label="URL da Arte (Avatar)"
              placeholder="https://imgur.com/seu-avatar.jpg"
              value={art}
              onChange={(e) => setArt(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 pr-4">
                  Distribua os valores dos seus 6 atributos principais. O sistema sugere que a soma total seja {initialPoints} para iniciantes.
                </p>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${remainingPoints === 0 ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' : remainingPoints < 0 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  Pontos Restantes: {remainingPoints}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">Físicos</h4>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Força</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={strength} onChange={(e) => setStrength(Number(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Destreza</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={dexterity} onChange={(e) => setDexterity(Number(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Constituição</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={constitution} onChange={(e) => setConstitution(Number(e.target.value) || 0)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">Mentais</h4>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Inteligência</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={intelligence} onChange={(e) => setIntelligence(Number(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sabedoria</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={wisdom} onChange={(e) => setWisdom(Number(e.target.value) || 0)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Carisma</label>
                    <input type="number" min="0" className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" value={charisma} onChange={(e) => setCharisma(Number(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Atributo Físico Chave"
                value={keyPhysical}
                onChange={(e) => setKeyPhysical(e.target.value as any)}
                options={[
                  { label: 'Força', value: 'strength' },
                  { label: 'Destreza', value: 'dexterity' },
                  { label: 'Constituição', value: 'constitution' },
                ]}
                helperText="Afeta resistências e bônus de dano base."
              />
              <Select
                label="Atributo Mental Chave"
                value={keyMental}
                onChange={(e) => setKeyMental(e.target.value as any)}
                options={[
                  { label: 'Inteligência', value: 'intelligence' },
                  { label: 'Sabedoria', value: 'wisdom' },
                  { label: 'Carisma', value: 'charisma' },
                ]}
                helperText="Afeta seus PE e limites de equipamento."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">O Despertar</h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm mb-4">
                Em <span className="font-semibold"><span className="text-espirito-500 dark:text-espirito-400">Espírito</span> <span className="text-caos-500 dark:text-caos-400">e Caos</span></span>, o Princípio Espiritual é o que separa mortais de seres extraordinários. Despertar seu princípio lhe dá acesso a magias, peculiaridades e acervos, mas consome 15 Pontos de Aprendizado (PdA) da sua reserva.
              </p>

              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-md cursor-pointer border-2 transition-all ${isUnlocked ? 'border-purple-500 bg-white dark:bg-gray-800' : 'border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
                  <input
                    type="radio"
                    name="spiritual_principle"
                    checked={isUnlocked}
                    onChange={() => setIsUnlocked(true)}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-gray-100">Personagem Desperto</span>
                    <span className="block text-sm text-gray-500">Nasce com poderes. Custa 15 PdA iniciais.</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-md cursor-pointer border-2 transition-all ${!isUnlocked ? 'border-gray-500 bg-white dark:bg-gray-800' : 'border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
                  <input
                    type="radio"
                    name="spiritual_principle"
                    checked={!isUnlocked}
                    onChange={() => setIsUnlocked(false)}
                    className="w-5 h-5 text-gray-600"
                  />
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-gray-100">Mortal Comum</span>
                    <span className="block text-sm text-gray-500">Sem magia inicialmente. Pode despertar durante a campanha.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => {
            setApiError(null);
            step > 1 ? setStep(step - 1) : handleClose();
          }}
        >
          {step > 1 ? (
            <><ChevronLeft className="w-4 h-4 mr-2" /> Voltar</>
          ) : (
            'Cancelar'
          )}
        </Button>
        
        {step < 3 ? (
          <Button
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              if (step === 2 && !validateStep2()) return;
              setStep(step + 1);
            }}
          >
            Próximo <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            loading={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" /> Criar Personagem
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
