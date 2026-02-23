import type { Monster } from '../../types/game';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA } from './monsterConfigAdapter';
import { attachMonsterLore } from './monsterLoreAdapter';

export const NORMAL_MONSTERS: Monster[] = NORMAL_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
export const BOSS_MONSTERS: Monster[] = BOSS_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
