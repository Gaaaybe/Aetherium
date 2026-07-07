import { ReactNode } from 'react';
import { CONDICOES } from '@/data';
import { Tooltip } from '@/shared/ui';

// Constrói regex para as condições
const conditionNames = CONDICOES.map(c => c.nome);
const sortedNames = [...conditionNames].sort((a, b) => b.length - a.length);
const regexPattern = new RegExp(`\\b(${sortedNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

/**
 * Analisa a descrição da condição e envolve menções de outras condições em Tooltips hoveráveis.
 */
export function renderDescriptionWithTooltips(
  desc: string,
  excludeName?: string,
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'
): ReactNode {
  if (!desc) return '';

  const parts = desc.split(regexPattern);
  if (parts.length === 1) return desc;

  return (
    <>
      {parts.map((part, index) => {
        const foundCond = CONDICOES.find(
          (c) => c.nome.toLowerCase() === part.toLowerCase()
        );
        const isSelfReference = excludeName && part.toLowerCase() === excludeName.toLowerCase();

        if (foundCond && !isSelfReference) {
          return (
            <Tooltip
              key={index}
              position={position}
              content={
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold uppercase text-[10px] text-white">
                      {foundCond.nome}
                    </span>
                    <span className="text-[9px] px-1 bg-gray-700 rounded text-gray-300 font-extrabold uppercase">
                      {foundCond.patamar}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-200 font-medium leading-relaxed italic">
                    {foundCond.descricao}
                  </p>
                </div>
              }
            >
              <span className="underline decoration-dotted decoration-indigo-400 dark:decoration-indigo-500 font-black cursor-help text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-0.5">
                {part}
              </span>
            </Tooltip>
          );
        }
        return part;
      })}
    </>
  );
}
