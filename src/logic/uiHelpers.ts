import type { GameState } from '../types/game';
export interface DerivedStatItem {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  icon: React.ReactNode;
  accent: string;
}

export function getDerivedStats(gameState: GameState): Omit<DerivedStatItem, 'icon'>[] {
  const ps = gameState.playerStats;
  const statSpecs: Array<{
    en: string;
    key: string;
    accent: string;
    fmt: (v: number) => string;
  }> = [
    { en: 'damageBonus', key: 'dmg', accent: 'border-orange-400/35 bg-orange-500/10 text-orange-200', fmt: v => `${v}%` },
    { en: 'lifesteal', key: 'ls', accent: 'border-red-400/35 bg-red-500/10 text-red-200', fmt: v => `${v}%` },
    { en: 'thorns', key: 'thorns', accent: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200', fmt: v => `${v}%` },
    { en: 'elemental', key: 'element', accent: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200', fmt: v => `+${v}` },
    { en: 'attackSpeed', key: 'spd', accent: 'border-red-400/35 bg-red-500/10 text-red-200', fmt: v => `+${v}` },
  ];

  return statSpecs.map(({ en, key, accent, fmt }) => {
    const raw = (ps as any)[en] as number;
    return {
      key,
      label: en,
      value: fmt(raw),
      rawValue: raw,
      accent,
    };
  });
}