import type { PlayerStats } from '../../types/game';

export interface CombatProfile {
  playerDamageMultiplier: number;
  monsterDamageMultiplier: number;
  statusProcMultiplier: number;
  turnBonus: number;
  bossSkillInterval: number;
}

export interface FinalPlayerCombatStats {
  maxHp: number;
  attack: number;
  defense: number;
  damageReduction: number;
  critRate: number;
  elementalBonus: number;
  lifestealRate: number;
  thornsRate: number;
  attackSpeed: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toSoftCappedPercent = (
  rawPercent: number,
  softCapPercent: number,
  hardCapPercent: number,
  growthRate: number,
): number => {
  const normalized = Math.max(0, rawPercent);
  if (normalized <= softCapPercent) return normalized;

  const overflow = normalized - softCapPercent;
  const scaled = 1 - Math.exp(-growthRate * overflow);
  const softened = softCapPercent + (hardCapPercent - softCapPercent) * scaled;
  return clamp(softened, 0, hardCapPercent);
};

const defenseToReductionRate = (
  defenseValue: number,
  hardCapRate: number,
  growthRate: number,
): number => {
  const normalized = Math.max(0, defenseValue);
  const rate = 1 - Math.exp(-growthRate * normalized);
  return clamp(rate, 0, hardCapRate);
};

const DEFAULT_COMBAT_PROFILE: CombatProfile = {
  playerDamageMultiplier: 1,
  monsterDamageMultiplier: 1,
  statusProcMultiplier: 1,
  turnBonus: 0,
  bossSkillInterval: 3,
};

export const getCombatProfile = (): CombatProfile => DEFAULT_COMBAT_PROFILE;

export const getFinalPlayerStats = (
  source: PlayerStats,
  encounterCount: number,
): FinalPlayerCombatStats => {
  const combatProfile = DEFAULT_COMBAT_PROFILE;
  const rawCritPercent = toNumber(source.critRate);
  const rawLifestealPercent = toNumber(source.lifesteal);
  const rawThornsPercent = toNumber(source.thorns);
  const rawDefense = Math.max(0, Math.floor(source.defense));
  const levelFactor = 1 + Math.max(0, source.level - 1) * 0.08;
  const encounterFactor = 1 + Math.min(0.65, encounterCount * 0.003);

  const critPercent = toSoftCappedPercent(rawCritPercent, 50, 75, 0.08);
  const lifestealPercent = toSoftCappedPercent(rawLifestealPercent, 30, 45, 0.12);
  const thornsPercent = toSoftCappedPercent(rawThornsPercent, 20, 35, 0.1);
  const damageReduction = defenseToReductionRate(rawDefense, 0.68, 0.01);

  return {
    maxHp: Math.max(1, Math.floor(source.hp * levelFactor * encounterFactor)),
    attack: Math.max( 1,
      Math.floor(source.attack * levelFactor * encounterFactor * combatProfile.playerDamageMultiplier),
    ),
    defense: Math.max(0, Math.floor(rawDefense * levelFactor * encounterFactor)),
    damageReduction,
    critRate: clamp(critPercent / 100, 0, 0.8),
    elementalBonus: Math.max(0, toNumber(source.elemental)),
    lifestealRate: clamp(lifestealPercent / 100, 0, 0.45),
    thornsRate: clamp(thornsPercent / 100, 0, 0.35),
    attackSpeed: Math.max(0, toNumber(source.attackSpeed)),
  };
};

export const calculateFinalPlayerStats = (
  source: PlayerStats,
  encounterCount: number,
) => getFinalPlayerStats(source, encounterCount);
