import { MapEncounterType } from '../../../logic/adapters/mapChapterAdapter';

export const encounterBadge: Record<MapEncounterType, string> = {
  normal: 'border-red-800/50 bg-red-950/40 text-red-300',
  elite: 'border-amber-900/50 bg-amber-950/40 text-amber-300',
  boss: 'border-rose-900/50 bg-rose-950/50 text-rose-300',
  wave: 'border-emerald-900/50 bg-emerald-950/40 text-emerald-300',
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
    wave: string;
  };
  pathColor: string;
}

const getForestShapes = () => ({
  normal: 'rounded-lg clip-path-forest',
  elite: 'rotate-45 rounded-sm clip-path-forest-elite',
  boss: 'rounded-2xl clip-path-forest-boss',
  wave: 'rounded-xl clip-path-forest-wave',
});

const getDungeonShapes = () => ({
  normal: 'rounded-sm clip-path-dungeon',
  elite: 'clip-path-dungeon-elite',
  boss: 'clip-path-dungeon-boss',
  wave: 'rounded-lg clip-path-dungeon-wave',
});

const getVolcanoShapes = () => ({
  normal: 'rounded-tl-3xl rounded-br-3xl clip-path-volcano',
  elite: 'clip-path-volcano-elite',
  boss: 'clip-path-volcano-boss',
  wave: 'rounded-2xl clip-path-volcano-wave',
});

const getUndeadShapes = () => ({
  normal: 'rounded-xl clip-path-undead',
  elite: 'clip-path-undead-elite',
  boss: 'clip-path-undead-boss',
  wave: 'clip-path-undead-wave',
});

const getStormShapes = () => ({
  normal: 'rounded-full clip-path-storm',
  elite: 'clip-path-storm-elite',
  boss: 'clip-path-storm-boss',
  wave: 'clip-path-storm-wave',
});

const getMechanicalShapes = () => ({
  normal: 'clip-path-mechanical',
  elite: 'rotate-45 clip-path-mechanical-elite',
  boss: 'clip-path-mechanical-boss',
  wave: 'clip-path-mechanical-wave',
});

const getCrystalShapes = () => ({
  normal: 'clip-path-crystal',
  elite: 'clip-path-crystal-elite',
  boss: 'clip-path-crystal-boss',
  wave: 'clip-path-crystal-wave',
});

const getVoidShapes = () => ({
  normal: 'rounded-full clip-path-void',
  elite: 'clip-path-void-elite',
  boss: 'clip-path-void-boss',
  wave: 'clip-path-void-wave',
});

const getCosmicShapes = () => ({
  normal: 'rounded-xl clip-path-cosmic',
  elite: 'clip-path-cosmic-elite',
  boss: 'clip-path-cosmic-boss',
  wave: 'clip-path-cosmic-wave',
});

const getApocalypseShapes = () => ({
  normal: 'clip-path-apocalypse',
  elite: 'clip-path-apocalypse-elite',
  boss: 'clip-path-apocalypse-boss',
  wave: 'clip-path-apocalypse-wave',
});

export const chapterThemeStyles: Record<ChapterTheme, ChapterThemeStyle> = {
  '林地': {
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
    nodeEffects: getForestShapes(),
    pathColor: 'rgb(100, 50, 30)',
  },
  '地牢': {
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
    nodeEffects: getDungeonShapes(),
    pathColor: 'rgb(80, 70, 60)',
  },
  '火山': {
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
    nodeEffects: getVolcanoShapes(),
    pathColor: 'rgb(180, 60, 20)',
  },
  '亡灵': {
    islandGradient: 'from-slate-950 via-purple-950 to-black',
    terrainTop: 'from-purple-900 via-red-900 to-stone-950',
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
    nodeEffects: getUndeadShapes(),
    pathColor: 'rgb(120, 40, 80)',
  },
  '风暴': {
    islandGradient: 'from-slate-950 via-red-900 to-black',
    terrainTop: 'from-slate-700 via-red-800 to-stone-950',
    glowColor: 'rgba(100, 120, 140, 0.45)',
    shadowColor: 'rgba(80, 30, 30, 0.3)',
    accentColor: 'cyan',
    particles: { color: 'bg-slate-500', size: 'w-0.5 h-2', count: 6 },
    background: `
      radial-gradient(ellipse at 20% 10%, rgba(40, 60, 80, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 80% 90%, rgba(20, 30, 50, 0.25) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(15, 20, 30, 0.4) 0%, transparent 55%),
      linear-gradient(180deg, #050810 0%, #080c14 50%, #04060c 100%)
    `,
    nodeShape: 'clip-path-storm',
    nodeEffects: getStormShapes(),
    pathColor: 'rgb(60, 80, 100)',
  },
  '机械': {
    islandGradient: 'from-zinc-950 via-red-950 to-black',
    terrainTop: 'from-amber-900 via-red-900 to-stone-950',
    glowColor: 'rgba(180, 100, 20, 0.45)',
    shadowColor: 'rgba(150, 60, 20, 0.3)',
    accentColor: 'amber',
    particles: { color: 'bg-amber-700', size: 'w-1 h-1', count: 5 },
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(60, 50, 30, 0.2) 0%, transparent 35%),
      radial-gradient(ellipse at 70% 80%, rgba(40, 30, 20, 0.25) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 50%, rgba(25, 20, 15, 0.4) 0%, transparent 50%),
      linear-gradient(180deg, #0a0908 0%, #0c0a08 50%, #080706 100%)
    `,
    nodeShape: 'clip-path-mechanical',
    nodeEffects: getMechanicalShapes(),
    pathColor: 'rgb(140, 100, 40)',
  },
  '晶体': {
    islandGradient: 'from-violet-950 via-red-950 to-black',
    terrainTop: 'from-fuchsia-900 via-red-900 to-stone-950',
    glowColor: 'rgba(200, 60, 150, 0.5)',
    shadowColor: 'rgba(150, 40, 80, 0.35)',
    accentColor: 'fuchsia',
    particles: { color: 'bg-rose-700', size: 'w-2 h-1', count: 5 },
    background: `
      radial-gradient(ellipse at 25% 15%, rgba(150, 40, 150, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 75% 85%, rgba(80, 20, 100, 0.2) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(50, 10, 60, 0.35) 0%, transparent 55%),
      linear-gradient(180deg, #080510 0%, #0a0812 50%, #06040c 100%)
    `,
    nodeShape: 'clip-path-crystal',
    nodeEffects: getCrystalShapes(),
    pathColor: 'rgb(180, 80, 140)',
  },
  '虚空': {
    islandGradient: 'from-indigo-950 via-purple-950 to-black',
    terrainTop: 'from-indigo-900 via-red-900 to-stone-950',
    glowColor: 'rgba(120, 100, 200, 0.4)',
    shadowColor: 'rgba(80, 40, 100, 0.3)',
    accentColor: 'indigo',
    particles: { color: 'bg-purple-600', size: 'w-1 h-3', count: 6 },
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(80, 60, 150, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 80%, rgba(40, 30, 100, 0.2) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(20, 15, 50, 0.35) 0%, transparent 55%),
      linear-gradient(180deg, #050510 0%, #08080a 50%, #040408 100%)
    `,
    nodeShape: 'clip-path-void',
    nodeEffects: getVoidShapes(),
    pathColor: 'rgb(100, 80, 160)',
  },
  '星空': {
    islandGradient: 'from-slate-950 via-red-950 to-black',
    terrainTop: 'from-blue-900 via-red-900 to-stone-950',
    glowColor: 'rgba(100, 80, 180, 0.4)',
    shadowColor: 'rgba(80, 40, 100, 0.25)',
    accentColor: 'blue',
    particles: { color: 'bg-indigo-600', size: 'w-1 h-1', count: 8 },
    background: `
      radial-gradient(ellipse at 20% 10%, rgba(30, 40, 100, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 80% 90%, rgba(20, 20, 60, 0.2) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(15, 15, 40, 0.35) 0%, transparent 55%),
      linear-gradient(180deg, #040810 0%, #06080c 50%, #030408 100%)
    `,
    nodeShape: 'clip-path-cosmic',
    nodeEffects: getCosmicShapes(),
    pathColor: 'rgb(60, 80, 160)',
  },
  '终焉': {
    islandGradient: 'from-red-950 via-rose-950 to-black',
    terrainTop: 'from-rose-900 via-red-950 to-stone-950',
    glowColor: 'rgba(220, 50, 70, 0.5)',
    shadowColor: 'rgba(180, 30, 50, 0.35)',
    accentColor: 'rose',
    particles: { color: 'bg-rose-600', size: 'w-1.5 h-1.5', count: 6 },
    background: `
      radial-gradient(ellipse at 30% 15%, rgba(200, 30, 40, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 85%, rgba(150, 20, 30, 0.25) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(80, 10, 20, 0.4) 0%, transparent 55%),
      linear-gradient(180deg, #0a0205 0%, #100508 50%, #080204 100%)
    `,
    nodeShape: 'clip-path-apocalypse',
    nodeEffects: getApocalypseShapes(),
    pathColor: 'rgb(200, 40, 50)',
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
    overlay: 'opacity-35',
    glowFilter: 'none',
  },
  warning: {
    overlay: '',
    glowFilter: 'drop-shadow(0 0 8px rgba(200, 100, 30, 0.5))',
  },
  ready: {
    overlay: '',
    glowFilter: 'drop-shadow(0 0 12px rgba(180, 40, 40, 0.7))',
  },
  cleared: {
    overlay: 'opacity-70',
    glowFilter: 'drop-shadow(0 0 6px rgba(180, 50, 50, 0.5))',
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
