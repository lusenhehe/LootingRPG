import type { MonsterBaseStats, MonsterScalingProfile, EntityStats } from '../../../shared/types/game';
import type { Monster } from '../../../config/game/monsterSchema';
import { SCALING_PROFILES } from '../../../config/game/monsterSchema';

export const getMapMonsterBaselineByLevel = (recommendedLevel: number): EntityStats => {
  const level = Math.max(1, recommendedLevel);
  return {
    hp: Math.floor(120 + (level - 1) * 14),
    attack: Math.floor(16 + (level - 1) * 1.35),
    defense: Math.floor(7 + (level - 1) * 0.72),
  };
};
export const resolveMonsterTemplateStats = (
  monster: Pick<Monster, 'baseStats' | 'scalingProfile'>,
  mapBaseline: EntityStats,
): { maxHp: number } & EntityStats => {
  const profile = SCALING_PROFILES[monster.scalingProfile] ?? SCALING_PROFILES.normal;
  return {
    maxHp:   Math.floor(mapBaseline.hp      * monster.baseStats.hp      * profile.hp),
    hp :     Math.floor(mapBaseline.hp      * monster.baseStats.hp      * profile.hp),
    attack:  Math.floor(mapBaseline.attack  * monster.baseStats.attack  * profile.attack),
    defense: Math.floor(mapBaseline.defense * monster.baseStats.defense * profile.defense),
  };
};
