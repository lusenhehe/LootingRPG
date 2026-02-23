import { MapEncounterType } from '../../../config/mapChapters';

export const encounterBadge: Record<MapEncounterType, string> = {
  normal: 'border-slate-400/50 bg-slate-500/15 text-slate-200',
  elite: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
  boss: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
  wave: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
};

export type ChapterTheme =
  | '林地'
  | '地牢'
  | '火山'
  | '亡灵'
  | '风暴'
  | '机械'
  | '晶体'
  | '虚空'
  | '星空'
  | '终焉';

export const chapterThemeStyles: Record<ChapterTheme, {
  islandGradient: string;
  terrainTop: string;
  glowColor: string;
  shadowColor: string;
  accentColor: string;
  particles: { color: string; size: string; count: number };
}> = {
  '林地': {
    islandGradient: 'from-emerald-800 via-emerald-700 to-emerald-900',
    terrainTop: 'from-lime-400 via-emerald-400 to-teal-500',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    accentColor: 'emerald',
    particles: { color: 'bg-lime-400', size: 'w-1 h-1', count: 4 },
  },
  '地牢': {
    islandGradient: 'from-slate-800 via-stone-700 to-slate-900',
    terrainTop: 'from-slate-500 via-gray-600 to-stone-500',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    shadowColor: 'rgba(71, 85, 105, 0.3)',
    accentColor: 'slate',
    particles: { color: 'bg-slate-400', size: 'w-1 h-1', count: 3 },
  },
  '火山': {
    islandGradient: 'from-stone-800 via-red-900 to-orange-950',
    terrainTop: 'from-orange-500 via-red-500 to-amber-600',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    shadowColor: 'rgba(239, 68, 68, 0.35)',
    accentColor: 'orange',
    particles: { color: 'bg-orange-500', size: 'w-1.5 h-1.5', count: 5 },
  },
  '亡灵': {
    islandGradient: 'from-slate-900 via-purple-950 to-slate-900',
    terrainTop: 'from-purple-500 via-violet-500 to-fuchsia-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    accentColor: 'purple',
    particles: { color: 'bg-purple-400', size: 'w-1 h-2', count: 4 },
  },
  '风暴': {
    islandGradient: 'from-sky-900 via-cyan-800 to-slate-900',
    terrainTop: 'from-cyan-400 via-sky-400 to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.45)',
    shadowColor: 'rgba(56, 189, 248, 0.3)',
    accentColor: 'cyan',
    particles: { color: 'bg-sky-300', size: 'w-0.5 h-2', count: 6 },
  },
  '机械': {
    islandGradient: 'from-zinc-800 via-amber-900 to-zinc-900',
    terrainTop: 'from-amber-500 via-yellow-500 to-orange-400',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: 'rgba(217, 119, 6, 0.3)',
    accentColor: 'amber',
    particles: { color: 'bg-amber-400', size: 'w-1 h-1', count: 5 },
  },
  '晶体': {
    islandGradient: 'from-violet-900 via-purple-800 to-indigo-950',
    terrainTop: 'from-fuchsia-400 via-purple-400 to-violet-400',
    glowColor: 'rgba(217, 70, 239, 0.5)',
    shadowColor: 'rgba(192, 132, 252, 0.35)',
    accentColor: 'fuchsia',
    particles: { color: 'bg-violet-300', size: 'w-2 h-1', count: 5 },
  },
  '虚空': {
    islandGradient: 'from-indigo-950 via-purple-950 to-slate-950',
    terrainTop: 'from-indigo-400 via-purple-400 to-violet-400',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    shadowColor: 'rgba(99, 102, 241, 0.3)',
    accentColor: 'indigo',
    particles: { color: 'bg-indigo-400', size: 'w-1 h-3', count: 6 },
  },
  '星空': {
    islandGradient: 'from-slate-950 via-blue-950 to-indigo-950',
    terrainTop: 'from-blue-300 via-indigo-400 to-violet-300',
    glowColor: 'rgba(147, 197, 253, 0.4)',
    shadowColor: 'rgba(99, 102, 241, 0.25)',
    accentColor: 'blue',
    particles: { color: 'bg-blue-200', size: 'w-1 h-1', count: 8 },
  },
  '终焉': {
    islandGradient: 'from-red-950 via-rose-900 to-slate-950',
    terrainTop: 'from-rose-500 via-red-500 to-orange-500',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    shadowColor: 'rgba(225, 29, 72, 0.35)',
    accentColor: 'rose',
    particles: { color: 'bg-rose-400', size: 'w-1.5 h-1.5', count: 6 },
  },
};

export const getNodeState = (
  unlocked: boolean, cleared: boolean, playerLevel: number, nodeLevel: number,
): 'locked' | 'warning' | 'ready' | 'cleared' => {
  if (!unlocked) return 'locked';
  if (cleared) return 'cleared';
  if (playerLevel < nodeLevel) return 'warning';
  return 'ready';
};

export const stateOverlayStyles = {
  locked: {
    overlay: 'opacity-40',
    glowFilter: 'none',
  },
  warning: {
    overlay: '',
    glowFilter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))',
  },
  ready: {
    overlay: '',
    glowFilter: 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.6))',
  },
  cleared: {
    overlay: 'opacity-75',
    glowFilter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))',
  },
};

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ZIGZAG_START_X = 14;
const ZIGZAG_STEP_X = 22;
const ZIGZAG_Y_POINTS = [46, 54] as const;

export const getZigzagNodePosition = (nodeIndex: number) => ({
  x: ZIGZAG_START_X + nodeIndex * ZIGZAG_STEP_X,
  y: ZIGZAG_Y_POINTS[nodeIndex % ZIGZAG_Y_POINTS.length],
});

const getPanLimits = (nodeCount: number, viewport: DOMRect) => {
  const safeCount = Math.max(1, nodeCount);
  const firstX = getZigzagNodePosition(0).x;
  const lastX = getZigzagNodePosition(safeCount - 1).x;
  const sidePadding = 12;

  const minX = ((50 - (lastX + sidePadding)) / 100) * viewport.width;
  const maxX = ((50 - (firstX - sidePadding)) / 100) * viewport.width;

  return { minX, maxX };
};

export const clampMapOffset = (
  nextOffset: { x: number; y: number },
  viewport: DOMRect | null,
  nodeCount: number,
) => {
  if (!viewport) {
    return { x: 0, y: 0 };
  }
  const { minX, maxX } = getPanLimits(nodeCount, viewport);

  return {
    x: clamp(nextOffset.x, minX, maxX),
    y: 0,
  };
};
