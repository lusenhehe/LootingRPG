import type { MapNodeDef } from '../model/chapters';
import type { PlayerStats } from '../../../shared/types/game';

export type PowerState = 'advantage' | 'matched' | 'danger';
export type DropTier = 'common' | 'rare' | 'low' | 'unknown';

export const getRecommendedPower = (node: MapNodeDef, wavesCount: number, monstersCount: number): number => {
  return Math.round(
    (node.recommendedLevel * 42 + monstersCount * 24 + wavesCount * 36) *
      (node.encounterType === 'boss' ? 1.35 : node.encounterType === 'elite' ? 1.15 : 1),
  );
};

export const getPlayerPower = (stats: PlayerStats): number => {
  return Math.round(stats.attack * 24 + stats.defense * 18 + stats.hp * 0.45 + stats.level * 30);
};

export const getPowerState = (playerPower: number, recommendedPower: number): PowerState => {
  if (recommendedPower <= 0) return 'matched';
  const ratio = playerPower / recommendedPower;
  if (ratio >= 1.2) return 'advantage';
  if (ratio >= 0.9) return 'matched';
  return 'danger';
};

export const getThreatStars = (node: MapNodeDef, wavesCount: number, monstersCount: number): number => {
  let score = node.encounterType === 'boss' ? 3 : node.encounterType === 'elite' ? 2 : 1;
  if (wavesCount >= 4) score += 1;
  if (monstersCount >= 6) score += 1;
  return Math.min(3, score);
};

export const getDropTier = (weight?: number): DropTier => {
  if (typeof weight !== 'number' || !Number.isFinite(weight)) return 'unknown';
  if (weight < 8) return 'low';
  if (weight < 25) return 'rare';
  return 'common';
};
