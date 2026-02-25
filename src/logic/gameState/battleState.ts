import type { BattleState } from '../../types/game';

/**
 * Creates the initial battle state
 */
export const createInitialBattleState = (): BattleState => ({
  phase: 'idle',
  currentMonsters: [],
  monsterHpPercents: [],
  currentMonster: null,
  isBossBattle: false,
  playerHpPercent: 100,
  monsterHpPercent: 100,
  showAttackFlash: false,
  monsterDamageLabels: [],
  monsterStatusLabels: [],
  playerDamageLabel: null,
  monsterDamageLabel: null,
  playerStatusLabel: null,
  monsterStatusLabel: null,
  elementLabel: null,
  showDropAnimation: false,
  dropLabel: null,
  encounterCount: 0,
});