import type { EntityStats } from '../../../shared/types/game';
import type { Monster } from '../../../config/game/monsterSchema';
import { SCALING_PROFILES } from '../../../config/game/monsterSchema';
import { BASELINE_STATS } from '../../../config/game/monsterSchema';
export const getMapMonsterBaselineByLevel = (recommendedLevel: number): EntityStats => {
  const level = Math.max(1, recommendedLevel);
  return {
    // 基础数值 = 基线数值 + (等级 - 1) * 等差增长
    hp:      Math.floor(BASELINE_STATS.hp.baseline      + (level - 1) * BASELINE_STATS.hp.levelAdder),
    attack:  Math.floor(BASELINE_STATS.attack.baseline  + (level - 1) * BASELINE_STATS.attack.levelAdder),
    defense: Math.floor(BASELINE_STATS.defense.baseline + (level - 1) * BASELINE_STATS.defense.levelAdder),
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
