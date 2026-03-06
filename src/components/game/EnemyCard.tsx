import BattleUnitCardBase from './BattleUnitCardBase';
import type { BattleUnitInstance } from '../../types/battle/BattleUnit';
import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sword, Shield } from 'lucide-react';
import battleAnimJson from '@data/config/game/battleAnimations.json';
import battleUiJson from '@data/config/game/battleUi.json';
import { StatusBadge } from './battle/StatusBadge';
import { ProgressBar } from '../../shared/ui';

const ANIM_CFG = battleAnimJson as unknown as Record<string, Record<string, { cssClass: string; durationMs: number }>>;
const UI_CFG = battleUiJson as unknown as {
  enemyCard?: {
    attackMotion?: {
      xStart?: number;
      xEnd?: number;
      scaleFrom?: number;
      scaleTo?: number;
      durationSec?: number;
      defaultDuration?: number;
      travelToPlayerRatio?: number;
      travelToPlayerYRatio?: number;
      minTravelPx?: number;
      maxTravelPx?: number;
      maxTravelYPx?: number;
    };
    deathMotion?: { durationSec?: number };
  }
};

interface EnemyCardProps {
  enemy: BattleUnitInstance;
  currentTurn?: number;
  attackTravelPx?: number;
  attackTravelYPx?: number;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: (enemyId: string) => void;
  onHover?: (enemyId: string | null) => void;
  dragAim?: boolean;
  dragInvalid?: boolean;
  /** 支持被攻击拖拽目标，需要传入 onAttackDrag */
  onAttackDragStart?: (enemyId: string, x: number, y: number) => void;
}
function EnemyCardInner({ enemy, currentTurn = 0, attackTravelPx = 320, attackTravelYPx = 0, isActive = false, isSelected = false, onClick, onHover, dragAim, dragInvalid }: EnemyCardProps) {
  const _ = ANIM_CFG; // ensure import is used
  const handleMouseEnter = useCallback(() => onHover?.(enemy.id), [onHover, enemy.id]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);
  const icon = typeof enemy.meta?.icon === 'string' ? enemy.meta.icon : '👾';

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
  const dragAimRing = dragAim
    ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-black/30 shadow-[0_0_14px_3px_rgba(74,222,128,0.6)] scale-[1.04]'
    : '';

  const isAlive = enemy.currentHp > 0;
  const clickable = isAlive && onClick ? 'cursor-pointer hover:brightness-110' : '';

  const attackAnimClass = isActive ? (ANIM_CFG.enemyAttack?.baseAttack?.cssClass ?? '') : '';
  const lastAttackTurn = typeof enemy.meta?.lastAttackTurn === 'number' ? enemy.meta.lastAttackTurn : -1;
  const lastDeathTurn = typeof enemy.meta?.lastDeathTurn === 'number' ? enemy.meta.lastDeathTurn : -1;
  const shouldAttackAnimate = lastAttackTurn === currentTurn;
  const shouldDeathAnimate = !isAlive && lastDeathTurn >= 0 && currentTurn >= lastDeathTurn;
  const attackMotion = UI_CFG.enemyCard?.attackMotion;
  const attackDurationSec = attackMotion?.durationSec ?? ((ANIM_CFG.enemyAttack?.baseAttack?.durationMs ?? 380) / 1000);
  const startX = attackMotion?.xStart ?? -12;
  const endX = attackMotion?.xEnd ?? 0;
  const startScale = attackMotion?.scaleFrom ?? 1.02;
  const endScale = attackMotion?.scaleTo ?? 1;
  const fallbackDuration = attackMotion?.defaultDuration ?? 0.38;
  const maxTravelPx = attackMotion?.maxTravelPx ?? 560;
  const minTravelPx = attackMotion?.minTravelPx ?? 260;
  const maxTravelYPx = attackMotion?.maxTravelYPx ?? 120;
  const clampedTravel = Math.max(minTravelPx, Math.min(maxTravelPx, attackTravelPx));
  const clampedTravelY = Math.max(-maxTravelYPx, Math.min(maxTravelYPx, attackTravelYPx));
  const deathDurationSec = UI_CFG.enemyCard?.deathMotion?.durationSec ?? 0.6;

  return (
    <div
      data-enemy-id={enemy.id}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {dragInvalid && (
        <div className="absolute inset-0 z-10 rounded pointer-events-none bg-red-500/20 ring-2 ring-red-500/60" />
      )}
    <motion.div
      key={`${enemy.id}-${lastAttackTurn}-${lastDeathTurn}`}
      initial={shouldAttackAnimate ? { x: startX, scale: startScale } : false}
      animate={
        shouldDeathAnimate
          ? {
              opacity: [1, 1, 0],
              scale: [1, 1.06, 0.72],
              x: [0, -8, -22],
              y: [0, 10, 26],
              rotate: [0, -2, -7],
              filter: ['saturate(1)', 'saturate(1.2)', 'grayscale(1) blur(1px)'],
            }
          : shouldAttackAnimate
          ? { x: [0, -clampedTravel, endX], y: [0, clampedTravelY, 0], scale: [1, startScale, endScale] }
          : { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0, filter: 'none' }
      }
      transition={{ duration: shouldDeathAnimate ? deathDurationSec : (shouldAttackAnimate ? attackDurationSec : fallbackDuration), ease: 'easeOut' }}
    >
    <BattleUnitCardBase
      className={`w-full p-0 duration-100 ${borderColor} ${activeRing} ${selectedRing} ${clickable} ${dragAimRing} ${attackAnimClass}`}
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
              <StatusBadge key={s.id} status={s} iconMode="lucide" />
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

        <ProgressBar value={enemy.currentHp} max={enemy.baseStats.hp} color="auto" />
      </div>
    </BattleUnitCardBase>
    </motion.div>
    </div>
  );
}

export const EnemyCard = memo(EnemyCardInner);

export default EnemyCard;
