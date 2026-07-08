import { CharacterResponse } from '@/services/characters.types';
import { Card, CardContent, Button, Badge, Modal, ModalFooter } from '@/shared/ui';
import { BENEFICIOS, BenefitCatalogEntry } from '@/data';
import { useState, useMemo } from 'react';
import { Star, Calculator, ShoppingBag, Sword, Search, Gift, Trash2, Info, ChevronDown } from 'lucide-react';
import {
  CRITICO_APRIMORADO_BASE_NAME,
  DOMINIOS_CRITICO_APRIMORADO,
} from '@/features/ficha-personagem/utils/benefitsHelper';

interface BeneficiosTabProps {
  character: CharacterResponse;
  onAcquireBenefit: (benefitName: string, targetDegree: number) => Promise<void>;
  onRemoveBenefit: (benefitId: string) => void;
}

export function BeneficiosTab({ character, onAcquireBenefit, onRemoveBenefit }: BeneficiosTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitCatalogEntry | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('arma-branca');
  const [catalogLimit, setCatalogLimit] = useState(6);

  const handleSelectBenefit = (cat: BenefitCatalogEntry, name?: string) => {
    setSelectedBenefit(cat);
    if (cat.nome === CRITICO_APRIMORADO_BASE_NAME && name) {
      const partes = name.split(' - ');
      if (partes.length >= 2) {
        setSelectedDomain(partes[1].trim().toLowerCase());
      }
    } else {
      setSelectedDomain('arma-branca');
    }
  };

  // Mapeia os benefícios adquiridos para o catálogo para pegar descrições
  const ownedBenefitsWithDetails = useMemo(() => {
    return character.benefits.map(b => {
      const catalogInfo = BENEFICIOS.find(cat =>
        cat.nome === b.name ||
        (b.name.startsWith(CRITICO_APRIMORADO_BASE_NAME) && cat.nome === CRITICO_APRIMORADO_BASE_NAME)
      );
      return { ...b, catalogInfo };
    });
  }, [character.benefits]);

  // Lista de benefícios disponíveis para compra
  const filteredCatalog = useMemo(() => {
    return BENEFICIOS.filter(b => {
      const matchesSearch = b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || b.tipo.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType]);

  const availableBenefits = filteredCatalog.slice(0, catalogLimit);
  const hasMore = filteredCatalog.length > catalogLimit;

  const pdaDisponivel = character.pda.available;
  const pdaGastoTotal = character.benefits.reduce((acc: number, b: any) => acc + b.pdaCost, 0);

  const calculateCost = (benefit: BenefitCatalogEntry, degree: number) => {
    const baseCost = benefit.custo_base ?? 3;
    if (benefit.regra_custo === 'dobro_por_grau') {
      return baseCost * (Math.pow(2, degree) - 1);
    }
    return baseCost * degree;
  };

  const domainSpecificInfo = useMemo(() => {
    if (!selectedBenefit || selectedBenefit.nome !== CRITICO_APRIMORADO_BASE_NAME) {
      return null;
    }
    const instancedName = `${CRITICO_APRIMORADO_BASE_NAME} - ${selectedDomain}`;
    const owned = character.benefits.find(b => b.name.toLowerCase() === instancedName.toLowerCase());
    const currentDegree = owned?.degree || 0;
    const nextDegree = currentDegree + 1;
    const cost = calculateCost(selectedBenefit, nextDegree) - (owned?.pdaCost || 0);
    const isAtMax = currentDegree >= 3;
    return {
      instancedName,
      owned,
      currentDegree,
      nextDegree,
      cost,
      isAtMax
    };
  }, [selectedBenefit, selectedDomain, character.benefits]);

  const handleShowMore = () => {
    setCatalogLimit(prev => prev + 6);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ─── Header de Status ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <Card className="col-span-1 md:col-span-2 border-none shadow-md bg-white dark:bg-gray-900 border-l-4 border-l-purple-600 overflow-hidden flex flex-col justify-center">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center justify-center sm:justify-start gap-2 uppercase tracking-tight">
                  <Gift className="w-5 h-5 text-purple-600" />
                  Meus Benefícios
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Acervo do Personagem</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-2.5 px-6 rounded-xl border border-gray-100 dark:border-gray-800 min-w-[100px] shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Qtd.</p>
                  <p className="text-lg font-black text-purple-600">{character.benefits.length}</p>
                </div>
                <div className="text-center bg-purple-50 dark:bg-purple-900/20 p-2.5 px-6 rounded-xl border border-purple-100 dark:border-purple-800 min-w-[100px] shadow-sm">
                  <p className="text-[9px] font-black text-purple-400 uppercase mb-0.5">PdA Gasto</p>
                  <p className="text-lg font-black text-purple-600">{pdaGastoTotal}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-indigo-600 text-white overflow-hidden relative group flex flex-col justify-center min-h-[120px]">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Calculator className="w-16 h-16" />
          </div>
          <CardContent className="p-6 relative z-10 text-center sm:text-left">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1 opacity-80">Saldo Evolução</p>
            <h3 className="text-2xl font-black flex items-baseline justify-center sm:justify-start gap-2">
              {pdaDisponivel}
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">PdA Livre</span>
            </h3>
            <div className="w-full h-1.5 bg-indigo-900/30 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${Math.min(100, (pdaDisponivel / (character.pda.total || 1)) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Benefícios Adquiridos (LISTA VERTICAL) ────────────────────────── */}
      <div className="flex flex-col gap-3">
        {ownedBenefitsWithDetails.length > 0 ? ownedBenefitsWithDetails.map((benefit) => (
          <Card key={benefit.id} className="group hover:border-purple-500/30 transition-all border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 shadow-sm hover:shadow-md overflow-hidden border-[1px]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border-[0.5px] transition-all cursor-pointer shadow-sm ${benefit.catalogInfo?.tipo === 'combate' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-500' :
                      benefit.catalogInfo?.tipo === 'perícia' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-500' :
                        'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-500'
                    }`}
                  onClick={() => benefit.catalogInfo && handleSelectBenefit(benefit.catalogInfo, benefit.name)}
                >
                  {benefit.catalogInfo?.tipo === 'combate' ? <Sword className="w-6 h-6" /> :
                    benefit.catalogInfo?.tipo === 'sorte' ? <Star className="w-6 h-6" /> :
                      <Gift className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <h4
                        className="text-sm font-black text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-purple-600 transition-colors uppercase tracking-tight"
                        onClick={() => benefit.catalogInfo && handleSelectBenefit(benefit.catalogInfo, benefit.name)}
                      >
                        {benefit.name}
                      </h4>
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold border-none text-[9px] px-2 py-0">
                        GRAU {benefit.degree}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => onRemoveBenefit(benefit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic font-medium flex-1">
                      {benefit.catalogInfo?.descricao || 'Habilidade especial adquirida.'}
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="default" className="text-[8px] uppercase font-black py-0 px-2 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/30">
                        {benefit.catalogInfo?.tipo || 'Geral'}
                      </Badge>
                      <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1 opacity-70">
                        <Calculator className="w-3 h-3" />
                        {benefit.pdaCost} PdA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <Gift className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 dark:text-gray-500 text-xs font-black uppercase tracking-widest">Nenhum benefício adquirido</p>
          </div>
        )}
      </div>

      {/* ─── Catálogo de Aquisição ────────────────────────────────────────── */}
      <div className="pt-12 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="text-center md:text-left">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center justify-center md:justify-start gap-2 uppercase tracking-tight">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              Catálogo de Benefícios
            </h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Evolua sua ficha</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-center">
            <div className="relative group flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-950 border-[2px] border-gray-100 dark:border-gray-800 rounded-lg text-xs focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCatalogLimit(6);
                }}
              />
            </div>
            <select
              className="bg-white dark:bg-gray-950 border-[2px] border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[9px] font-black uppercase outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCatalogLimit(6);
              }}
            >
              <option value="all">Todas as Categorias</option>
              <option value="combate">⛓️ Combate</option>
              <option value="perícia">🎯 Perícias</option>
              <option value="sorte">🍀 Sorte</option>
              <option value="geral">⚙️ Geral</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5 animate-in fade-in duration-500">
          {availableBenefits.map((cat) => {
            const isCriticoAprimorado = cat.nome === CRITICO_APRIMORADO_BASE_NAME;
            const owned = isCriticoAprimorado ? undefined : character.benefits.find(b => b.name === cat.nome);
            const currentDegree = owned?.degree || 0;
            const nextDegree = currentDegree + 1;
            const cost = isCriticoAprimorado ? 3 : (calculateCost(cat, nextDegree) - (owned?.pdaCost || 0));
            const canAfford = pdaDisponivel >= cost;
            const isAtMax = !isCriticoAprimorado && typeof cat.graus === 'number' && currentDegree >= cat.graus;

            return (
              <Card
                key={cat.nome}
                className={`group border-[1px] transition-all hover:shadow-lg flex flex-col min-h-[200px] rounded-2xl overflow-hidden cursor-pointer ${isAtMax ? 'opacity-70 bg-gray-50 dark:bg-gray-900/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  }`}
                onClick={() => handleSelectBenefit(cat)}
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="default" className="text-[7px] font-black uppercase tracking-widest px-2 py-0 bg-indigo-50/50 text-indigo-500 border-indigo-100 dark:border-indigo-900/30">
                      {cat.tipo}
                    </Badge>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Máx</span>
                      <span className="text-[10px] font-black text-gray-900 dark:text-gray-100">{cat.graus}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight uppercase tracking-tight">{cat.nome}</h4>
                    <div className="h-6 w-6 flex items-center justify-center text-gray-300 group-hover:text-indigo-500 transition-colors">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 mb-4 flex-1 italic font-medium line-clamp-2">
                    {cat.descricao}
                  </p>

                  <div className="mt-2 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Custo</span>
                      <span className={`text-base font-black ${canAfford ? 'text-indigo-600' : 'text-red-400'}`}>
                        {isAtMax ? '--' : cost}
                        <span className="text-[9px] ml-1 opacity-60">PdA</span>
                      </span>
                    </div>
                    {isAtMax ? (
                      <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-none font-bold text-[8px] uppercase px-2 py-0.5 rounded-lg">Adquirido</Badge>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford}
                        className={`font-black uppercase text-[9px] px-4 py-1.5 rounded-xl transition-all shadow-sm ${canAfford ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBenefit(cat);
                        }}
                      >
                        {isCriticoAprimorado ? 'Escolher Domínio' : currentDegree > 0 ? 'Evoluir' : 'Comprar'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="rounded-full px-5 py-2 text-xs border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 font-black text-[1px] tracking-[0.2em] gap-2 group transition-all"
              onClick={handleShowMore}
            >
              Mostrar mais benefícios
              <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </Button>
          </div>
        )}
      </div>

      {/* ─── Modal de Detalhes ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedBenefit}
        onClose={() => setSelectedBenefit(null)}
        title={selectedBenefit?.nome || 'Detalhes do Benefício'}
        size="lg"
      >
        {selectedBenefit && (
          <div className="py-1 space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 uppercase tracking-widest font-black py-1 text-[9px]">
                {selectedBenefit.tipo}
              </Badge>
              <Badge variant="default" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 font-black py-1 text-[9px] border-none uppercase">
                Graus: {selectedBenefit.graus}
              </Badge>
            </div>

            <div className="space-y-3">
              <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Descrição & Regra</h5>
              <div className="p-5 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900">
                <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed italic font-medium">
                  {selectedBenefit.descricao}
                </p>
              </div>
            </div>

            {selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME && (
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Escolha o Domínio de Armas</h5>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-xl px-4 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {DOMINIOS_CRITICO_APRIMORADO.map((d: { value: string; label: string }) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {domainSpecificInfo && domainSpecificInfo.currentDegree > 0 && (
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">
                    Grau atual neste domínio: {domainSpecificInfo.currentDegree} / 3
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/20 shadow-sm">
                <h6 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 opacity-80">Preço Unitário</h6>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-400">{selectedBenefit.custo_base || 3} PdA</p>
              </div>
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100/50 dark:border-purple-800/20 shadow-sm">
                <h6 className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1 opacity-80">Custo Total / Próximo Nível</h6>
                <p className="text-sm font-extrabold text-purple-700 dark:text-purple-400 uppercase">
                  {selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME 
                    ? (domainSpecificInfo?.isAtMax ? 'Máximo Atingido' : `${domainSpecificInfo?.cost || 3} PdA (Linear)`)
                    : (selectedBenefit.regra_custo === 'dobro_por_grau' ? 'Progressivo (Dobro/Grau)' : 'Linear')}
                </p>
              </div>
            </div>

            {selectedBenefit.requisitos && selectedBenefit.requisitos.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-red-500 uppercase tracking-widest">Requisitos</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedBenefit.requisitos.map((req, idx) => (
                    <Badge key={idx} variant="default" className="text-[9px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 px-2.5 py-0.5 font-black shadow-sm">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <ModalFooter className="gap-3">
          <Button
            variant="ghost"
            onClick={() => setSelectedBenefit(null)}
            className="font-black uppercase text-[10px] tracking-widest px-6"
          >
            Fechar
          </Button>
          <Button
            onClick={() => {
              if (selectedBenefit) {
                if (selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME) {
                  if (domainSpecificInfo) {
                    onAcquireBenefit(domainSpecificInfo.instancedName, domainSpecificInfo.nextDegree);
                  }
                } else {
                  const owned = character.benefits.find(b => b.name === selectedBenefit.nome);
                  onAcquireBenefit(selectedBenefit.nome, (owned?.degree || 0) + 1);
                }
                setSelectedBenefit(null);
              }
            }}
            disabled={(() => {
              if (!selectedBenefit) return true;
              if (selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME) {
                if (!domainSpecificInfo) return true;
                return pdaDisponivel < domainSpecificInfo.cost || domainSpecificInfo.isAtMax;
              }
              const owned = character.benefits.find(b => b.name === selectedBenefit.nome);
              const currentDegree = owned?.degree || 0;
              const nextDegree = currentDegree + 1;
              const cost = calculateCost(selectedBenefit, nextDegree) - (owned?.pdaCost || 0);
              const isAtMax = typeof selectedBenefit.graus === 'number' && currentDegree >= selectedBenefit.graus;
              return pdaDisponivel < cost || isAtMax;
            })()}
            className={`font-black uppercase text-[10px] tracking-widest px-8 rounded-xl shadow-lg transition-all ${
              (() => {
                if (!selectedBenefit) return 'bg-gray-100 text-gray-400';
                if (selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME) {
                  if (domainSpecificInfo?.isAtMax) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-none border border-emerald-100 dark:border-emerald-900/30 cursor-default';
                  return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/15';
                }
                const owned = character.benefits.find(b => b.name === selectedBenefit.nome);
                const isAtMax = typeof selectedBenefit.graus === 'number' && (owned?.degree || 0) >= selectedBenefit.graus;
                if (isAtMax) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-none border border-emerald-100 dark:border-emerald-900/30 cursor-default';
                return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/15';
              })()
            }`}
          >
            {(() => {
              if (!selectedBenefit) return 'Adquirir';
              if (selectedBenefit.nome === CRITICO_APRIMORADO_BASE_NAME) {
                if (domainSpecificInfo?.isAtMax) return 'Máximo Atingido';
                if (domainSpecificInfo && domainSpecificInfo.currentDegree > 0) return `Evoluir (Grau ${domainSpecificInfo.currentDegree + 1})`;
                return 'Adquirir Benefício';
              }
              const owned = character.benefits.find(b => b.name === selectedBenefit.nome);
              const currentDegree = owned?.degree || 0;
              const isAtMax = typeof selectedBenefit.graus === 'number' && currentDegree >= selectedBenefit.graus;
              
              if (isAtMax) return 'Máximo Atingido';
              if (currentDegree > 0) return `Evoluir (Grau ${currentDegree + 1})`;
              return 'Adquirir Benefício';
            })()}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
