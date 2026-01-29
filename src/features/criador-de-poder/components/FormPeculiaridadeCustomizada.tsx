import { useState, useMemo, useId } from 'react';
import { Modal, ModalFooter, Button, Input, Textarea, InlineHelp } from '../../../shared/ui';
import { Sparkles } from 'lucide-react';
import type { Peculiaridade } from '../../../shared/hooks/useCustomItems';

interface FormPeculiaridadeCustomizadaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (peculiaridade: Omit<Peculiaridade, 'dataCriacao' | 'dataModificacao'>) => void;
  peculiaridadeInicial?: Peculiaridade;
}

export function FormPeculiaridadeCustomizada({
  isOpen,
  onClose,
  onSubmit,
  peculiaridadeInicial,
}: FormPeculiaridadeCustomizadaProps) {
  const reactId = useId();
  const [nome, setNome] = useState(peculiaridadeInicial?.nome || '');
  const [espiritual, setEspiritual] = useState(peculiaridadeInicial?.espiritual || false);
  const [descricaoCurta, setDescricaoCurta] = useState(peculiaridadeInicial?.descricaoCurta || '');
  const [oQueE, setOQueE] = useState(peculiaridadeInicial?.fundamento.oQueE || '');
  const [comoFunciona, setComoFunciona] = useState(peculiaridadeInicial?.fundamento.comoFunciona || '');
  const [regrasInternas, setRegrasInternas] = useState(peculiaridadeInicial?.fundamento.regrasInternas || '');
  const [requerimentos, setRequerimentos] = useState(peculiaridadeInicial?.fundamento.requerimentos || '');

  // Gera ID estável - usa peculiaridadeInicial.id se editando, caso contrário usa reactId
  const peculiaridadeId = useMemo(
    () => peculiaridadeInicial?.id || `peculiar-${reactId}`,
    [peculiaridadeInicial?.id, reactId]
  );

  const handleSubmit = () => {
    if (!nome || !oQueE || !comoFunciona || !regrasInternas || !requerimentos) {
      return;
    }

    const peculiaridade: Omit<Peculiaridade, 'dataCriacao' | 'dataModificacao'> = {
      id: peculiaridadeId,
      nome,
      espiritual,
      descricaoCurta,
      fundamento: {
        oQueE,
        comoFunciona,
        regrasInternas,
        requerimentos,
      },
    };

    onSubmit(peculiaridade);
    handleClose();
  };

  const handleClose = () => {
    setNome('');
    setEspiritual(false);
    setDescricaoCurta('');
    setOQueE('');
    setComoFunciona('');
    setRegrasInternas('');
    setRequerimentos('');
    onClose();
  };

  const isValid = nome && oQueE && comoFunciona && regrasInternas && requerimentos;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={peculiaridadeInicial ? 'Editar Peculiaridade' : 'Nova Peculiaridade'}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase">Fundamento Conceitual</span>
        </div>
        
        <InlineHelp
          type="info"
          text="Descreva o fundamento conceitual. Não descreva poderes específicos, mas sim o núcleo do 'como' e 'porquê' ela existe."
          dismissible={false}
          storageKey="peculiar-form-info"
        />

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome da Peculiaridade *
          </label>
          <Input
            value={nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNome(e.target.value)}
            placeholder="Ex: Poderes Lunares, Controle Temporal..."
          />
        </div>

        {/* Descrição Curta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição Curta (opcional)
          </label>
          <Input
            value={descricaoCurta}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescricaoCurta(e.target.value)}
            placeholder="Resumo em uma linha..."
          />
        </div>

        {/* É Espiritual */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="espiritual-form"
            checked={espiritual}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEspiritual(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="espiritual-form" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Esta peculiaridade é de natureza espiritual
          </label>
        </div>

        {/* Fundamento */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            Fundamento Obrigatório *
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              O que é? *
            </label>
            <Textarea
              value={oQueE}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOQueE(e.target.value)}
              placeholder="Descreva a essência e natureza desta peculiaridade..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Como funciona? *
            </label>
            <Textarea
              value={comoFunciona}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComoFunciona(e.target.value)}
              placeholder="Explique os mecanismos e processos internos..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quais são suas regras internas? *
            </label>
            <Textarea
              value={regrasInternas}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRegrasInternas(e.target.value)}
              placeholder="Defina as regras, limites e restrições..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quais são seus requerimentos? *
            </label>
            <Textarea
              value={requerimentos}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequerimentos(e.target.value)}
              placeholder="Liste pré-requisitos, condições e necessidades..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          {peculiaridadeInicial ? 'Salvar Alterações' : 'Criar Peculiaridade'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
