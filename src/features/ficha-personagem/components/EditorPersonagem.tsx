/**
 * Editor Principal de Personagem
 * Componente com abas para editar todas as partes do personagem
 */

import { useState, useEffect } from 'react';
import { usePersonagemCalculator } from '../hooks/usePersonagemCalculator';
import { useBibliotecaPersonagens } from '../hooks/useBibliotecaPersonagens';
import { usePersonagemPoderes } from '../hooks/usePersonagemPoderes';
import type { SkillName } from '../types';
import type { Poder } from '../../criador-de-poder/types';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { AtributosEditor } from './AtributosEditor';
import { VitaisPanel } from './VitaisPanel';
import { PericiasList } from './PericiasList';
import { OrcamentoPdA } from './OrcamentoPdA';
import { ListaPoderes } from './ListaPoderes';
import { BibliotecaPoderesModal } from '../../gerenciador-criaturas/components/BibliotecaPoderesModal';
import type { Personagem } from '../types';

interface EditorPersonagemProps {
  personagemId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

type TabId = 'info' | 'atributos' | 'pericias' | 'vitais' | 'poderes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Informações' },
  { id: 'atributos', label: 'Atributos' },
  { id: 'pericias', label: 'Perícias' },
  { id: 'vitais', label: 'Vitais' },
  { id: 'poderes', label: 'Poderes' },
];

export function EditorPersonagem({ personagemId: _personagemId, onSave: _onSave, onCancel }: EditorPersonagemProps) {
  const { personagem, calculado, setPersonagem, atualizarAtributo, atualizarPericia, obterBonusPericia } =
    usePersonagemCalculator();
  const { salvarPersonagem, buscarPersonagem } = useBibliotecaPersonagens();
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [modalBibliotecaAberto, setModalBibliotecaAberto] = useState(false);

  // Hook de gerenciamento de poderes
  const {
    vincularPoder,
    desvincularPoder,
    togglePoderAtivo,
  } = usePersonagemPoderes({
    poderes: personagem.poderes,
    onPoderChange: (poderes) => setPersonagem({ ...personagem, poderes }),
  });

  // Carregar personagem quando personagemId muda
  useEffect(() => {
    if (_personagemId) {
      const personagemCarregado = buscarPersonagem(_personagemId);
      if (personagemCarregado) {
        setPersonagem(personagemCarregado);
      }
    }
  }, [_personagemId, buscarPersonagem, setPersonagem]);

  const handleSave = async () => {
    setSalvando(true);
    try {
      console.log('Salvando personagem:', personagem);
      const resultado = salvarPersonagem(personagem);
      console.log('Personagem salvo com sucesso:', resultado);
      await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para feedback visual
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
    setSalvando(false);
    // Não chama onSave para não voltar à biblioteca
  };

  const updateHeader = (updates: Partial<Personagem['header']>) => {
    setPersonagem({ ...personagem, header: { ...personagem.header, ...updates } });
  };

  const updateVitals = (updates: Partial<Personagem['vitals']>) => {
    setPersonagem({ ...personagem, vitals: { ...personagem.vitals, ...updates } });
  };

  // Handlers para poderes
  const handleSelecionarPoder = (poder: Poder) => {
    vincularPoder(poder);
    setModalBibliotecaAberto(false);
  };

  return (
    <div className="space-y-4">
      {/* Header com nome e ações */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={personagem.header.name}
              onChange={(e) => updateHeader({ name: e.target.value })}
              placeholder="Nome do Personagem"
              className="text-2xl font-bold"
            />
          </div>

          <div className="flex gap-2">
            <Badge variant="info">Nível {personagem.header.level}</Badge>
            <Badge variant="secondary">{calculado.calamityRank}</Badge>
            <Badge variant={calculado.pdaDisponiveis >= 0 ? 'success' : 'warning'}>
              PdA: {calculado.pdaTotal - calculado.pdaUsados}/{calculado.pdaTotal}
            </Badge>
          </div>

          <Button onClick={handleSave} variant="primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="secondary">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="min-h-96">
        {/* Tab: Informações */}
        {activeTab === 'info' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Informações Básicas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Identidade</label>
                  <Input
                    value={personagem.header.identity}
                    onChange={(e) => updateHeader({ identity: e.target.value })}
                    placeholder="Ex: Cavaleiro sem Rainha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Origem</label>
                  <Input
                    value={personagem.header.origin}
                    onChange={(e) => updateHeader({ origin: e.target.value })}
                    placeholder="Ex: Reino de Avalon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Nível</label>
                  <Input
                    type="number"
                    value={personagem.header.level}
                    onChange={(e) => updateHeader({ level: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={250}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Rank de Calamidade</label>
                  <Input value={calculado.calamityRank} disabled className="bg-gray-100" />
                  <p className="text-xs text-gray-500 mt-1">Calculado automaticamente pelo nível</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">PdA Extras</label>
                  <Input
                    type="number"
                    value={personagem.pdaExtras}
                    onChange={(e) => setPersonagem({ ...personagem, pdaExtras: parseInt(e.target.value) || 0 })}
                    min={0}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">PdA Total: {calculado.pdaTotal} (base + extras)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Atributo Chave Mental
                  </label>
                  <Select
                    value={personagem.header.keyAttributeMental}
                    onChange={(e) =>
                      updateHeader({
                        keyAttributeMental: e.target.value as
                          | 'Inteligência'
                          | 'Sabedoria'
                          | 'Carisma',
                      })
                    }
                    options={['Inteligência', 'Sabedoria', 'Carisma']}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Atributo Chave Físico
                  </label>
                  <Select
                    value={personagem.header.keyAttributePhysical}
                    onChange={(e) =>
                      updateHeader({
                        keyAttributePhysical: e.target.value as
                          | 'Força'
                          | 'Destreza'
                          | 'Constituição',
                      })
                    }
                    options={['Força', 'Destreza', 'Constituição']}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Inspiração</label>
                  <Input
                    type="number"
                    value={personagem.header.inspiration}
                    onChange={(e) => updateHeader({ inspiration: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Runics</label>
                  <Input
                    type="number"
                    value={personagem.header.runics}
                    onChange={(e) => updateHeader({ runics: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Deslocamento (metros)</label>
                  <Input
                    type="number"
                    value={personagem.deslocamento || 9}
                    onChange={(e) => setPersonagem({ ...personagem, deslocamento: parseInt(e.target.value) || 9 })}
                    min={0}
                    placeholder="9"
                  />
                </div>
              </div>

              {/* Resistências e Imunidades */}
              <div>
                <label className="block text-sm font-semibold mb-1">Resistências e Imunidades</label>
                <Input
                  type="text"
                  value={personagem.header.resistancesImmunities}
                  onChange={(e) => updateHeader({ resistancesImmunities: e.target.value })}
                  placeholder="Ex: Resistência a Fogo, Imunidade a Veneno, Condicionado..."
                />
              </div>

              {/* Stats Calculados */}
              <div className="pt-4 border-t">
                <h4 className="font-bold mb-3">Estatísticas Calculadas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">CD Mental</p>
                    <p className="text-xl font-bold">{calculado.cdMental}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">CD Físico</p>
                    <p className="text-xl font-bold">{calculado.cdPhysical}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">PV Máximo</p>
                    <p className="text-xl font-bold">{calculado.pvMax}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">PE Máximo</p>
                    <p className="text-xl font-bold">{calculado.peMax}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Deslocamento</p>
                    <p className="text-xl font-bold">{calculado.deslocamento}m</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Bônus Eficiência</p>
                    <p className="text-xl font-bold">+{calculado.bonusEficiencia}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">RD Bloqueio</p>
                    <p className="text-xl font-bold">{calculado.rdBloqueio}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Pontos Atributo</p>
                    <p className="text-xl font-bold">{calculado.pontosAtributoDisponiveis}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab: Atributos */}
        {activeTab === 'atributos' && (
          <AtributosEditor
            attributes={personagem.attributes}
            modificadores={calculado.modificadores}
            pontosDisponiveis={calculado.pontosAtributoDisponiveis}
            onChangeAtributo={atualizarAtributo}
          />
        )}

        {/* Tab: Perícias */}
        {activeTab === 'pericias' && (
          <PericiasList
            skills={personagem.skills}
            modificadores={calculado.modificadores}
            bonusEficiencia={calculado.bonusEficiencia}
            keyAttributePhysical={personagem.header.keyAttributePhysical}
            keyAttributeMental={personagem.header.keyAttributeMental}
            onUpdateSkill={(skillId, updates) => {
              const currentSkill = personagem.skills[skillId];
              atualizarPericia(skillId as SkillName, { ...currentSkill, ...updates });
            }}
            calcularBonusPericia={(skillId) => obterBonusPericia(skillId as SkillName)}
          />
        )}

        {/* Tab: Vitais */}
        {activeTab === 'vitais' && (
          <VitaisPanel
            vitals={personagem.vitals}
            pvMax={calculado.pvMax}
            peMax={calculado.peMax}
            onUpdatePV={(current, temp) =>
              updateVitals({
                pv: { ...personagem.vitals.pv, current, temp: temp || 0 },
              })
            }
            onUpdatePE={(current, temp) =>
              updateVitals({
                pe: { ...personagem.vitals.pe, current, temp: temp || 0 },
              })
            }
            onUpdateDeathCounters={(count) => updateVitals({ deathCounters: count })}
          />
        )}

        {/* Tab: Poderes */}
        {activeTab === 'poderes' && (
          <div className="space-y-4">
            <OrcamentoPdA
              pdaTotal={calculado.pdaTotal}
              pdaUsado={calculado.pdaUsados}
              espacosTotal={calculado.espacosDisponiveis}
              espacosUsado={calculado.espacosUsados}
            />
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Poderes do Personagem</h3>
                <Button onClick={() => setModalBibliotecaAberto(true)}>
                  + Adicionar Poder
                </Button>
              </div>

              <ListaPoderes
                poderes={personagem.poderes}
                onAlternarAtivo={togglePoderAtivo}
                onRemover={desvincularPoder}
              />
            </Card>
          </div>
        )}
      </div>

      {/* Modal Biblioteca de Poderes */}
      <BibliotecaPoderesModal
        isOpen={modalBibliotecaAberto}
        onClose={() => setModalBibliotecaAberto(false)}
        onSelectPoder={handleSelecionarPoder}
      />
    </div>
  );
}
