import type { Monster } from '../../types/game';
import { attachMonsterLore } from './lore';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA } from './config';

export const NORMAL_MONSTERS: Monster[] = NORMAL_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
export const BOSS_MONSTERS: Monster[] = BOSS_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
