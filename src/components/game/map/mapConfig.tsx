import type { ChapterTheme } from '../../../config/map/mapNode';
import { MAP_CHAPTERS } from '../../../config/map/ChapterData';
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
  pathStyle?: {
    type: string;
    strokeColor: string;
    strokeWidth: number;
    clearedColor: string;
    dashed: boolean;
    texture: string;
  };
}
export const chapterThemeStyles: Record<ChapterTheme, ChapterThemeStyle> =
  MAP_CHAPTERS.reduce((acc, chap) => {
    if (chap.ui?.themeStyles) {
      acc[chap.theme] = chap.ui.themeStyles as unknown as ChapterThemeStyle;
    }
    return acc;
  }, {} as Record<ChapterTheme, ChapterThemeStyle>);

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

/**
 * 节点 Canvas 布局常量（单位：像素）
 *  NODE_MARGIN_X   — 第一个节点前 / 最后一个节点后的水平留白
 *  NODE_SPACING_X  — 相邻节点间的水平间距
 *  NODE_Y_EVEN / ODD — 锯齿路径上下两排纵向位置（容器高度的百分比）
 */
export const NODE_MARGIN_X  = 90;
export const NODE_SPACING_X = 165;
const NODE_Y_EVEN = 38;
const NODE_Y_ODD  = 62;

/**
 * 返回第 nodeIndex 个节点的位置：
 *   x — 画布（canvas）内的绝对像素横坐标
 *   y — 容器高度的百分比（用于 CSS top: `${y}%`）
 */
export const getZigzagNodePosition = (nodeIndex: number) => ({
  x: NODE_MARGIN_X + nodeIndex * NODE_SPACING_X,
  y: nodeIndex % 2 === 0 ? NODE_Y_EVEN : NODE_Y_ODD,
});

/** 画布所需的像素宽度（含两端留白） */
export const getCanvasWidth = (nodeCount: number) =>
  NODE_MARGIN_X * 2 + Math.max(0, nodeCount - 1) * NODE_SPACING_X;

export const clampMapOffset = (
  nextOffset: { x: number; y: number },
  viewport: DOMRect | null,
  nodeCount: number,
) => {
  if (!viewport) return { x: 0, y: 0 };
  const canvasW = getCanvasWidth(nodeCount);
  // offset.x 最大 0（画布左端对齐视口左端），最小使画布右端不超出视口右端
  const minX = Math.min(0, viewport.width - canvasW);
  const maxX = 0;
  return { x: clamp(nextOffset.x, minX, maxX), y: 0 };
};
