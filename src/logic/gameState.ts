import { INITIAL_STATE, QUALITY_KEY_MAP, SLOT_KEY_MAP, STAT_KEY_MAP } from '../constants/game';
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

const normalizeEquipment = (item: Equipment): Equipment => {
  // translate quality/slot from legacy Chinese if necessary
  const quality = QUALITY_KEY_MAP[item.品质] ?? item.品质;
  const slot = SLOT_KEY_MAP[item.部位] ?? item.部位;

  // convert attribute keys if they are Chinese
  const attrs: Record<string, number> = {};
  Object.entries(item.属性).forEach(([k, v]) => {
    const key = STAT_KEY_MAP[k] ?? k;
    attrs[key] = v;
  });

  // also ensure 主属性 key normalized
  let main = item.主属性;
  if (main && STAT_KEY_MAP[main]) main = STAT_KEY_MAP[main];

  return {
    ...item,
    等级: Math.max(1, Number((item as any).等级) || 1),
    品质: quality,
    部位: slot,
    icon: item.icon || getDefaultEquipmentIcon(slot),
    属性: attrs,
    主属性: main,
    affixes: Array.isArray(item.affixes) ? item.affixes : [],
  };
};

export const normalizeGameState = (state: GameState): GameState => {
  const normalizedBackpack = state.背包.map((item) => ({ ...normalizeEquipment(item), 已装备: false }));
  const normalizedCurrent = Object.fromEntries(
    Object.entries(state.当前装备).map(([slot, item]) => {
      // convert any legacy Chinese slot keys to english so runtime state stays consistent
      const key = SLOT_KEY_MAP[slot] ?? slot;
      return [key, item ? { ...normalizeEquipment(item), 已装备: true } : null];
    }),
  ) as Record<string, Equipment | null>;

  return {
    ...state,
    背包: normalizedBackpack,
    当前装备: normalizedCurrent,
  };
};
