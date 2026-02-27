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

export const resolveDamage = (ctx: DamageContext, eventBus: BattleEventBus): void => {
  const didCrit = Math.random() < (ctx.source.derivedStats.critRate ?? 0);
  ctx.critMultiplier = computeCritMultiplier(didCrit, 0.6);

  const effectiveDefense = computeEffectiveDefense(
    ctx.target.baseStats.defense,
    ctx.source.derivedStats.elementalBonus ?? 0,
  );

  ctx.baseDamage = computeDamage(
    ctx.source.baseStats.attack,
    effectiveDefense,
    ctx.critMultiplier,
  );

  for (const modifier of ctx.modifiers) {
    modifier.apply(ctx);
  }

  const appliedDamage = Math.max(1, Math.floor(ctx.baseDamage));

  eventBus.emit({
    type: 'before_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
  });

  eventBus.emit({
    type: 'apply_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
    amount: appliedDamage,
  });

  eventBus.emit({
    type: 'after_damage',
    sourceId: ctx.source.id,
    targetId: ctx.target.id,
    amount: appliedDamage,
  });

  const effectiveLifesteal = computeEffectiveLifesteal(ctx.source.derivedStats.lifestealRate ?? 0);
  if (effectiveLifesteal > 0) {
    const heal = Math.floor(appliedDamage * effectiveLifesteal);
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
    const reflectDamage = Math.floor(appliedDamage * thornsRate);
    if (reflectDamage > 0) {
      eventBus.emit({
        type: 'apply_damage',
        sourceId: ctx.target.id,
        targetId: ctx.source.id,
        amount: reflectDamage,
      });
    }
  }
};
