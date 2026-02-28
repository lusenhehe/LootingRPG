import BattleUnitCardBase from './BattleUnitCardBase';
import type { BattleUnitInstance } from '../../types/battle/BattleUnit';
import type { BattleStatusInstance } from '../../types/battle/BattleUnit';
import React, { memo } from 'react';
import { Sword, Shield, Circle, Heart, Sparkles, Skull } from 'lucide-react';

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  dot: <Circle size={12} className="text-red-500" />,      // generic status dot
  hot: <Heart size={12} className="text-green-400" />,     // healing over time
  buff: <Sparkles size={12} className="text-yellow-300" />, // positive buff
  debuff: <Skull size={12} className="text-gray-400" />,   // negative effect
  shield: <Shield size={12} className="text-blue-400" />,   // shield status
};

function StatusBadge({ status }: { status: BattleStatusInstance }) {
  const icon = STATUS_ICONS[status.kind] ?? '❓';
  return (
    <span
      title={`${status.id} ×${status.stacks} (${status.remainingTurns}t)`}
      className="inline-flex items-center gap-[1px] text-[7px] leading-none px-0.5 py-[1px] rounded bg-black/60 text-gray-200 shrink-0"
    >
      <span className="text-[8px] leading-none">{icon}</span>
      {status.stacks > 1 && <span>×{status.stacks}</span>}
      <span className="text-gray-500">{status.remainingTurns}</span>
    </span>
  );
}

interface EnemyCardProps {
  enemy: BattleUnitInstance;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: (enemyId: string) => void;
}
function EnemyCardInner({ enemy, isActive = false, isSelected = false, onClick }: EnemyCardProps) {
  const icon = typeof enemy.meta?.icon === 'string' ? enemy.meta.icon : '👾';

  const hpPercent = percent(enemy.currentHp, enemy.baseStats.hp);
  const hpColor =
    hpPercent > 60 ? 'bg-green-500' : hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-500';

  const element = enemy.elements?.[0];
  const statuses = enemy.statuses ?? [];

  const borderColor =
    element === 'fire'
      ? 'border-red-400'
      : element === 'water'
      ? 'border-blue-400'
      : element === 'earth'
      ? 'border-yellow-400'
      : element === 'air'
      ? 'border-gray-300'
      : 'border-game-border/60';

  const activeRing = isActive
    ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-black/30 shadow-[0_0_12px_2px_rgba(248,113,113,0.5)]'
    : '';
  const selectedRing = isSelected && !isActive
    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30 shadow-[0_0_10px_2px_rgba(251,191,36,0.5)] scale-[1.03]'
    : '';

  const isAlive = enemy.currentHp > 0;
  const clickable = isAlive && onClick ? 'cursor-pointer hover:brightness-110' : '';

  return (
    <BattleUnitCardBase
      className={`w-full p-0 duration-100 ${borderColor} ${activeRing} ${selectedRing} ${clickable}`}
      onClick={isAlive && onClick ? () => onClick(enemy.id) : undefined}
      subtitle={
        <div className="flex min-w-0 bg-transparent">
          <span className="text-[clamp(0.45rem,0.9vw,0.6rem)] font-semibold bg-transparent">
            {enemy.name} Lv.{enemy.level}
          </span>
        </div>
      }
    >
      <div className="w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden">
        {/* 状态徽章行 */}
        {statuses.length > 0 && (
          <div className="mb-1 flex items-center gap-0.5 flex-wrap min-w-0 shrink-0 overflow-hidden max-h-[14px]">
            {statuses.slice(0, 3).map((s) => (
              <StatusBadge key={s.id} status={s} />
            ))}
            {statuses.length > 3 && (
              <span className="text-[7px] text-gray-400">+{statuses.length - 3}</span>
            )}
          </div>
        )}

        {/* 元素标签（仅在无状态时显示，避免拥挤） */}
        {statuses.length === 0 && element && (
          <div className="mb-1 flex items-center gap-1 min-w-0 shrink-0 overflow-hidden">
            <span className="max-w-full truncate text-[clamp(0.45rem,0.8vw,0.6rem)] px-1 py-[1px] rounded bg-black/60 text-gray-300">
              {element}
            </span>
          </div>
        )}

        {/* 意图预告徽章 */}
        {enemy.nextIntent && isAlive && (
          <div
            className={`mb-0.5 px-1 py-0.5 rounded text-[7px] leading-tight text-center font-mono shrink-0 ${
              enemy.nextIntent.type === 'heavy_attack'
                ? 'bg-red-900/60 text-red-300 border border-red-700/40'
                : enemy.nextIntent.type === 'defend'
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700/30'
                : 'bg-stone-900/60 text-stone-400 border border-stone-700/30'
            }`}
          >
            {enemy.nextIntent.label}
            {enemy.nextIntent.estimatedDamage != null && (
              <span className="text-red-400 ml-1">≈{enemy.nextIntent.estimatedDamage}</span>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <div className="leading-none" style={{ fontSize: 'clamp(1rem, 2.6vw, 2rem)' }}>
            {icon}
          </div>
        </div>

        <div className="px-1 py-1 flex items-center justify-between gap-1 text-[clamp(0.46rem,0.85vw,0.66rem)] text-gray-300 min-w-0 shrink-0">
          <div className="min-w-0 flex items-center gap-1 truncate">
            <Sword className="w-[0.68rem] h-[0.68rem] shrink-0" />
            <span className="truncate">{enemy.baseStats.attack}</span>
          </div>
          <div className="min-w-0 flex items-center gap-1 truncate justify-end">
            <Shield className="w-[0.68rem] h-[0.68rem] shrink-0" />
            <span className="truncate">{enemy.baseStats.defense}</span>
          </div>
        </div>

        <div className="h-1.5 rounded-sm bg-gray-900/80 overflow-hidden shrink-0">
          <div
            className={`h-full ${hpColor} transition-all duration-300`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>
    </BattleUnitCardBase>
  );
}

export const EnemyCard = memo(EnemyCardInner);

export default EnemyCard;
