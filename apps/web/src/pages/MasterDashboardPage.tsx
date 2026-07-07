import { useState } from 'react';
import { User, Trash2, ShieldAlert, Sparkles, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Badge, ConfirmDialog } from '@/shared/ui';
import { useAdminCharacters } from '../features/ficha-personagem/hooks/useAdminCharacters';
import { CroppedImage } from '../features/ficha-personagem/components/dashboard/CharacterHeader';

export function MasterDashboardPage() {
  const { characters, isLoading, error, deleteCharacter } = useAdminCharacters();
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const navigate = useNavigate();



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 px-4 py-8">
        <EmptyState
          icon={<ShieldAlert className="w-16 h-16 text-red-500" />}
          title="Acesso Restrito"
          description={error}
          action={{
            label: 'Voltar ao Início',
            onClick: () => navigate('/'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-400 dark:to-orange-400">
            Painel do Mestre
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visão onisciente de todas as fichas ativas no servidor
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
           <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 h-8">
              Admin Mode
           </Badge>
        </div>
      </div>

      {characters.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="w-16 h-16 text-gray-400" />}
          title="Nenhum personagem no servidor"
          description="Ainda não existem personagens criados por jogadores."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card 
              key={character.id} 
              className="group relative h-96 flex flex-col overflow-hidden rounded-2xl border-0 ring-1 ring-red-500/20 cursor-pointer hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300"
              onClick={() => navigate(`/personagens/${character.id}`)}
            >
              {/* Arte de Fundo com Zoom */}
              <div className="absolute inset-0 z-0 bg-black">
                {character.art ? (
                  <CroppedImage 
                    src={character.art} 
                    alt={character.narrative.name || character.narrative.identity} 
                    className="w-full h-full opacity-60 dark:opacity-80 group-hover:opacity-75 transition-all duration-700" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center">
                    <User className="w-24 h-24 text-white/5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent z-10" />
              </div>

              {/* Botões de Ação de Admin */}
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-sm border border-white/10 shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                  title="Apagar Ficha (Admin)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCharacterToDelete(character.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Informações Principais */}
              <div className="relative z-20 mt-auto p-5 md:p-6 flex flex-col justify-end">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-red-500/20 hover:bg-red-500/30 text-rose-200 border-red-500/30 backdrop-blur-md text-[10px] px-2 py-0">
                    ID: {character.id.split('-')[0]}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-[10px] px-2 py-0">
                    Nível {character.level}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/30 backdrop-blur-md text-[10px] px-2 py-0">
                    {character.spiritualPrinciple.stage === 'DIVINE' ? 'Divino' : 'Mortal'}
                  </Badge>
                </div>
                
                <h3 className="font-extrabold text-2xl md:text-3xl text-white tracking-tight line-clamp-1 drop-shadow-md mb-1">
                  {character.narrative.name || character.narrative.identity || "Personagem sem Nome"}
                </h3>
                <div className="text-sm text-gray-300 font-medium mb-4 drop-shadow-sm flex items-center gap-1.5 line-clamp-1">
                   <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                   {character.narrative.identity || "Sem Identidade"}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-red-950/60 border border-red-500/30 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">PV</span>
                    <span className="text-sm font-black text-rose-100">
                      {character.health.currentPV} <span className="opacity-50 font-medium text-xs">/ {character.health.maxPV}</span>
                    </span>
                  </div>
                  <div className="flex-1 bg-blue-950/60 border border-blue-500/30 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">PE</span>
                    <span className="text-sm font-black text-cyan-100">
                      {character.energy.currentPE} <span className="opacity-50 font-medium text-xs">/ {character.energy.maxPE}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                    Atualizado há pouco
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                     <Sparkles className="w-3 h-3 shrink-0" />
                     {character.pda.total} PdA
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!characterToDelete}
        onClose={() => setCharacterToDelete(null)}
        title="Exclusão de Nível Mestre"
        message="Como Mestre, você está prestes a excluir a ficha de um jogador. Esta ação é irreversível e causará a perda total dos dados dessa ficha. Continuar?"
        confirmText="Excluir Definitivamente"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (characterToDelete) {
            await deleteCharacter(characterToDelete);
            setCharacterToDelete(null);
          }
        }}
      />
    </div>
  );
}
