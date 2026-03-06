import { clamp, computeCritMultiplier, computeDamage, computeEffectiveDefense, computeEffectiveLifesteal } from '../battleMaths';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import type { BattleEventBus } from './EventBus';

export interface DamageModifier {
  type: string;
  apply: (ctx: DamageContext) => void;
}

export interface DamageContext {
  source: BattleUnitInstance;
  target: BattleUnitInstance;
  baseDamage: number;
  critMultiplier: number;
  modifiers: DamageModifier[];
}

/** 伤害计算分解，供 ActionResolver 构建详细日志 */
export interface DamageBreakdown {
  rawAttack: number;
  rawDefense: number;
  effectiveDefense: number;
  elementalPen: number;
  didCrit: boolean;
  critMultiplier: number;
  /** 所有 modifier 后、floor 前的伤害 */
  computedDamage: number;
  finalDamage: number;
}

export const resolveDamage = (ctx: DamageContext, eventBus: BattleEventBus): DamageBreakdown => {
  const didCrit = Math.random() < (ctx.source.derivedStats.critRate ?? 0);
  ctx.critMultiplier = computeCritMultiplier(didCrit, 0.6);

  const elementalPen = ctx.source.derivedStats.elementalBonus ?? 0;
  const rawDefense = ctx.target.baseStats.defense;
  const effectiveDefense = computeEffectiveDefense(rawDefense, elementalPen);

  ctx.baseDamage = computeDamage(
    ctx.source.baseStats.attack,
    effectiveDefense,
    ctx.critMultiplier,
  );

  for (const modifier of ctx.modifiers) {
    modifier.apply(ctx);
  }

  const finalDamage = Math.max(1, Math.floor(ctx.baseDamage));

  eventBus.emit({
    type: 'before_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
  });

  eventBus.emit({
    type: 'apply_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
    amount: finalDamage,
  });

  eventBus.emit({
    type: 'after_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
    amount: finalDamage,
  });

  const effectiveLifesteal = computeEffectiveLifesteal(ctx.source.derivedStats.lifestealRate ?? 0);
  if (effectiveLifesteal > 0) {
    const heal = Math.floor(finalDamage * effectiveLifesteal);
    if (heal > 0) {
      eventBus.emit({
        type: 'apply_heal',
        sourceId: ctx.source.id,
        targetId: ctx.source.id,
        amount: heal,
      });
    }
  }

  const thornsRate = clamp(ctx.target.derivedStats.thornsRate ?? 0, 0, 0.4);
  if (thornsRate > 0) {
    const reflectDamage = Math.floor(finalDamage * thornsRate);
    if (reflectDamage > 0) {
      eventBus.emit({
        type: 'apply_damage',
        sourceId: ctx.target.id,
        targetId: ctx.source.id,
        amount: reflectDamage,
      });
    }
  }

  return {
    rawAttack: ctx.source.baseStats.attack,
    rawDefense,
    effectiveDefense: Math.round(effectiveDefense),
    elementalPen,
    didCrit,
    critMultiplier: ctx.critMultiplier,
    computedDamage: ctx.baseDamage,
    finalDamage,
  };
};
