import nodeShapes from '../../../config/map/nodeShapes.json';
import type { ChapterTheme } from '../../../config/map/mapNode';
import { MAP_CHAPTERS } from '../../../config/map/ChapterData';

type ThemeKey = keyof typeof nodeShapes;

const orderedThemes = Array.from(new Set(MAP_CHAPTERS.map((chapter) => chapter.theme))) as ThemeKey[];
const [forestTheme, dungeonTheme, volcanoTheme, undeadTheme] =
  orderedThemes.length >= 4
    ? orderedThemes
    : (Object.keys(nodeShapes) as ThemeKey[]);


export interface ChapterThemeStyle {
  islandGradient: string;
  terrainTop: string;
  glowColor: string;
  shadowColor: string;
  accentColor: string;
  particles: { color: string; size: string; count: number };
  background: string;
  nodeShape: string;
  nodeEffects: {
    normal: string;
    elite: string;
    boss: string;
  };
  pathColor: string;
}
export const chapterThemeStyles = {
  [forestTheme]: {
    islandGradient: 'from-emerald-950 via-red-900 to-black',
    terrainTop: 'from-emerald-900 via-red-800 to-stone-900',
    glowColor: 'rgba(180, 40, 40, 0.4)',
    shadowColor: 'rgba(120, 30, 30, 0.3)',
    accentColor: 'emerald',
    particles: { color: 'bg-red-600', size: 'w-1 h-1', count: 4 },
    background: `
      radial-gradient(ellipse at 20% 30%, rgba(30, 80, 30, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 80% 70%, rgba(60, 20, 20, 0.25) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(20, 10, 10, 0.4) 0%, transparent 60%),
      linear-gradient(180deg, #050805 0%, #0a0808 50%, #050505 100%)
    `,
    nodeShape: 'clip-path-forest',
    nodeEffects: nodeShapes[forestTheme],
    pathColor: 'rgb(100, 50, 30)',
  },
  [dungeonTheme]: {
    islandGradient: 'from-stone-950 via-red-950 to-black',
    terrainTop: 'from-stone-800 via-red-900 to-black',
    glowColor: 'rgba(150, 40, 40, 0.4)',
    shadowColor: 'rgba(100, 30, 30, 0.3)',
    accentColor: 'slate',
    particles: { color: 'bg-red-500', size: 'w-1 h-1', count: 3 },
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(40, 40, 45, 0.3) 0%, transparent 35%),
      radial-gradient(ellipse at 70% 80%, rgba(30, 20, 20, 0.35) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(15, 15, 20, 0.5) 0%, transparent 55%),
      linear-gradient(180deg, #080808 0%, #0c0a0a 50%, #060606 100%)
    `,
    nodeShape: 'clip-path-dungeon',
    nodeEffects: nodeShapes[dungeonTheme],
    pathColor: 'rgb(80, 70, 60)',
  },
  [volcanoTheme]: {
    islandGradient: 'from-stone-950 via-red-950 to-black',
    terrainTop: 'from-orange-900 via-red-900 to-stone-950',
    glowColor: 'rgba(200, 60, 20, 0.5)',
    shadowColor: 'rgba(180, 40, 20, 0.35)',
    accentColor: 'orange',
    particles: { color: 'bg-red-600', size: 'w-1.5 h-1.5', count: 5 },
    background: `
      radial-gradient(ellipse at 30% 10%, rgba(200, 60, 10, 0.25) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 85%, rgba(120, 30, 10, 0.3) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 40%, rgba(80, 20, 10, 0.35) 0%, transparent 50%),
      linear-gradient(180deg, #0a0505 0%, #120808 50%, #080404 100%)
    `,
    nodeShape: 'clip-path-volcano',
    nodeEffects: nodeShapes[volcanoTheme],
    pathColor: 'rgb(180, 60, 20)',
  },
  [undeadTheme]: {
    islandGradient: 'from-slate-950 via-red-950 to-black',
    terrainTop: 'from-red-900 via-red-900 to-stone-950',
    glowColor: 'rgba(160, 50, 100, 0.4)',
    shadowColor: 'rgba(120, 30, 60, 0.3)',
    accentColor: 'purple',
    particles: { color: 'bg-rose-700', size: 'w-1 h-2', count: 4 },
    background: `
      radial-gradient(ellipse at 25% 15%, rgba(80, 20, 80, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 75% 85%, rgba(40, 10, 50, 0.25) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(30, 5, 40, 0.4) 0%, transparent 55%),
      linear-gradient(180deg, #050308 0%, #08050a 50%, #040205 100%)
    `,
    nodeShape: 'clip-path-undead',
    nodeEffects: nodeShapes[undeadTheme],
    pathColor: 'rgb(120, 40, 80)',
  },
} as Record<ChapterTheme, ChapterThemeStyle>;

export const getNodeState = (
  unlocked: boolean, cleared: boolean, playerLevel: number, nodeLevel: number,
): 'locked' | 'warning' | 'ready' | 'cleared' => {
  if (!unlocked) return 'locked';
  if (cleared) return 'cleared';
  if (playerLevel < nodeLevel) return 'warning';
  return 'ready';
};

export const stateOverlayStyles = {
  locked: { overlay: 'opacity-35', glowFilter: 'none', },
  warning: { overlay: '', glowFilter: 'drop-shadow(0 0 8px rgba(200, 100, 30, 0.5))'},
  ready: { overlay: '', glowFilter: 'drop-shadow(0 0 12px rgba(180, 40, 40, 0.7))'},
  cleared: { overlay: 'opacity-70', glowFilter: 'drop-shadow(0 0 6px rgba(180, 50, 50, 0.5))'},
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
  const firstX = getZigzagNodePosition(0).x;
  const lastX = getZigzagNodePosition(nodeCount - 1).x;
  const sidePadding = 12;

  const minX = ((50 - (lastX + sidePadding)) / 100) * viewport.width;
  const maxX = ((50 - (firstX - sidePadding)) / 100) * viewport.width;

  return { minX, maxX };
};

export const clampMapOffset = ( nextOffset: { x: number; y: number }, viewport: DOMRect | null, nodeCount: number) => {
  if (!viewport) return { x: 0, y: 0 };
  const { minX, maxX } = getPanLimits(nodeCount, viewport);
  return { x: clamp(nextOffset.x, minX, maxX), y: 0,};
};
