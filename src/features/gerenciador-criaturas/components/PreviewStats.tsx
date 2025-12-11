import { Heart, Zap, Shield, Swords, Target, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, Badge } from '../../../shared/ui';
import type { CalculatedStats, BossMechanics, CreatureStatsV2 } from '../types';

interface PreviewStatsProps {
  stats: CalculatedStats | null;
  statsV2?: CreatureStatsV2 | null;
  bossMechanics?: BossMechanics;
  loading?: boolean;
}

/**
 * PreviewStats
 * 
 * Mostra preview em tempo real dos stats calculados de uma criatura.
 * Exibe valores base, multiplicadores aplicados e valores finais.
 */
export function PreviewStats({ stats, statsV2, bossMechanics, loading = false }: PreviewStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espirito-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm">Selecione nível e função para ver os stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Principais */}
      <Card className="border-l-4 border-l-espirito-500">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Stats Principais</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* HP */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">PV</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.maxHp}
              </p>
              {stats.baseValues.hpBase !== stats.maxHp && (
                <p className="text-xs text-gray-500 mt-1">
                  Base: {stats.baseValues.hpBase} × {stats.appliedMultipliers.pvMultiplier}
                </p>
              )}
            </div>

            {/* PE */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">PE</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.maxPe}
              </p>
              {stats.baseValues.peBase !== stats.maxPe && (
                <p className="text-xs text-gray-500 mt-1">
                  Base: {stats.baseValues.peBase} × {stats.appliedMultipliers.peMultiplier}
                </p>
              )}
            </div>

            {/* Dano */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <Swords className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Dano</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.damage}
              </p>
              {stats.baseValues.damageBase !== stats.damage && (
                <p className="text-xs text-gray-500 mt-1">
                  Base: {stats.baseValues.damageBase} × {stats.appliedMultipliers.damageMultiplier}
                </p>
              )}
            </div>

            {/* Ataque */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Ataque</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                +{stats.attackBonus}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bônus de Ataque
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Secundários */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Stats Secundários</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatItem 
              icon={<Shield className="w-4 h-4" />}
              label="RD"
              value={stats.rd}
              color="green"
            />
            <StatItem 
              icon={<TrendingUp className="w-4 h-4" />}
              label="Deslocamento"
              value={`${stats.speed}m`}
              color="cyan"
            />
            <StatItem 
              icon={<Zap className="w-4 h-4" />}
              label="Unid. Esforço"
              value={stats.effortUnit}
              color="yellow"
            />
            <StatItem 
              icon={<Target className="w-4 h-4" />}
              label="CD Efeitos"
              value={stats.cdEffect}
              color="pink"
            />
            <StatItem 
              icon={<TrendingUp className="w-4 h-4" />}
              label="Perícia Chave"
              value={`+${stats.keySkill}`}
              color="indigo"
            />
            <StatItem 
              icon={<Shield className="w-4 h-4" />}
              label="Eficiência"
              value={`+${stats.efficiency}`}
              color="emerald"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resistências */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Resistências</h3>
          
          {statsV2 ? (
            // V2: Mostrar resistências individuais
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Fortitude</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {statsV2.saves.Fortitude > 0 ? '+' : ''}{statsV2.saves.Fortitude}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Reflexos</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {statsV2.saves.Reflexos > 0 ? '+' : ''}{statsV2.saves.Reflexos}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Vontade</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {statsV2.saves.Vontade > 0 ? '+' : ''}{statsV2.saves.Vontade}
                </p>
              </div>
            </div>
          ) : (
            // V1: Mostrar resistências genéricas
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Badge variant="secondary" size="sm" className="mb-2">Menor</Badge>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {stats.resistances.minor > 0 ? '+' : ''}{stats.resistances.minor}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="info" size="sm" className="mb-2">Média</Badge>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {stats.resistances.medium > 0 ? '+' : ''}{stats.resistances.medium}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="success" size="sm" className="mb-2">Maior</Badge>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {stats.resistances.major > 0 ? '+' : ''}{stats.resistances.major}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atributos V2 */}
      {statsV2 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Atributos</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(statsV2.attributes).map(([attr, value]) => (
                <div key={attr} className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">{attr}</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {value > 0 ? '+' : ''}{value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perícias V2 */}
      {statsV2 && Object.keys(statsV2.skills).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Perícias-Chave</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(statsV2.skills).map(([skill, value]) => (
                <div key={skill} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-2">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{skill}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    +{value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mecânicas de Chefe */}
      {bossMechanics && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-bold text-sm text-gray-500 uppercase">Mecânicas de Chefe</h3>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Soberania</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {bossMechanics.sovereignty}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ações Extras</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Component
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'green' | 'cyan' | 'yellow' | 'pink' | 'indigo' | 'emerald';
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    pink: 'text-pink-600 dark:text-pink-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={colorClasses[color]}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
