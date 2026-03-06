import type { CSSProperties } from 'react';

export type InventoryIconToken =
  | 'sword'
  | 'shield'
  | 'sparkles'
  | 'droplets'
  | 'flame'
  | 'zap'
  | 'gem'
  | 'shieldAlert'
  | 'gauge'
  | 'target';

export interface InventoryRarityVisual {
  cellGradient: [string, string];
  detailGradient: [string, string];
  accentColor: string;
  borderClass: string;
  textClass: string;
  glowShadow: string;
  activeGlowShadow: string;
  slotHaloShadow: string;
  pulseClass?: string;
}

export interface InventoryStatVisual {
  icon: InventoryIconToken;
  labelClass: string;
  valueClass: string;
}

export const INVENTORY_LAYOUT = {
  backpackCellMinWidth: 82,
  detailPanelMinHeight: 240,
  tooltipWidth: 296,
  tooltipApproxHeight: 320,
  tooltipOffsetX: 18,
  tooltipOffsetY: 18,
  tooltipViewportPadding: 16,
} as const;

export const INVENTORY_SURFACE_PRESETS = {
  backpackPanel: {
    backgroundImage: [
      'radial-gradient(circle at center, rgba(255,120,0,0.08), transparent 58%)',
      'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.04), transparent 24%)',
      'linear-gradient(180deg, rgba(16,12,10,0.96), rgba(7,7,8,0.98))',
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.04)',
      'inset 0 -16px 30px rgba(0,0,0,0.42)',
      '0 0 24px rgba(255,128,0,0.07)',
    ].join(', '),
  } satisfies CSSProperties,
  detailPanel: {
    backgroundImage: [
      'radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 28%)',
      'linear-gradient(180deg, rgba(21,16,13,0.98), rgba(8,8,9,0.98))',
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.05)',
      'inset 0 -18px 28px rgba(0,0,0,0.5)',
      '0 10px 40px rgba(0,0,0,0.28)',
    ].join(', '),
  } satisfies CSSProperties,
  placeholderPanel: {
    backgroundImage: [
      'radial-gradient(circle at center, rgba(245,158,11,0.08), transparent 58%)',
      'linear-gradient(180deg, rgba(20,16,14,0.92), rgba(8,8,9,0.96))',
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.03)',
      'inset 0 -14px 26px rgba(0,0,0,0.45)',
    ].join(', '),
  } satisfies CSSProperties,
  equipmentPanel: {
    backgroundImage: [
      'radial-gradient(circle at 20% 18%, rgba(245,158,11,0.08), transparent 36%)',
      'linear-gradient(180deg, rgba(24,20,18,0.98), rgba(10,10,10,0.98))',
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.03)',
      'inset 0 -18px 30px rgba(0,0,0,0.46)',
      '0 0 18px rgba(255,150,0,0.06)',
    ].join(', '),
  } satisfies CSSProperties,
  emptySlot: {
    backgroundImage: 'linear-gradient(180deg, rgba(22,20,18,0.96), rgba(8,8,8,0.98))',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.04)',
      'inset 0 -8px 14px rgba(0,0,0,0.58)',
    ].join(', '),
  } satisfies CSSProperties,
} as const;

export const INVENTORY_RARITY_VISUALS: Record<string, InventoryRarityVisual> = {
  common: {
    cellGradient: ['#27272a', '#111113'],
    detailGradient: ['#3f3f46', '#18181b'],
    accentColor: '#a1a1aa',
    borderClass: 'border-zinc-600/80',
    textClass: 'text-zinc-200',
    glowShadow: '0 0 0 rgba(0,0,0,0)',
    activeGlowShadow: '0 0 12px rgba(161,161,170,0.22)',
    slotHaloShadow: '0 0 10px rgba(161,161,170,0.18)',
  },
  uncommon: {
    cellGradient: ['#0f2a25', '#071a17'],
    detailGradient: ['#14532d', '#052e16'],
    accentColor: '#4ade80',
    borderClass: 'border-emerald-500/80',
    textClass: 'text-emerald-200',
    glowShadow: '0 0 10px rgba(34,197,94,0.22)',
    activeGlowShadow: '0 0 18px rgba(74,222,128,0.28)',
    slotHaloShadow: '0 0 12px rgba(34,197,94,0.24)',
  },
  rare: {
    cellGradient: ['#102947', '#071625'],
    detailGradient: ['#1d4ed8', '#172554'],
    accentColor: '#60a5fa',
    borderClass: 'border-sky-400/85',
    textClass: 'text-sky-200',
    glowShadow: '0 0 12px rgba(59,130,246,0.24)',
    activeGlowShadow: '0 0 20px rgba(96,165,250,0.28)',
    slotHaloShadow: '0 0 14px rgba(59,130,246,0.24)',
  },
  epic: {
    cellGradient: ['#2b103b', '#13091d'],
    detailGradient: ['#7e22ce', '#3b0764'],
    accentColor: '#c084fc',
    borderClass: 'border-purple-400/85',
    textClass: 'text-purple-200',
    glowShadow: '0 0 14px rgba(168,85,247,0.26)',
    activeGlowShadow: '0 0 22px rgba(192,132,252,0.32)',
    slotHaloShadow: '0 0 16px rgba(168,85,247,0.28)',
  },
  legendary: {
    cellGradient: ['#4a2406', '#1d0d03'],
    detailGradient: ['#d97706', '#78350f'],
    accentColor: '#fbbf24',
    borderClass: 'border-amber-400/90',
    textClass: 'text-amber-200',
    glowShadow: '0 0 16px rgba(251,191,36,0.28)',
    activeGlowShadow: '0 0 24px rgba(251,191,36,0.34)',
    slotHaloShadow: '0 0 18px rgba(251,191,36,0.32)',
  },
  mythic: {
    cellGradient: ['#3a0b0b', '#1b0505'],
    detailGradient: ['#b91c1c', '#450a0a'],
    accentColor: '#ff5d5d',
    borderClass: 'border-red-500/90',
    textClass: 'text-red-200',
    glowShadow: '0 0 18px rgba(255,70,70,0.4)',
    activeGlowShadow: '0 0 28px rgba(255,70,70,0.5)',
    slotHaloShadow: '0 0 20px rgba(255,70,70,0.42)',
    pulseClass: 'inventory-rarity-breathe',
  },
};

export const INVENTORY_STAT_VISUALS: Record<string, InventoryStatVisual> = {
  attack: { icon: 'sword', labelClass: 'text-stone-200', valueClass: 'text-stone-100' },
  defense: { icon: 'shield', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100' },
  hp: { icon: 'sparkles', labelClass: 'text-lime-200', valueClass: 'text-lime-100' },
  hp_bonus: { icon: 'sparkles', labelClass: 'text-lime-200', valueClass: 'text-lime-100' },
  crit: { icon: 'target', labelClass: 'text-yellow-200', valueClass: 'text-yellow-100' },
  critDamage: { icon: 'zap', labelClass: 'text-fuchsia-200', valueClass: 'text-fuchsia-100' },
  damage_bonus: { icon: 'zap', labelClass: 'text-violet-200', valueClass: 'text-violet-100' },
  lifesteal: { icon: 'droplets', labelClass: 'text-rose-200', valueClass: 'text-rose-100' },
  thorns: { icon: 'shieldAlert', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100' },
  element: { icon: 'gem', labelClass: 'text-orange-200', valueClass: 'text-orange-100' },
  elemental: { icon: 'gem', labelClass: 'text-orange-200', valueClass: 'text-orange-100' },
  dodge: { icon: 'sparkles', labelClass: 'text-sky-200', valueClass: 'text-sky-100' },
  block: { icon: 'shield', labelClass: 'text-stone-200', valueClass: 'text-stone-100' },
  attackSpeed: { icon: 'gauge', labelClass: 'text-red-200', valueClass: 'text-red-100' },
};

const fallbackRarityVisual = INVENTORY_RARITY_VISUALS.common;
const fallbackStatVisual = INVENTORY_STAT_VISUALS.attack;

export const getInventoryRarityVisual = (quality: string): InventoryRarityVisual => {
  return INVENTORY_RARITY_VISUALS[quality] ?? fallbackRarityVisual;
};

export const getInventoryStatVisual = (statKey: string): InventoryStatVisual => {
  return INVENTORY_STAT_VISUALS[statKey] ?? fallbackStatVisual;
};
