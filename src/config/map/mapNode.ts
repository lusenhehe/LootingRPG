import nodeUiConfig from '@data/config/map/mapNode.json';
export type ChapterTheme = typeof nodeUiConfig.chapterNodeStyles extends Record<infer K, unknown> ? K : never;
export interface NodeEncounterStyle {
  shape: string; size: string; iconColor: string; ringColor: string;
  glowColor: string; particleColor: string; bgGradient: string; borderStyle: string;
}
export type MapEncounterType = typeof nodeUiConfig.encounterTypes[number];
export interface ThemeColors { primary: string; primaryLight: string; primaryDark: string;}
export const themeColors: Record<ChapterTheme, ThemeColors> = nodeUiConfig.THEME_COLORS;
export const defaultEncounterStyles: Record<MapEncounterType, NodeEncounterStyle> = nodeUiConfig.defaultEncounterStyles;
export const chapterNodeStyles: Record<ChapterTheme, Record<MapEncounterType, NodeEncounterStyle>> = nodeUiConfig.chapterNodeStyles;
export const MAP_NODE_CONFIG = nodeUiConfig.MAP_NODE_CONFIG as {
  bossIconSize: number;
  normalIconSize: number;
  starCount: Record<MapEncounterType, number>;
  floatDelayBase: number;
  floatDelayIncrement: number;
  animationDuration: { float: number; hover: number; glow: number; particle: number };
  hoverScale: number;
  hoverY: number;
  tapScale: number;
};

export const HEADER_CONFIG = {
  titleSize: 'text-base',
  subtitleSize: 'text-[10px]',
  infoBadgePadding: 'px-2 py-1',
  progressBarHeight: 4,
};

export const themeHeaderColors: Record<ChapterTheme, { primary: string; secondary: string; glow: string; border: string; text: string }> = nodeUiConfig.THEME_HEADER_COLORS;