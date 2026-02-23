import { INITIAL_STATE } from '../constants/game';
import { getDefaultEquipmentIcon } from './equipment';
import type { BattleState, Equipment, GameState } from '../types/game';

export const createFreshInitialState = (): GameState => structuredClone(INITIAL_STATE);

export const createInitialBattleState = (): BattleState => ({
  phase: 'idle',
  currentMonster: null,
  isBossBattle: false,
  playerHpPercent: 100,
  monsterHpPercent: 100,
  showAttackFlash: false,
  playerDamageLabel: null,
  monsterDamageLabel: null,
  playerStatusLabel: null,
  monsterStatusLabel: null,
  elementLabel: null,
  showDropAnimation: false,
  dropLabel: null,
  encounterCount: 0,
});

const normalizeEquipment = (item: Equipment): Equipment => ({
  ...item,
  icon: item.icon || getDefaultEquipmentIcon(item.部位),
  affixes: Array.isArray(item.affixes) ? item.affixes : [],
});

export const normalizeGameState = (state: GameState): GameState => {
  const normalizedBackpack = state.背包.map((item) => ({ ...normalizeEquipment(item), 已装备: false }));
  const normalizedCurrent = Object.fromEntries(
    Object.entries(state.当前装备).map(([slot, item]) =>
      [slot, item ? { ...normalizeEquipment(item), 已装备: true } : null],
    ),
  ) as Record<string, Equipment | null>;

  return {
    ...state,
    背包: normalizedBackpack,
    当前装备: normalizedCurrent,
  };
};
