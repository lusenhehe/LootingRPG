import chapterData from '@data/config/map/ChapterData.json';
import { MapEncounterType, ChapterTheme } from '../../../config/map/mapNode';

interface RawNodeWave {
  id: string;
  label?: string;
  monsters: { monsterId: string }[];
}

interface RawMapNode {
  id: string;
  name: string;
  recommendedLevel: number;
  encounterType: string;
  firstClearRewardGold: number;
  waves?: RawNodeWave[];
}

interface RawMapChapter {
  id: string;
  name: string;
  levelRange: string;
  theme: string;
  nodes: RawMapNode[];
}

export interface NodeWave {
  id: string;
  label?: string;
  monsters: { monsterId: string }[];
}

export interface MapNodeDef {
  id: string;
  name: string;
  recommendedLevel: number;
  encounterType: MapEncounterType;
  firstClearRewardGold: number;
  waves?: NodeWave[];
}

export interface MapChapterDef {
  id: string;
  name: string;
  levelRange: string;
  theme: ChapterTheme;
  nodes: MapNodeDef[];
}

const rawChapters = chapterData.MAP_CHAPTERS as RawMapChapter[];

export const MAP_CHAPTERS: MapChapterDef[] = rawChapters.map((chapter) => ({
  ...chapter,
  theme: chapter.theme as ChapterTheme,
  nodes: chapter.nodes.map((node) => ({
    ...node,
    encounterType: node.encounterType as MapEncounterType,
  })),
}));
