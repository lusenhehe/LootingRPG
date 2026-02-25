const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const rollDamage = (base: number): number => {
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.floor(base * variance));
};

export const calculateDamage = (attack: number, reductionRate: number, multiplier = 1): number => {
  const clampedReduction = clamp(reductionRate, 0, 0.85);
  const raw = Math.max(1, attack * multiplier * (1 - clampedReduction));
  return rollDamage(raw);
};
