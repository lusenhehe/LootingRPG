import type { CounterStatKey, Monster } from '../../../types/game';
import type { FinalPlayerCombatStats } from '../../player/model/combat';
import { getCombatProfile } from '../../player/model/combat';
import i18n from '../../../i18n';
import { getMapNodeById } from '../../map/services/nodeLookup';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './monsterScaling';

export interface FinalMonsterCombatStats {
  maxHp: number;
  attack: number;
  defense: number;
  damageReduction: number;
  shieldReduction: number;
  rageMultiplier: number;
  bossSkillInterval: number;
  statusProcMultiplier: number;
  objectiveLabel: string | null;
  objectivePassed: boolean;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const defenseToReductionRate = (
  defenseValue: number,
  hardCapRate: number,
  growthRate: number,
): number => {
  const normalized = Math.max(0, defenseValue);
  const rate = 1 - Math.exp(-growthRate * normalized);
  return clamp(rate, 0, hardCapRate);
};

const readPlayerCounterStat = (player: FinalPlayerCombatStats, stat: CounterStatKey): number => {
  if (stat === 'attack') return player.attack;
  if (stat === 'defense') return player.defense;
  if (stat === 'hp') return player.maxHp;
  if (stat === 'elemental') return player.elementalBonus;
  if (stat === 'lifesteal') return player.lifestealRate * 100;
  if (stat === 'thorns') return player.thornsRate * 100;
  if (stat === 'attackSpeed') return player.attackSpeed;
  return 0;
};

export const getFinalMonsterStats = (
  monster: Monster,
  playerLevel: number,
  encounterCount: number,
  isBoss: boolean,
  finalPlayer: FinalPlayerCombatStats,
  mapNodeId?: string,
): FinalMonsterCombatStats => {
  const monsterLevel = Math.max(1, Number(monster.level) || 1);
  const monsterLevelFactor = 1 + (monsterLevel - 1) * 0.08;
  const levelFactor = 1 + Math.max(0, playerLevel - 1) * 0.08;
  const encounterFactor = 1 + Math.min(0.65, encounterCount * 0.003);
  const hpFactor = isBoss ? 1.55 : 1.28;
  const attackFactor = isBoss ? 1.36 : 1.22;
  const defenseFactor = isBoss ? 1.32 : 1.18;
  const combatProfile = getCombatProfile();

  const mapNode = mapNodeId ? getMapNodeById(mapNodeId) : undefined;
  const mapBaseline = getMapMonsterBaselineByLevel(mapNode?.recommendedLevel ?? playerLevel);
  const templateStats = resolveMonsterTemplateStats(monster, mapBaseline);

  let maxHp = Math.floor(templateStats.maxHp * levelFactor * encounterFactor * hpFactor * monsterLevelFactor);
  let attack = Math.floor(templateStats.attack * levelFactor * encounterFactor * attackFactor * combatProfile.monsterDamageMultiplier * monsterLevelFactor);
  let defense = Math.floor(templateStats.defense * levelFactor * encounterFactor * defenseFactor * (1 + (monsterLevel - 1) * 0.06));

  let objectivePassed = true;
  let objectiveLabel: string | null = null;

  if (monster.monsterType === 'boss' && monster.counterGoal) {
    const currentValue = readPlayerCounterStat(finalPlayer, monster.counterGoal.stat);
    objectivePassed = currentValue >= monster.counterGoal.threshold;
    objectiveLabel = objectivePassed
      ? i18n.t('codex.counterGoal.passed', { title: monster.counterGoal.title, detail: monster.counterGoal.successText })
      : i18n.t('codex.counterGoal.failed', { title: monster.counterGoal.title, detail: monster.counterGoal.failText });

    if (objectivePassed) {
      attack = Math.floor(attack * 0.95);
      defense = Math.floor(defense * 0.9);
    } else {
      maxHp = Math.floor(maxHp * 1.22);
      attack = Math.floor(attack * 1.18);
      defense = Math.floor(defense * 1.15);
    }
  }

  const damageReduction = defenseToReductionRate(defense, 0.62, 0.011);

  return {
    maxHp: Math.max(1, maxHp),
    attack: Math.max(1, attack),
    defense: Math.max(0, defense),
    damageReduction,
    shieldReduction: 0.6,
    rageMultiplier: 1.3,
    bossSkillInterval: combatProfile.bossSkillInterval,
    statusProcMultiplier: combatProfile.statusProcMultiplier,
    objectiveLabel,
    objectivePassed,
  };
};

export const calculateFinalMonsterStats = getFinalMonsterStats;

interface TurnSnapshotOptions {
  monsterIsShocked: boolean;
  shieldTurns: number;
  monsterRageActive: boolean;
}

export interface TurnCombatSnapshot {
  playerAttack: number;
  monsterAttack: number;
  playerDamageReduction: number;
  monsterDamageReduction: number;
  shieldMultiplier: number;
}

export const getTurnCombatSnapshot = (
  finalPlayer: FinalPlayerCombatStats,
  finalMonster: FinalMonsterCombatStats,
  options: TurnSnapshotOptions,
): TurnCombatSnapshot => {
  const monsterDamageReduction = finalMonster.damageReduction * (options.monsterIsShocked ? 0.8 : 1);
  const monsterAttack = finalMonster.attack * (options.monsterRageActive ? finalMonster.rageMultiplier : 1);

  return {
    playerAttack: finalPlayer.attack,
    monsterAttack,
    playerDamageReduction: finalPlayer.damageReduction,
    monsterDamageReduction: clamp(monsterDamageReduction, 0, 0.85),
    shieldMultiplier: options.shieldTurns > 0 ? finalMonster.shieldReduction : 1,
  };
};
