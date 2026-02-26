// battleMath.ts

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/**
 * 攻防比伤害模型（防爆炸）
 * damage = A² / (A + D)
 */
export const computeDamage = (
  attack: number,
  defense: number,
  critMultiplier: number,
  flatBonus: number = 0,
): number => {
  const effectiveAttack = attack * critMultiplier + flatBonus;
  const safeDefense = Math.max(1, defense);

  const damage =
    (effectiveAttack * effectiveAttack) /
    (effectiveAttack + safeDefense);

  return Math.max(1, Math.floor(damage));
};

/**
 * 暴击伤害递减
 */
export const computeCritMultiplier = (
  didCrit: boolean,
  critDamage: number,
): number => {
  if (!didCrit) return 1;

  const effectiveCritDamage =
    critDamage / (1 + critDamage * 0.6);

  return 1 + effectiveCritDamage;
};

/**
 * 元素穿透（不是加伤）
 */
export const computeEffectiveDefense = (
  defense: number,
  elementalPenetration: number,
): number => {
  const pen = clamp(elementalPenetration, 0, 0.6);
  return defense * (1 - pen);
};

/**
 * 吸血递减
 */
export const computeEffectiveLifesteal = (rate: number): number => {
  return rate / (1 + rate);
};