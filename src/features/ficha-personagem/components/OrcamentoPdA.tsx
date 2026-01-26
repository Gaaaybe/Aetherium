/**
 * Display de Orçamento de PdA e Espaços
 * Mostra total, usado e disponível com avisos visuais
 */

import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';

interface OrcamentoPdAProps {
  // PdA
  pdaTotal: number;
  pdaUsado: number;
  
  // Espaços
  espacosTotal: number;
  espacosUsado: number;
}

export function OrcamentoPdA({
  pdaTotal,
  pdaUsado,
  espacosTotal,
  espacosUsado,
}: OrcamentoPdAProps) {
  const pdaDisponivel = pdaTotal - pdaUsado;
  const espacosDisponivel = espacosTotal - espacosUsado;
  
  const pdaExcedido = pdaUsado > pdaTotal;
  const espacosExcedido = espacosUsado > espacosTotal;
  
  const pdaProximoLimite = pdaUsado / pdaTotal > 0.8;
  const espacosProximoLimite = espacosUsado / espacosTotal > 0.8;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold mb-4">Orçamento de Recursos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PdA */}
        <div className={`p-4 rounded-lg border-2 ${
          pdaExcedido
            ? 'bg-red-50 border-red-500'
            : pdaProximoLimite
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-green-50 border-green-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold">Pontos de Ataque (PdA)</h4>
            {pdaExcedido && (
              <Badge variant="warning" size="sm">Excedido!</Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Total:</span>
              <span className="font-bold">{pdaTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Usado:</span>
              <span className={`font-bold ${pdaExcedido ? 'text-red-600' : ''}`}>
                {pdaUsado}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span className="text-gray-700">Disponível:</span>
              <span className={`font-bold text-lg ${
                pdaExcedido
                  ? 'text-red-600'
                  : pdaProximoLimite
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {pdaDisponivel}
              </span>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                pdaExcedido
                  ? 'bg-red-500'
                  : pdaProximoLimite
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (pdaUsado / pdaTotal) * 100)}%` }}
            />
          </div>
          
          {pdaExcedido && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Você excedeu o orçamento de PdA!
            </p>
          )}
        </div>

        {/* Espaços */}
        <div className={`p-4 rounded-lg border-2 ${
          espacosExcedido
            ? 'bg-red-50 border-red-500'
            : espacosProximoLimite
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold">Espaços</h4>
            {espacosExcedido && (
              <Badge variant="warning" size="sm">Excedido!</Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Total:</span>
              <span className="font-bold">{espacosTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Usado (ativos):</span>
              <span className={`font-bold ${espacosExcedido ? 'text-red-600' : ''}`}>
                {espacosUsado}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span className="text-gray-700">Disponível:</span>
              <span className={`font-bold text-lg ${
                espacosExcedido
                  ? 'text-red-600'
                  : espacosProximoLimite
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}>
                {espacosDisponivel}
              </span>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                espacosExcedido
                  ? 'bg-red-500'
                  : espacosProximoLimite
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (espacosUsado / espacosTotal) * 100)}%` }}
            />
          </div>
          
          {espacosExcedido && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Você excedeu o limite de espaços!
            </p>
          )}
          
          <p className="text-xs text-gray-600 mt-2">
            💡 Apenas poderes ativos consomem espaços
          </p>
        </div>
      </div>
      
      {/* Avisos gerais */}
      {(pdaExcedido || espacosExcedido) && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          <strong>⚠️ Atenção:</strong> Seu personagem excedeu os recursos disponíveis.
          Desative ou remova poderes para voltar aos limites permitidos.
        </div>
      )}
    </Card>
  );
}
