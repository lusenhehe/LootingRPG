import type { BattleRegion, BattleRisk } from './game';

export type MapEncounterType = 'normal' | 'boss' | 'wave';

export interface MapNode {
  id: string;
  chapterId: string;
  order: number;
  name: string;
  description: string;
  encounterType: MapEncounterType;
  region: BattleRegion;
  risk: BattleRisk;
  spawnMultiplier: number;
  waveSize?: number;
  recommendedLevel: number;
  firstClearRewardGold: number;
  nextNodeIds: string[];
}

export interface MapChapter {
  id: string;
  order: number;
  name: string;
  description: string;
  nodeIds: string[];
}

export interface MapProgressState {
  currentNodeId: string;
  unlockedNodeIds: string[];
  clearedNodeIds: string[];
  failedNodeIds: Record<string, number>;
  firstClearRewardClaimedIds: string[];
}