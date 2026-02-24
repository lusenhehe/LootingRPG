import type { GameState } from '../types/game';
import { getEquipmentTotals } from './equipmentUtils';
// 这个文件包含了一些与 UI 相关的辅助函数，主要用于从游戏状态中计算出一些派生数据，供组件使用。
export interface DerivedStatItem {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  icon: React.ReactNode;
  accent: string;
}
import { englishToChinese } from './nameConversion';

export function getDerivedStats(gameState: GameState): Omit<DerivedStatItem, 'icon'>[] {
  const ps = gameState.playerStats;

  // small subset of stats that are shown in the header; iterate with a
  // mapping so the Chinese labels are not scattered everywhere.
  const statSpecs: Array<{
    en: string;
    key: string;
    accent: string;
    fmt: (v: number) => string;
  }> = [
    { en: 'damageBonus', key: 'dmg', accent: 'border-orange-400/35 bg-orange-500/10 text-orange-200', fmt: v => `${v}%` },
    { en: 'lifesteal', key: 'ls', accent: 'border-red-400/35 bg-red-500/10 text-red-200', fmt: v => `${v}%` },
    { en: 'thorns', key: 'thorns', accent: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200', fmt: v => `${v}%` },
    { en: 'elemental', key: 'element', accent: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200', fmt: v => `+${v}` },
    { en: 'attackSpeed', key: 'spd', accent: 'border-violet-400/35 bg-violet-500/10 text-violet-200', fmt: v => `+${v}` },
  ];

  return statSpecs.map(({ en, key, accent, fmt }) => {
    const ch = englishToChinese[en] ?? en; // label only
    const raw = (ps as any)[en] as number;
    return {
      key,
      label: ch,
      value: fmt(raw),
      rawValue: raw,
      accent,
    };
  });
}

// // 计算当前装备提供的总属性加成，返回一个以属性名为键、
// // 总加成数值为值的对象。组件可以使用这个函数来显示装备总加成或者在计算伤害时使用。
// export function getEquipmentStatTotals(gameState: GameState): Record<string, number> {
//   const { attributes, affixes } = getEquipmentTotals(gameState.currentEquipment);
//   return { ...attributes, ...affixes };
// }
