import chapterData from './ChapterData.json';
import {MapEncounterType, ChapterTheme} from './mapNode';
interface RawNodeWave {
  id: string;
  label?: string;
  monsters: { monsterId: string; }[];
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
  monsters: { monsterId: string; }[];
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
// the JSON file is untyped, so we need to coerce its values to the
// strongly‑typed definitions we expect.  In particular `theme` comes
// through as a plain string and must be narrowed to the `ChapterTheme`
// union, and the same goes for `encounterType`.
const rawChapters = chapterData.MAP_CHAPTERS as RawMapChapter[];
export const MAP_CHAPTERS: MapChapterDef[] = rawChapters.map((ch) => ({
  ...ch,
  theme: ch.theme as ChapterTheme,
  nodes: ch.nodes.map((n) => ({
    ...n,
    encounterType: n.encounterType as MapEncounterType,
  })),
}));