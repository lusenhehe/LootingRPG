import { MapEncounterType } from '../../../config/mapChapters';

export const encounterBadge: Record<MapEncounterType, string> = {
  normal: 'border-stone-500/50 bg-stone-600/15 text-stone-300',
  elite: 'border-amber-700/50 bg-amber-800/15 text-amber-400',
  boss: 'border-red-900/50 bg-red-950/15 text-red-400',
  wave: 'border-emerald-800/50 bg-emerald-900/15 text-emerald-400',
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
    islandGradient: 'from-stone-900 via-stone-800 to-stone-950',
    terrainTop: 'from-emerald-800 via-emerald-700 to-teal-900',
    glowColor: 'rgba(5, 150, 105, 0.3)',
    shadowColor: 'rgba(6, 78, 59, 0.4)',
    accentColor: 'emerald',
    particles: { color: 'bg-emerald-700', size: 'w-1 h-1', count: 4 },
  },
  '地牢': {
    islandGradient: 'from-stone-950 via-stone-900 to-stone-950',
    terrainTop: 'from-stone-700 via-stone-600 to-stone-800',
    glowColor: 'rgba(87, 83, 78, 0.35)',
    shadowColor: 'rgba(41, 37, 36, 0.5)',
    accentColor: 'stone',
    particles: { color: 'bg-stone-600', size: 'w-1 h-1', count: 3 },
  },
  '火山': {
    islandGradient: 'from-stone-950 via-red-950 to-stone-950',
    terrainTop: 'from-orange-900 via-red-900 to-amber-950',
    glowColor: 'rgba(180, 83, 9, 0.4)',
    shadowColor: 'rgba(153, 27, 27, 0.45)',
    accentColor: 'orange',
    particles: { color: 'bg-orange-900', size: 'w-1.5 h-1.5', count: 5 },
  },
  '亡灵': {
    islandGradient: 'from-stone-950 via-stone-900 to-stone-950',
    terrainTop: 'from-stone-700 via-stone-600 to-stone-800',
    glowColor: 'rgba(63, 63, 70, 0.35)',
    shadowColor: 'rgba(24, 24, 28, 0.5)',
    accentColor: 'stone',
    particles: { color: 'bg-stone-600', size: 'w-1 h-2', count: 4 },
  },
  '风暴': {
    islandGradient: 'from-stone-950 via-slate-900 to-stone-950',
    terrainTop: 'from-slate-700 via-slate-600 to-slate-800',
    glowColor: 'rgba(71, 85, 105, 0.35)',
    shadowColor: 'rgba(30, 41, 59, 0.5)',
    accentColor: 'slate',
    particles: { color: 'bg-slate-600', size: 'w-0.5 h-2', count: 6 },
  },
  '机械': {
    islandGradient: 'from-stone-950 via-stone-900 to-stone-950',
    terrainTop: 'from-amber-900 via-yellow-900 to-orange-950',
    glowColor: 'rgba(180, 83, 9, 0.35)',
    shadowColor: 'rgba(146, 64, 14, 0.45)',
    accentColor: 'amber',
    particles: { color: 'bg-amber-900', size: 'w-1 h-1', count: 5 },
  },
  '晶体': {
    islandGradient: 'from-stone-950 via-stone-900 to-stone-950',
    terrainTop: 'from-purple-900 via-violet-900 to-stone-950',
    glowColor: 'rgba(126, 34, 206, 0.3)',
    shadowColor: 'rgba(88, 28, 135, 0.4)',
    accentColor: 'purple',
    particles: { color: 'bg-purple-900', size: 'w-2 h-1', count: 5 },
  },
  '虚空': {
    islandGradient: 'from-stone-950 via-zinc-900 to-stone-950',
    terrainTop: 'from-zinc-800 via-zinc-700 to-zinc-900',
    glowColor: 'rgba(63, 63, 70, 0.3)',
    shadowColor: 'rgba(24, 24, 28, 0.45)',
    accentColor: 'zinc',
    particles: { color: 'bg-zinc-700', size: 'w-1 h-3', count: 6 },
  },
  '星空': {
    islandGradient: 'from-stone-950 via-stone-900 to-stone-950',
    terrainTop: 'from-indigo-900 via-blue-900 to-stone-950',
    glowColor: 'rgba(49, 46, 129, 0.3)',
    shadowColor: 'rgba(30, 27, 75, 0.4)',
    accentColor: 'indigo',
    particles: { color: 'bg-indigo-900', size: 'w-1 h-1', count: 8 },
  },
  '终焉': {
    islandGradient: 'from-red-950 via-stone-950 to-stone-950',
    terrainTop: 'from-red-950 via-red-900 to-stone-950',
    glowColor: 'rgba(153, 27, 27, 0.4)',
    shadowColor: 'rgba(127, 29, 29, 0.5)',
    accentColor: 'red',
    particles: { color: 'bg-red-900', size: 'w-1.5 h-1.5', count: 6 },
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
    glowFilter: 'drop-shadow(0 0 8px rgba(180, 83, 9, 0.4))',
  },
  ready: {
    overlay: '',
    glowFilter: 'drop-shadow(0 0 12px rgba(5, 150, 105, 0.5))',
  },
  cleared: {
    overlay: 'opacity-75',
    glowFilter: 'drop-shadow(0 0 6px rgba(180, 83, 9, 0.35))',
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
