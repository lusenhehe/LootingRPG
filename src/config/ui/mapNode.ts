import type { MapEncounterType } from '../../logic/adapters/mapChapterAdapter';

export interface NodeEncounterStyle {
  shape: string;
  size: string;
  iconColor: string;
  ringColor: string;
  glowColor: string;
  particleColor: string;
  bgGradient: string;
  borderStyle: string;
}

export type ChapterTheme = 
  | '林地' | '地牢' | '火山' | '亡灵' | '风暴' 
  | '机械' | '晶体' | '虚空' | '星空' | '终焉';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
}

export const themeColors: Record<ChapterTheme, ThemeColors> = {
  '林地': { primary: '#10b981', primaryLight: '#6ee7b7', primaryDark: '#047857' },
  '地牢': { primary: '#78716c', primaryLight: '#d6d3d1', primaryDark: '#44403c' },
  '火山': { primary: '#f97316', primaryLight: '#fdba74', primaryDark: '#c2410c' },
  '亡灵': { primary: '#a855f7', primaryLight: '#d8b4fe', primaryDark: '#7e22ce' },
  '风暴': { primary: '#06b6d4', primaryLight: '#67e8f9', primaryDark: '#0891b2' },
  '机械': { primary: '#f59e0b', primaryLight: '#fcd34d', primaryDark: '#d97706' },
  '晶体': { primary: '#8b5cf6', primaryLight: '#c4b5fd', primaryDark: '#7c3aed' },
  '虚空': { primary: '#6366f1', primaryLight: '#a5b4fc', primaryDark: '#4f46e5' },
  '星空': { primary: '#3b82f6', primaryLight: '#93c5fd', primaryDark: '#2563eb' },
  '终焉': { primary: '#f43f5e', primaryLight: '#fda4af', primaryDark: '#e11d48' },
};

const forestStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-[30%_70%_70%_30%/30%_30%_70%_70%]', size: 'w-14 h-14', iconColor: 'text-emerald-200', 
    ringColor: 'ring-emerald-800/50', glowColor: 'rgba(16, 150, 100, 0.4)', particleColor: 'bg-emerald-400',
    bgGradient: 'from-emerald-950 via-green-950 to-stone-950', borderStyle: 'border-emerald-800/30',
  },
  elite: {
    shape: 'rounded-lg rotate-12', size: 'w-14 h-14', iconColor: 'text-lime-300',
    ringColor: 'ring-lime-700/60', glowColor: 'rgba(150, 200, 50, 0.5)', particleColor: 'bg-lime-500',
    bgGradient: 'from-lime-950 via-emerald-950 to-stone-900', borderStyle: 'border-lime-800/40',
  },
  boss: {
    shape: 'rounded-[40%_60%_35%_65%/60%_30%_70%_40%]', size: 'w-18 h-18', iconColor: 'text-lime-200',
    ringColor: 'ring-lime-900/70', glowColor: 'rgba(100, 180, 60, 0.6)', particleColor: 'bg-lime-400',
    bgGradient: 'from-lime-950 via-emerald-900 to-stone-950', borderStyle: 'border-lime-800/50',
  },
  wave: {
    shape: 'rounded-2xl', size: 'w-16 h-14', iconColor: 'text-teal-200',
    ringColor: 'ring-teal-800/50', glowColor: 'rgba(20, 150, 130, 0.4)', particleColor: 'bg-teal-500',
    bgGradient: 'from-teal-950 via-emerald-950 to-stone-950', borderStyle: 'border-teal-800/40',
  },
};

const dungeonStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-sm', size: 'w-14 h-14', iconColor: 'text-stone-300', 
    ringColor: 'ring-stone-600/50', glowColor: 'rgba(120, 120, 130, 0.4)', particleColor: 'bg-stone-400',
    bgGradient: 'from-stone-900 via-zinc-900 to-black', borderStyle: 'border-stone-700/40',
  },
  elite: {
    shape: 'rounded-[2px]', size: 'w-14 h-14', iconColor: 'text-stone-200',
    ringColor: 'ring-stone-500/60', glowColor: 'rgba(150, 150, 160, 0.5)', particleColor: 'bg-stone-300',
    bgGradient: 'from-stone-800 via-zinc-800 to-stone-950', borderStyle: 'border-stone-600/50',
  },
  boss: {
    shape: 'rounded-none', size: 'w-18 h-18', iconColor: 'text-stone-100',
    ringColor: 'ring-stone-400/70', glowColor: 'rgba(180, 180, 190, 0.6)', particleColor: 'bg-stone-200',
    bgGradient: 'from-stone-700 via-zinc-700 to-stone-900', borderStyle: 'border-stone-500/60',
  },
  wave: {
    shape: 'rounded-[3px]', size: 'w-16 h-14', iconColor: 'text-zinc-300',
    ringColor: 'ring-zinc-600/50', glowColor: 'rgba(130, 130, 140, 0.4)', particleColor: 'bg-zinc-400',
    bgGradient: 'from-zinc-900 via-stone-900 to-black', borderStyle: 'border-zinc-700/40',
  },
};

const volcanoStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-tl-[40%] rounded-br-[50%]', size: 'w-14 h-14', iconColor: 'text-orange-200', 
    ringColor: 'ring-orange-800/50', glowColor: 'rgba(200, 100, 20, 0.4)', particleColor: 'bg-orange-500',
    bgGradient: 'from-orange-950 via-red-950 to-stone-950', borderStyle: 'border-orange-800/40',
  },
  elite: {
    shape: 'rounded-tl-[30%] rounded-tr-[60%] rounded-bl-[60%] rounded-br-[30%]', size: 'w-14 h-14', iconColor: 'text-orange-300',
    ringColor: 'ring-orange-700/60', glowColor: 'rgba(220, 120, 30, 0.5)', particleColor: 'bg-orange-400',
    bgGradient: 'from-orange-900 via-red-900 to-stone-950', borderStyle: 'border-orange-700/50',
  },
  boss: {
    shape: 'rounded-tl-[60%] rounded-br-[60%] rounded-tr-[20%] rounded-bl-[20%]', size: 'w-18 h-18', iconColor: 'text-red-200',
    ringColor: 'ring-red-800/70', glowColor: 'rgba(220, 50, 20, 0.6)', particleColor: 'bg-red-500',
    bgGradient: 'from-red-900 via-orange-900 to-stone-950', borderStyle: 'border-red-700/60',
  },
  wave: {
    shape: 'rounded-tr-[40%] rounded-bl-[40%]', size: 'w-16 h-14', iconColor: 'text-amber-200',
    ringColor: 'ring-amber-800/50', glowColor: 'rgba(200, 150, 30, 0.4)', particleColor: 'bg-amber-500',
    bgGradient: 'from-amber-950 via-orange-950 to-stone-950', borderStyle: 'border-amber-800/40',
  },
};

const undeadStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-t-full rounded-b-sm', size: 'w-14 h-14', iconColor: 'text-purple-200', 
    ringColor: 'ring-purple-800/50', glowColor: 'rgba(150, 50, 150, 0.4)', particleColor: 'bg-purple-400',
    bgGradient: 'from-purple-950 via-violet-950 to-stone-950', borderStyle: 'border-purple-800/40',
  },
  elite: {
    shape: 'rounded-t-[60%] rounded-b-[40%]', size: 'w-14 h-14', iconColor: 'text-violet-300',
    ringColor: 'ring-violet-700/60', glowColor: 'rgba(180, 80, 180, 0.5)', particleColor: 'bg-violet-400',
    bgGradient: 'from-violet-900 via-purple-900 to-stone-950', borderStyle: 'border-violet-700/50',
  },
  boss: {
    shape: 'rounded-t-[70%] rounded-b-[30%]', size: 'w-18 h-18', iconColor: 'text-fuchsia-200',
    ringColor: 'ring-fuchsia-800/70', glowColor: 'rgba(200, 50, 150, 0.6)', particleColor: 'bg-fuchsia-500',
    bgGradient: 'from-fuchsia-900 via-purple-900 to-stone-950', borderStyle: 'border-fuchsia-700/60',
  },
  wave: {
    shape: 'rounded-[50%]_/[30%]_50%_30%', size: 'w-16 h-14', iconColor: 'text-rose-200',
    ringColor: 'ring-rose-800/50', glowColor: 'rgba(200, 80, 100, 0.4)', particleColor: 'bg-rose-500',
    bgGradient: 'from-rose-950 via-purple-950 to-stone-950', borderStyle: 'border-rose-800/40',
  },
};

const stormStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-full', size: 'w-14 h-14', iconColor: 'text-cyan-200', 
    ringColor: 'ring-cyan-800/50', glowColor: 'rgba(30, 180, 200, 0.4)', particleColor: 'bg-cyan-400',
    bgGradient: 'from-cyan-950 via-slate-900 to-black', borderStyle: 'border-cyan-800/40',
  },
  elite: {
    shape: 'rounded-[50%]_/[40%]_60%_40%_60%_60%', size: 'w-14 h-14', iconColor: 'text-sky-300',
    ringColor: 'ring-sky-700/60', glowColor: 'rgba(50, 160, 220, 0.5)', particleColor: 'bg-sky-400',
    bgGradient: 'from-sky-900 via-cyan-900 to-stone-950', borderStyle: 'border-sky-700/50',
  },
  boss: {
    shape: 'rounded-[55%]_/[45%]_45%_55%_55%_45%', size: 'w-18 h-18', iconColor: 'text-blue-200',
    ringColor: 'ring-blue-800/70', glowColor: 'rgba(40, 100, 220, 0.6)', particleColor: 'bg-blue-500',
    bgGradient: 'from-blue-900 via-sky-900 to-stone-950', borderStyle: 'border-blue-700/60',
  },
  wave: {
    shape: 'rounded-[45%]_/[55%]_55%_45%_45%_55%', size: 'w-16 h-14', iconColor: 'text-teal-200',
    ringColor: 'ring-teal-800/50', glowColor: 'rgba(30, 150, 140, 0.4)', particleColor: 'bg-teal-500',
    bgGradient: 'from-teal-950 via-cyan-950 to-stone-950', borderStyle: 'border-teal-800/40',
  },
};

const mechanicalStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-[3px]', size: 'w-14 h-14', iconColor: 'text-amber-200', 
    ringColor: 'ring-amber-700/50', glowColor: 'rgba(200, 150, 30, 0.4)', particleColor: 'bg-amber-500',
    bgGradient: 'from-amber-950 via-zinc-900 to-stone-950', borderStyle: 'border-amber-700/40',
  },
  elite: {
    shape: 'rotate-45 rounded-[2px]', size: 'w-14 h-14', iconColor: 'text-yellow-300',
    ringColor: 'ring-yellow-600/60', glowColor: 'rgba(220, 180, 40, 0.5)', particleColor: 'bg-yellow-400',
    bgGradient: 'from-yellow-900 via-amber-900 to-stone-950', borderStyle: 'border-yellow-600/50',
  },
  boss: {
    shape: 'rounded-[1px]', size: 'w-18 h-18', iconColor: 'text-orange-200',
    ringColor: 'ring-orange-700/70', glowColor: 'rgba(240, 120, 30, 0.6)', particleColor: 'bg-orange-500',
    bgGradient: 'from-orange-900 via-yellow-900 to-stone-950', borderStyle: 'border-orange-600/60',
  },
  wave: {
    shape: 'rounded-[4px]', size: 'w-16 h-14', iconColor: 'text-yellow-200',
    ringColor: 'ring-yellow-700/50', glowColor: 'rgba(200, 160, 50, 0.4)', particleColor: 'bg-yellow-500',
    bgGradient: 'from-yellow-950 via-amber-950 to-stone-950', borderStyle: 'border-yellow-700/40',
  },
};

const crystalStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-tl-[50%] rounded-br-[50%]', size: 'w-14 h-14', iconColor: 'text-violet-200', 
    ringColor: 'ring-violet-700/50', glowColor: 'rgba(150, 50, 200, 0.4)', particleColor: 'bg-violet-400',
    bgGradient: 'from-violet-950 via-purple-950 to-stone-950', borderStyle: 'border-violet-700/40',
  },
  elite: {
    shape: 'rounded-tl-[30%] rounded-tr-[50%] rounded-bl-[50%] rounded-br-[30%]', size: 'w-14 h-14', iconColor: 'text-fuchsia-300',
    ringColor: 'ring-fuchsia-600/60', glowColor: 'rgba(200, 60, 180, 0.5)', particleColor: 'bg-fuchsia-400',
    bgGradient: 'from-fuchsia-900 via-violet-900 to-stone-950', borderStyle: 'border-fuchsia-600/50',
  },
  boss: {
    shape: 'rounded-[50%]_/[30%]_70%_30%_30%_70%', size: 'w-18 h-18', iconColor: 'text-purple-200',
    ringColor: 'ring-purple-600/70', glowColor: 'rgba(180, 40, 200, 0.6)', particleColor: 'bg-purple-500',
    bgGradient: 'from-purple-900 via-fuchsia-900 to-stone-950', borderStyle: 'border-purple-500/60',
  },
  wave: {
    shape: 'rounded-tl-[40%] rounded-br-[60%]', size: 'w-16 h-14', iconColor: 'text-rose-200',
    ringColor: 'ring-rose-700/50', glowColor: 'rgba(200, 70, 120, 0.4)', particleColor: 'bg-rose-500',
    bgGradient: 'from-rose-950 via-violet-950 to-stone-950', borderStyle: 'border-rose-700/40',
  },
};

const voidStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-full', size: 'w-14 h-14', iconColor: 'text-indigo-200', 
    ringColor: 'ring-indigo-700/50', glowColor: 'rgba(100, 80, 200, 0.4)', particleColor: 'bg-indigo-400',
    bgGradient: 'from-indigo-950 via-slate-900 to-black', borderStyle: 'border-indigo-700/40',
  },
  elite: {
    shape: 'rounded-[60%]_/[40%]_40%_60%_60%_40%', size: 'w-14 h-14', iconColor: 'text-purple-300',
    ringColor: 'ring-purple-600/60', glowColor: 'rgba(140, 80, 220, 0.5)', particleColor: 'bg-purple-400',
    bgGradient: 'from-purple-900 via-indigo-900 to-stone-950', borderStyle: 'border-purple-600/50',
  },
  boss: {
    shape: 'rounded-[65%]_/[35%]_35%_65%_65%_35%', size: 'w-18 h-18', iconColor: 'text-violet-200',
    ringColor: 'ring-violet-600/70', glowColor: 'rgba(160, 60, 240, 0.6)', particleColor: 'bg-violet-500',
    bgGradient: 'from-violet-900 via-purple-900 to-stone-950', borderStyle: 'border-violet-500/60',
  },
  wave: {
    shape: 'rounded-[55%]_/[45%]_45%_55%_55%_45%', size: 'w-16 h-14', iconColor: 'text-blue-200',
    ringColor: 'ring-blue-700/50', glowColor: 'rgba(60, 100, 220, 0.4)', particleColor: 'bg-blue-500',
    bgGradient: 'from-blue-950 via-indigo-950 to-stone-950', borderStyle: 'border-blue-700/40',
  },
};

const cosmicStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-xl', size: 'w-14 h-14', iconColor: 'text-blue-200', 
    ringColor: 'ring-blue-700/50', glowColor: 'rgba(60, 100, 220, 0.4)', particleColor: 'bg-blue-400',
    bgGradient: 'from-blue-950 via-indigo-950 to-black', borderStyle: 'border-blue-700/40',
  },
  elite: {
    shape: 'rounded-[50%]_/[30%]_70%_30%_30%_70%', size: 'w-14 h-14', iconColor: 'text-indigo-300',
    ringColor: 'ring-indigo-600/60', glowColor: 'rgba(100, 80, 220, 0.5)', particleColor: 'bg-indigo-400',
    bgGradient: 'from-indigo-900 via-blue-900 to-stone-950', borderStyle: 'border-indigo-600/50',
  },
  boss: {
    shape: 'rounded-[55%]_/[45%]_45%_55%_55%_45%', size: 'w-18 h-18', iconColor: 'text-sky-200',
    ringColor: 'ring-sky-600/70', glowColor: 'rgba(80, 140, 240, 0.6)', particleColor: 'bg-sky-500',
    bgGradient: 'from-sky-900 via-blue-900 to-stone-950', borderStyle: 'border-sky-500/60',
  },
  wave: {
    shape: 'rounded-[40%]_/[60%]_60%_40%_40%_60%', size: 'w-16 h-14', iconColor: 'text-cyan-200',
    ringColor: 'ring-cyan-700/50', glowColor: 'rgba(40, 180, 200, 0.4)', particleColor: 'bg-cyan-500',
    bgGradient: 'from-cyan-950 via-blue-950 to-stone-950', borderStyle: 'border-cyan-700/40',
  },
};

const apocalypseStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-[8px]', size: 'w-14 h-14', iconColor: 'text-red-200', 
    ringColor: 'ring-red-800/50', glowColor: 'rgba(200, 40, 50, 0.4)', particleColor: 'bg-red-500',
    bgGradient: 'from-red-950 via-rose-950 to-stone-950', borderStyle: 'border-red-800/40',
  },
  elite: {
    shape: 'rounded-[5px] rotate-12', size: 'w-14 h-14', iconColor: 'text-orange-300',
    ringColor: 'ring-orange-700/60', glowColor: 'rgba(220, 80, 30, 0.5)', particleColor: 'bg-orange-500',
    bgGradient: 'from-orange-900 via-red-900 to-stone-950', borderStyle: 'border-orange-700/50',
  },
  boss: {
    shape: 'rounded-none', size: 'w-18 h-18', iconColor: 'text-rose-200',
    ringColor: 'ring-rose-700/70', glowColor: 'rgba(240, 40, 60, 0.6)', particleColor: 'bg-rose-600',
    bgGradient: 'from-rose-900 via-red-900 to-stone-950', borderStyle: 'border-rose-600/60',
  },
  wave: {
    shape: 'rounded-[10px]', size: 'w-16 h-14', iconColor: 'text-amber-200',
    ringColor: 'ring-amber-800/50', glowColor: 'rgba(220, 140, 30, 0.4)', particleColor: 'bg-amber-500',
    bgGradient: 'from-amber-950 via-red-950 to-stone-950', borderStyle: 'border-amber-800/40',
  },
};

export const defaultEncounterStyles: Record<MapEncounterType, NodeEncounterStyle> = {
  normal: { shape: 'rounded-xl', size: 'w-14 h-14', iconColor: 'text-red-200', 
    ringColor: 'ring-red-800/50', glowColor: 'rgba(180, 40, 40, 0.4)', particleColor: 'bg-red-400',
    bgGradient: 'from-red-950 via-stone-900 to-black', borderStyle: 'border-red-800/40',
  },
  elite: {
    shape: 'rounded-lg rotate-45', size: 'w-14 h-14', iconColor: 'text-amber-200',
    ringColor: 'ring-amber-900/60', glowColor: 'rgba(200, 100, 20, 0.5)', particleColor: 'bg-amber-600',
    bgGradient: 'from-amber-950 via-orange-950 to-stone-900', borderStyle: 'border-amber-800/50',
  },
  boss: {
    shape: 'rounded-xl', size: 'w-18 h-18', iconColor: 'text-rose-200',
    ringColor: 'ring-rose-900/70', glowColor: 'rgba(220, 40, 60, 0.6)', particleColor: 'bg-rose-500',
    bgGradient: 'from-rose-950 via-red-950 to-stone-950', borderStyle: 'border-rose-800/60',
  },
  wave: {
    shape: 'rounded-2xl', size: 'w-16 h-14', iconColor: 'text-emerald-200',
    ringColor: 'ring-emerald-900/50', glowColor: 'rgba(20, 120, 80, 0.4)', particleColor: 'bg-emerald-600',
    bgGradient: 'from-emerald-950 via-stone-900 to-black', borderStyle: 'border-emerald-800/40',
  },
};

export const chapterNodeStyles: Record<ChapterTheme, Record<MapEncounterType, NodeEncounterStyle>> = {
  '林地': forestStyles,
  '地牢': dungeonStyles,
  '火山': volcanoStyles,
  '亡灵': undeadStyles,
  '风暴': stormStyles,
  '机械': mechanicalStyles,
  '晶体': crystalStyles,
  '虚空': voidStyles,
  '星空': cosmicStyles,
  '终焉': apocalypseStyles,
};

export const getChapterNodeStyles = (theme: string): Record<MapEncounterType, NodeEncounterStyle> => {
  return chapterNodeStyles[theme as ChapterTheme];
};

export const MAP_NODE_CONFIG = {
  bossIconSize: 26,
  normalIconSize: 22,
  starCount: {
    boss: 3,
    elite: 2,
    wave: 2,
    normal: 1,
  } as Record<MapEncounterType, number>,
  floatDelayBase: 0.3,
  floatDelayIncrement: 0.08,
  animationDuration: {
    float: 2.5,
    hover: 0.35,
    glow: 1.5,
    particle: 1.2,
  },
  hoverScale: 1.1,
  hoverY: -8,
  tapScale: 0.95,
};

export const HEADER_CONFIG = {
  titleSize: 'text-base',
  subtitleSize: 'text-[10px]',
  infoBadgePadding: 'px-2 py-1',
  progressBarHeight: 4,
};

export const themeHeaderColors: Record<ChapterTheme, { primary: string; secondary: string; glow: string; border: string; text: string }> = {
  '林地': { primary: 'emerald', secondary: 'green', glow: 'rgba(16, 150, 100, 0.1)', border: 'emerald-900/30', text: 'emerald' },
  '地牢': { primary: 'stone', secondary: 'zinc', glow: 'rgba(120, 120, 130, 0.1)', border: 'stone-900/30', text: 'stone' },
  '火山': { primary: 'orange', secondary: 'red', glow: 'rgba(200, 100, 20, 0.1)', border: 'orange-900/30', text: 'orange' },
  '亡灵': { primary: 'purple', secondary: 'violet', glow: 'rgba(150, 50, 150, 0.1)', border: 'purple-900/30', text: 'purple' },
  '风暴': { primary: 'cyan', secondary: 'slate', glow: 'rgba(30, 180, 200, 0.1)', border: 'cyan-900/30', text: 'cyan' },
  '机械': { primary: 'amber', secondary: 'yellow', glow: 'rgba(200, 150, 30, 0.1)', border: 'amber-900/30', text: 'amber' },
  '晶体': { primary: 'violet', secondary: 'fuchsia', glow: 'rgba(150, 50, 200, 0.1)', border: 'violet-900/30', text: 'violet' },
  '虚空': { primary: 'indigo', secondary: 'purple', glow: 'rgba(100, 80, 200, 0.1)', border: 'indigo-900/30', text: 'indigo' },
  '星空': { primary: 'blue', secondary: 'indigo', glow: 'rgba(60, 100, 220, 0.1)', border: 'blue-900/30', text: 'blue' },
  '终焉': { primary: 'rose', secondary: 'red', glow: 'rgba(220, 50, 70, 0.1)', border: 'rose-900/30', text: 'rose' },
};

export const getThemeHeaderColors = (theme: string) => {
  return themeHeaderColors[theme as ChapterTheme] || themeHeaderColors['终焉'];
};
