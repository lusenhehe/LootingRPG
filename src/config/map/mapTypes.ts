export type MapEncounterType = 'normal' | 'elite' | 'boss';

// themes used by chapters and UI styling
export type ChapterTheme = '林地' | '地牢' | '火山' | '亡灵';

export interface NodeWave {
  id: string;
  label?: string;
  monsters: { monsterId: string; count?: number }[];
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