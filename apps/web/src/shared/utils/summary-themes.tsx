import { LucideIcon, Sparkles, Sword, Shield, FlaskConical, Gem, Package, Zap, Globe, Heart, Skull, Brain, Atom } from 'lucide-react';

export interface SummaryTheme {
  id: string;
  name: string;
  bgGradient: string;
  accentColor: string;
  textColor: string;
  pattern: 'dots' | 'grid' | 'waves' | 'circles' | 'diamonds' | 'none';
  icon: LucideIcon;
}

const DOMAIN_THEMES: Record<string, SummaryTheme> = {
  natural: {
    id: 'natural',
    name: 'Natural',
    bgGradient: 'from-emerald-600 to-green-900',
    accentColor: 'text-emerald-200',
    textColor: 'text-white',
    pattern: 'circles',
    icon: Heart,
  },
  sagrado: {
    id: 'sagrado',
    name: 'Sagrado',
    bgGradient: 'from-amber-400 to-yellow-700',
    accentColor: 'text-amber-100',
    textColor: 'text-white',
    pattern: 'diamonds',
    icon: Zap,
  },
  sacrilegio: {
    id: 'sacrilegio',
    name: 'Sacrilégio',
    bgGradient: 'from-rose-900 via-red-950 to-black',
    accentColor: 'text-rose-400',
    textColor: 'text-white',
    pattern: 'none',
    icon: Skull,
  },
  psiquico: {
    id: 'psiquico',
    name: 'Psíquico',
    bgGradient: 'from-indigo-600 to-blue-900',
    accentColor: 'text-indigo-200',
    textColor: 'text-white',
    pattern: 'waves',
    icon: Brain,
  },
  cientifico: {
    id: 'cientifico',
    name: 'Científico',
    bgGradient: 'from-slate-600 to-blue-900',
    accentColor: 'text-blue-200',
    textColor: 'text-white',
    pattern: 'grid',
    icon: Atom,
  },
  peculiar: {
    id: 'peculiar',
    name: 'Peculiar',
    bgGradient: 'from-purple-600 to-indigo-900',
    accentColor: 'text-purple-200',
    textColor: 'text-white',
    pattern: 'dots',
    icon: Sparkles,
  },
  'arma-branca': {
    id: 'arma-branca',
    name: 'Arma Branca',
    bgGradient: 'from-red-700 to-zinc-900',
    accentColor: 'text-red-300',
    textColor: 'text-white',
    pattern: 'none',
    icon: Sword,
  },
  'arma-fogo': {
    id: 'arma-fogo',
    name: 'Arma de Fogo',
    bgGradient: 'from-red-800 to-zinc-950',
    accentColor: 'text-red-400',
    textColor: 'text-white',
    pattern: 'none',
    icon: Sword,
  },
};

const ITEM_THEMES: Record<string, SummaryTheme> = {
  weapon: {
    id: 'weapon',
    name: 'Arma',
    bgGradient: 'from-red-700 to-zinc-900',
    accentColor: 'text-red-300',
    textColor: 'text-white',
    pattern: 'none',
    icon: Sword,
  },
  'defensive-equipment': {
    id: 'defensive-equipment',
    name: 'Equipamento Defensivo',
    bgGradient: 'from-blue-700 to-slate-900',
    accentColor: 'text-blue-300',
    textColor: 'text-white',
    pattern: 'grid',
    icon: Shield,
  },
  consumable: {
    id: 'consumable',
    name: 'Consumível',
    bgGradient: 'from-teal-500 to-emerald-900',
    accentColor: 'text-teal-200',
    textColor: 'text-white',
    pattern: 'circles',
    icon: FlaskConical,
  },
  artifact: {
    id: 'artifact',
    name: 'Artefato',
    bgGradient: 'from-yellow-400 via-orange-600 to-amber-900',
    accentColor: 'text-yellow-100',
    textColor: 'text-white',
    pattern: 'diamonds',
    icon: Gem,
  },
  accessory: {
    id: 'accessory',
    name: 'Acessório',
    bgGradient: 'from-cyan-500 to-indigo-900',
    accentColor: 'text-cyan-200',
    textColor: 'text-white',
    pattern: 'waves',
    icon: Package,
  },
};

const DEFAULT_THEME: SummaryTheme = {
  id: 'default',
  name: 'Aetherium',
  bgGradient: 'from-indigo-600 to-purple-800',
  accentColor: 'text-indigo-200',
  textColor: 'text-white',
  pattern: 'dots',
  icon: Globe,
};

export function getThemeByDomain(domainId: string): SummaryTheme {
  // Se for arma-*, agrupar no tema de armas
  if (domainId.startsWith('arma-')) {
    return DOMAIN_THEMES[domainId] || DOMAIN_THEMES['arma-branca'] || DEFAULT_THEME;
  }
  return DOMAIN_THEMES[domainId] || DEFAULT_THEME;
}

export function getThemeByItemType(type: string): SummaryTheme {
  return ITEM_THEMES[type] || DEFAULT_THEME;
}

export function PatternOverlay({ pattern }: { pattern: SummaryTheme['pattern'] }) {
  if (pattern === 'none') return null;

  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      {pattern === 'dots' && (
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      )}
      {pattern === 'grid' && (
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      )}
      {pattern === 'waves' && (
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,30 50,50 T100,50 V100 H0 Z" fill="white" fillOpacity="0.1" />
            <path d="M0,60 Q25,40 50,60 T100,60 V100 H0 Z" fill="white" fillOpacity="0.1" />
          </svg>
        </div>
      )}
      {pattern === 'circles' && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
      )}
      {pattern === 'diamonds' && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rotate-45 -translate-y-1/2 translate-x-1/2" />
      )}
    </div>
  );
}
