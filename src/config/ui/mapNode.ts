import type { MapEncounterType, ChapterTheme } from '../map/mapTypes';
import nodeUiConfig from './mapNode.json';

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
};

export const defaultEncounterStyles: Record<MapEncounterType, NodeEncounterStyle> = nodeUiConfig.defaultEncounterStyles;

export const chapterNodeStyles: Record<ChapterTheme, Record<MapEncounterType, NodeEncounterStyle>> = nodeUiConfig.chapterNodeStyles;

export const getChapterNodeStyles = (theme: ChapterTheme): Record<MapEncounterType, NodeEncounterStyle> => {
  return chapterNodeStyles[theme];
};

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

export const themeHeaderColors: Record<ChapterTheme, { primary: string; secondary: string; glow: string; border: string; text: string }> = {
  '林地': { primary: 'emerald', secondary: 'green', glow: 'rgba(16, 150, 100, 0.1)', border: 'emerald-900/30', text: 'emerald' },
  '地牢': { primary: 'stone', secondary: 'zinc', glow: 'rgba(120, 120, 130, 0.1)', border: 'stone-900/30', text: 'stone' },
  '火山': { primary: 'orange', secondary: 'red', glow: 'rgba(200, 100, 20, 0.1)', border: 'orange-900/30', text: 'orange' },
  '亡灵': { primary: 'red', secondary: 'red', glow: 'rgba(150, 30, 30, 0.1)', border: 'red-900/30', text: 'red' },
};

export const getThemeHeaderColors = (theme: ChapterTheme) => {
  return themeHeaderColors[theme] || themeHeaderColors['林地'];
};
