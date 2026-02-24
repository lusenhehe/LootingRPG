import { INITIAL_STATE } from '../config/gameConfig';
import { PLAYER_GROWTH } from '../config/game/progression';
import type { GameState } from '../types/game';
import { getEquipmentTotals } from './equipmentUtils';
export const recalculatePlayerStats = (state: GameState): GameState => {
  //#region 计算玩家属性的核心函数，基于当前装备和等级来重新计算攻击力、生命值、防御力等。
  const next = structuredClone(state);
  const level = next.playerStats.level;
  const baseAttack   = INITIAL_STATE.playerStats.attack  + (level - 1) * PLAYER_GROWTH.attackPerLevel;
  const baseHp       = INITIAL_STATE.playerStats.hp      + (level - 1) * PLAYER_GROWTH.hpPerLevel;
  const baseDefense  = INITIAL_STATE.playerStats.defense + (level - 1) * PLAYER_GROWTH.defensePerLevel;
  const baseCritRate = Number(PLAYER_GROWTH.baseCritRate);
  //#endregion
  //#region 遍历当前装备的属性和词缀，累加各种加成到对应的属性上。
  let attackBonus = 0;
  let hpBonus = 0;
  let defenseBonus = 0;
  let critBonus = 0;
  let damageBonusPercent = 0;
  let lifestealPercent = 0;
  let thornsPercent = 0;
  let elementalBonus = 0;
  let attackSpeedBonus = 0;

  const { attributes, affixes } = getEquipmentTotals(next.currentEquipment); 
  attackBonus      += attributes.attack || 0;
  hpBonus          += attributes.hp || 0;
  defenseBonus     += attributes.defense || 0;
  critBonus        += attributes.crit || 0;
  elementalBonus   += attributes.elemental || 0;
  attackSpeedBonus += attributes.attackSpeed || 0;
  lifestealPercent += attributes.lifesteal || 0;

  critBonus          += affixes.crit_chance || 0;
  lifestealPercent   += affixes.lifesteal || 0;
  damageBonusPercent += affixes.damage_bonus || 0;
  thornsPercent      += affixes.thorns || 0;
  hpBonus            += affixes.hp_bonus || 0;
  //#endregion
  
  const crit = Math.max(0, Math.round((baseCritRate + critBonus) * 10) / 10);
  const attackBeforeMultiplier = baseAttack + attackBonus;
  const finalAttack = Math.floor(attackBeforeMultiplier * (1 + Math.max(0, damageBonusPercent) / 100));

  next.playerStats.attack = finalAttack;
  next.playerStats.hp = Math.floor(baseHp + hpBonus);
  next.playerStats.defense = Math.max(0, Math.floor(baseDefense + defenseBonus));
  next.playerStats.critRate = `${crit}`;
  next.playerStats.damageBonus = Math.max(0, Math.round(damageBonusPercent));
  next.playerStats.lifesteal = Math.max(0, Math.round(lifestealPercent));
  next.playerStats.thorns = Math.max(0, Math.round(thornsPercent));
  next.playerStats.elemental = Math.max(0, Math.round(elementalBonus));
  next.playerStats.attackSpeed = Math.max(0, Math.round(attackSpeedBonus));

  return next;
};
