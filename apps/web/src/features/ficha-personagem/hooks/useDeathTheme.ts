import { useMemo } from 'react';
import { CharacterResponse } from '@/services/characters.types';

export type DeathThemeLevel =
  | 'normal'       // ALIVE, 0 markers
  | 'scarred'      // ALIVE, 1+ markers (stabilized but marked)
  | 'danger'       // DYING, 1 marker
  | 'critical'     // DYING, 2 markers
  | 'dead';        // DYING/3 or DEAD

export interface DeathTheme {
  level: DeathThemeLevel;

  /** Wrapper: inset box-shadow vignette */
  vignetteStyle: React.CSSProperties;

  /** Wrapper: additional className (grayscale for DEAD) */
  wrapperClass: string;

  /** Header container: border + background tint */
  headerClass: string;

  /** Avatar border + glow */
  avatarBorderClass: string;

  /** Whether to show the skull overlay on the avatar */
  showDeadOverlay: boolean;

  /** Badge label to show below the character name. null = no badge */
  badgeLabel: string | null;

  /** Badge CSS classes */
  badgeClass: string;
}

export function useDeathTheme(character: CharacterResponse | null | undefined): DeathTheme {
  return useMemo(() => {
    if (!character) return normalTheme();

    const state = character.death?.state ?? 'ALIVE';
    const counter = character.death?.counter ?? 0;

    if (state === 'DEAD' || (state === 'DYING' && counter >= 3)) {
      return deadTheme();
    }

    if (state === 'DYING') {
      return counter >= 2 ? criticalTheme(counter) : dangerTheme(counter);
    }

    // ALIVE
    if (counter > 0) {
      return scarredTheme(counter);
    }

    return normalTheme();
  }, [character?.death?.state, character?.death?.counter]);
}

// ──────────────────────────────────────────────────────────────────────────────
// Theme factories
// ──────────────────────────────────────────────────────────────────────────────

function normalTheme(): DeathTheme {
  return {
    level: 'normal',
    vignetteStyle: {},
    wrapperClass: '',
    headerClass: '',
    avatarBorderClass: 'border-purple-500/20',
    showDeadOverlay: false,
    badgeLabel: null,
    badgeClass: '',
  };
}

function scarredTheme(counter: number): DeathTheme {
  return {
    level: 'scarred',
    vignetteStyle: {
      boxShadow: 'inset 0 0 60px 10px rgba(217, 119, 6, 0.12)',
      transition: 'box-shadow 0.7s ease',
    },
    wrapperClass: '',
    headerClass: 'border-amber-200/60 dark:border-amber-800/40',
    avatarBorderClass: 'border-amber-400/60 dark:border-amber-600/40',
    showDeadOverlay: false,
    badgeLabel: `Marcadores: ${counter}/3`,
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  };
}

function dangerTheme(counter: number): DeathTheme {
  return {
    level: 'danger',
    vignetteStyle: {
      boxShadow: 'inset 0 0 80px 16px rgba(220, 38, 38, 0.20)',
      transition: 'box-shadow 0.7s ease',
    },
    wrapperClass: '',
    headerClass:
      'border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10',
    avatarBorderClass:
      'border-red-500/70 shadow-[0_0_12px_2px_rgba(220,38,38,0.35)]',
    showDeadOverlay: false,
    badgeLabel: `Morrendo — ${counter}/3`,
    badgeClass:
      'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 animate-pulse',
  };
}

function criticalTheme(counter: number): DeathTheme {
  return {
    level: 'critical',
    vignetteStyle: {
      boxShadow: 'inset 0 0 100px 24px rgba(220, 38, 38, 0.32)',
      transition: 'box-shadow 0.7s ease',
      animation: 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    wrapperClass: '',
    headerClass:
      'border-red-300 dark:border-red-800/80 bg-red-100/30 dark:bg-red-950/20',
    avatarBorderClass:
      'border-red-600 shadow-[0_0_20px_4px_rgba(220,38,38,0.55)]',
    showDeadOverlay: false,
    badgeLabel: `⚠ Morrendo — ${counter}/3`,
    badgeClass:
      'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 animate-pulse',
  };
}

function deadTheme(): DeathTheme {
  return {
    level: 'dead',
    vignetteStyle: {
      boxShadow: 'inset 0 0 120px 32px rgba(0, 0, 0, 0.55)',
      transition: 'box-shadow 0.7s ease',
    },
    wrapperClass: 'grayscale brightness-75 contrast-90',
    headerClass:
      'border-gray-400/50 dark:border-gray-700/80 bg-gray-100/20 dark:bg-gray-900/40',
    avatarBorderClass:
      'border-gray-500/60 shadow-[0_0_20px_6px_rgba(0,0,0,0.5)]',
    showDeadOverlay: true,
    badgeLabel: '💀 Personagem Morto',
    badgeClass:
      'bg-gray-100 dark:bg-gray-900/60 border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-400',
  };
}
