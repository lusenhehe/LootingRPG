import type { MonsterTrait } from '../../types/game';

export type TraitBehaviorConfig =
  | {
      kind: 'thorns_reflect';
      reflectRate: number;
      minReflectDamage: number;
      noteKey: string;
    }
  | {
      kind: 'enemy_lifesteal';
      healRate: number;
      minHeal: number;
      noteKey: string;
    }
  | {
      kind: 'double_attack_chance';
      normalChance: number;
      bossChance: number;
      extraStrikes: number;
      noteKey: string;
    }
  | {
      kind: 'shield_on_start';
      turns: number;
      noteKey: string;
    }
  | {
      kind: 'rage_on_low_hp';
      thresholdPercent: number;
      noteKey: string;
    };

export const TRAIT_BEHAVIOR_CONFIG: Record<MonsterTrait, TraitBehaviorConfig> = {
  thorns: {
    kind: 'thorns_reflect',
    reflectRate: 0.12,
    minReflectDamage: 1,
    noteKey: 'trait.note.thorns',
  },
  lifesteal: {
    kind: 'enemy_lifesteal',
    healRate: 0.2,
    minHeal: 1,
    noteKey: 'trait.note.lifesteal_enemy',
  },
  double_attack: {
    kind: 'double_attack_chance',
    normalChance: 0.24,
    bossChance: 0.36,
    extraStrikes: 1,
    noteKey: 'trait.note.double_attack',
  },
  shield_on_start: {
    kind: 'shield_on_start',
    turns: 1,
    noteKey: 'trait.note.shield_on_start',
  },
  rage_on_low_hp: {
    kind: 'rage_on_low_hp',
    thresholdPercent: 50,
    noteKey: 'trait.note.rage_on_low_hp',
  },
};
