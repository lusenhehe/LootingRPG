import type { Monster, MonsterBaseStats, MonsterScalingProfile } from '../../../types/game';
export interface MapMonsterBaseline {
  hp: number;
  attack: number;
  defense: number;
}
export const SCALING_PROFILES: Record<MonsterScalingProfile, MonsterBaseStats> = {
  normal: { hp: 1.0, attack: 1.0, defense: 1.0 },
  tank: { hp: 1.4, attack: 0.8, defense: 1.2 },
  glass: { hp: 0.7, attack: 1.5, defense: 0.6 },
  bruiser: { hp: 1.2, attack: 1.2, defense: 0.9 },
  striker: { hp: 0.9, attack: 1.3, defense: 0.8 },
  boss: { hp: 1.8, attack: 1.3, defense: 1.25 },
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const getMapMonsterBaselineByLevel = (recommendedLevel: number): MapMonsterBaseline => {
  const level = Math.max(1, recommendedLevel);
  return {
    hp: Math.floor(120 + (level - 1) * 14),
    attack: Math.floor(16 + (level - 1) * 1.35),
    defense: Math.floor(7 + (level - 1) * 0.72),
  };
};

const normalizeBaseStats = (baseStats?: MonsterBaseStats): MonsterBaseStats => {
  if (!baseStats) {
    return { hp: 1, attack: 1, defense: 1 };
  }
  return {
    hp: clamp(baseStats.hp, 0.2, 4),
    attack: clamp(baseStats.attack, 0.2, 4),
    defense: clamp(baseStats.defense, 0.2, 4),
  };
};

export const resolveMonsterTemplateStats = (
  monster: Pick<Monster, 'baseStats' | 'scalingProfile'>,
  mapBaseline: MapMonsterBaseline,
): { maxHp: number; attack: number; defense: number } => {
  const baseStats = normalizeBaseStats(monster.baseStats);
  const profile = SCALING_PROFILES[monster.scalingProfile] ?? SCALING_PROFILES.normal;

  return {
    maxHp: Math.max(1, Math.floor(mapBaseline.hp * baseStats.hp * profile.hp)),
    attack: Math.max(1, Math.floor(mapBaseline.attack * baseStats.attack * profile.attack)),
    defense: Math.max(0, Math.floor(mapBaseline.defense * baseStats.defense * profile.defense)),
  };
};
