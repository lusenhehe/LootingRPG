import { INITIAL_STATE } from '../config/gameConfig';
import { PLAYER_GROWTH } from '../constants/settings';
import { STAT_KEY_MAP } from '../constants/game';
import type { GameState } from '../types/game';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace('%', '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const recalculatePlayerStats = (state: GameState): GameState => {
  const next = structuredClone(state);

  const level = Math.max(1, next.玩家状态.等级);
  const baseAttack = INITIAL_STATE.玩家状态.攻击力 + (level - 1) * PLAYER_GROWTH.attackPerLevel;
  const baseHp = INITIAL_STATE.玩家状态.生命值 + (level - 1) * PLAYER_GROWTH.hpPerLevel;
  const baseDefense = INITIAL_STATE.玩家状态.防御力 + (level - 1) * PLAYER_GROWTH.defensePerLevel;
  const baseCritRate = toNumber(`${PLAYER_GROWTH.baseCritRate}`);

  let attackBonus = 0;
  let hpBonus = 0;
  let defenseBonus = 0;
  let critBonus = 0;
  let damageBonusPercent = 0;
  let lifestealPercent = 0;
  let thornsPercent = 0;
  let elementalBonus = 0;
  let attackSpeedBonus = 0;

  Object.values(next.当前装备).forEach((item) => {
    if (!item) return;
    Object.entries(item.属性).forEach(([statName, value]) => {
      const statValue = toNumber(value);
      const normalized = STAT_KEY_MAP[statName] ?? statName;
      if (normalized === 'attack') attackBonus += statValue;
      if (normalized === 'hp') hpBonus += statValue;
      if (normalized === 'defense') defenseBonus += statValue;
      if (normalized === 'crit') critBonus += statValue;
      if (normalized === 'elemental') elementalBonus += statValue;
      if (normalized === 'attackSpeed') attackSpeedBonus += statValue;
      if (normalized === 'lifesteal') lifestealPercent += statValue;
    });

    item.affixes.forEach((affix) => {
      if (affix.type === 'crit_chance') critBonus += affix.value;
      if (affix.type === 'lifesteal') lifestealPercent += affix.value;
      if (affix.type === 'damage_bonus') damageBonusPercent += affix.value;
      if (affix.type === 'thorns') thornsPercent += affix.value;
      if (affix.type === 'hp_bonus') hpBonus += affix.value;
    });
  });

  const attackBeforeMultiplier = Math.max(1, baseAttack + attackBonus);
  const finalAttack = Math.floor(attackBeforeMultiplier * (1 + Math.max(0, damageBonusPercent) / 100));
  const crit = Math.max(0, Math.round((baseCritRate + critBonus) * 10) / 10);

  next.玩家状态.攻击力 = Math.max(1, finalAttack);
  next.玩家状态.生命值 = Math.max(1, Math.floor(baseHp + hpBonus));
  next.玩家状态.防御力 = Math.max(0, Math.floor(baseDefense + defenseBonus));
  next.玩家状态.暴击率 = `${crit}`;
  next.玩家状态.伤害加成 = Math.max(0, Math.round(damageBonusPercent));
  next.玩家状态.吸血 = Math.max(0, Math.round(lifestealPercent));
  next.玩家状态.反伤 = Math.max(0, Math.round(thornsPercent));
  next.玩家状态.元素伤害 = Math.max(0, Math.round(elementalBonus));
  next.玩家状态.攻击速度 = Math.max(0, Math.round(attackSpeedBonus));

  return next;
};
