import React from 'react';
import { AnimatePresence } from 'motion/react';
import type { BattleSession } from '../../../shared/types/game';
import type { BattleUnitInstance } from '../../../types/battle/BattleUnit';
import PlayerCard from '../PlayerCard';
import EnemyCard from '../EnemyCard';
import BattleUnitCardBase from '../BattleUnitCardBase';
import EnemyDetailPanel from '../EnemyDetailPanel';
import type { DragState } from './hooks/useBattleDrag';
import skillsJson from '@data/config/game/skills.json';
import battleUiJson from '@data/config/game/battleUi.json';

type SkillMeta = { targetScope?: string };
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;
const UI_CFG = battleUiJson as unknown as {
  enemyCard?: {
    attackMotion?: {
      travelToPlayerRatio?: number;
      travelToPlayerYRatio?: number;
      minTravelPx?: number;
      maxTravelPx?: number;
      maxTravelYPx?: number;
    };
  };
};

const CELL_SIZE = 96;
const MAP_SIZE: [number, number] = [8, 3];
const LEFT_SLOT_COUNT = 6;
const LEFT_IDX = [0, 1, 8, 9, 16, 17];
const RIGHT_IDX = [5, 6, 7, 13, 14, 15, 21, 22, 23];
const PLAYER_GRID_INDEX = 9;

interface BattleGridProps {
  session: BattleSession;
  currentWaveEnemies: BattleUnitInstance[];
  hoveredEnemyId: string | null;
  dragState: DragState | null;
  onHoverEnemy: (id: string | null) => void;
}

export function BattleGrid({
  session,
  currentWaveEnemies,
  hoveredEnemyId,
  dragState,
  onHoverEnemy,
}: BattleGridProps) {
  const rightEnemies = currentWaveEnemies.slice(0, 9);
  const cols = MAP_SIZE[0];
  const rows = MAP_SIZE[1];
  const total = rows * cols;
  const playerCol = PLAYER_GRID_INDEX % cols;
  const playerRow = Math.floor(PLAYER_GRID_INDEX / cols);

  const travelRatio = UI_CFG.enemyCard?.attackMotion?.travelToPlayerRatio ?? 0.9;
  const travelYRatio = UI_CFG.enemyCard?.attackMotion?.travelToPlayerYRatio ?? 0.9;
  const minTravel = UI_CFG.enemyCard?.attackMotion?.minTravelPx ?? 260;
  const maxTravel = UI_CFG.enemyCard?.attackMotion?.maxTravelPx ?? 560;
  const maxTravelY = UI_CFG.enemyCard?.attackMotion?.maxTravelYPx ?? 120;

  const hoveredEnemy = hoveredEnemyId
    ? (session.enemies ?? []).find((e) => e.id === hoveredEnemyId) ?? null
    : null;

  // 空白占位格
  const EmptySlot = ({ slotKey }: { slotKey: string }) => (
    <BattleUnitCardBase key={slotKey} subtitle="" className="w-full">
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-sm border border-stone-800/50 bg-stone-900/30" />
      </div>
    </BattleUnitCardBase>
  );

  // 构造格子数组
  const cells: React.ReactNode[] = Array(total).fill(null);

  // 左侧格：5号位置放玩家，其余放空槽
  const leftSlots: React.ReactNode[] = [];
  for (let i = 0; i < LEFT_SLOT_COUNT; i++) {
    if (i === 3) {
      const playerActive =
        session.phase === 'player_input' || session.phase === 'resolving';
      leftSlots.push(
        <PlayerCard
          key="player"
          session={session}
          isActive={playerActive && session.status === 'fighting'}
        />,
      );
    } else {
      leftSlots.push(<EmptySlot key={`ally-slot-${i}`} slotKey={`ally-slot-${i}`} />);
    }
  }
  LEFT_IDX.forEach((idx, i) => { cells[idx] = leftSlots[i] ?? null; });

  // 右侧格：每个格子放怪物
  RIGHT_IDX.forEach((idx, i) => {
    const enemy = rightEnemies[i];
    if (enemy) {
      const enemyActive = session.phase === 'enemy_turn' && session.status === 'fighting';
      const enemyCol = idx % cols;
      const enemyRow = Math.floor(idx / cols);
      const travelRaw = Math.abs(enemyCol - playerCol) * CELL_SIZE * travelRatio;
      const travelYRaw = (playerRow - enemyRow) * CELL_SIZE * travelYRatio;
      const attackTravelPx = Math.max(minTravel, Math.min(maxTravel, travelRaw));
      const attackTravelYPx = Math.max(-maxTravelY, Math.min(maxTravelY, travelYRaw));

      const dragAim =
        dragState !== null &&
        dragState.hoveredEnemyId === enemy.id &&
        (dragState.type === 'attack' ||
          (SKILLS_META[dragState.type === 'skill' ? dragState.skillId : '']?.targetScope ??
            'enemy') === 'enemy');

      const dragInvalid =
        dragState !== null &&
        dragState.type === 'skill' &&
        (SKILLS_META[dragState.skillId]?.targetScope ?? 'enemy') === 'self';

      cells[idx] = (
        <EnemyCard
          key={enemy.id}
          enemy={enemy}
          currentTurn={session.turn}
          attackTravelPx={attackTravelPx}
          attackTravelYPx={attackTravelYPx}
          isActive={enemyActive}
          isSelected={false}
          dragAim={dragAim}
          dragInvalid={dragInvalid}
          onHover={onHoverEnemy}
        />
      );
    } else {
      cells[idx] = <EmptySlot key={`enemy-slot-${i}`} slotKey={`enemy-slot-${i}`} />;
    }
  });

  return (
    <div className="relative z-10 flex gap-2 items-start">
      <div className="border border-stone-800/60 bg-stone-950/50">
        <div
          className="relative overflow-auto"
          style={{ width: `${CELL_SIZE * MAP_SIZE[0]}px`, height: `${CELL_SIZE * MAP_SIZE[1]}px` }}
        >
          <div
            className="grid"
            style={{
              width: `${CELL_SIZE * MAP_SIZE[0]}px`,
              height: `${CELL_SIZE * MAP_SIZE[1]}px`,
              gridTemplateRows: `repeat(${MAP_SIZE[1]}, ${CELL_SIZE}px)`,
              gridTemplateColumns: `repeat(${MAP_SIZE[0]}, ${CELL_SIZE}px)`,
            }}
          >
            {cells.map((cell, idx) => (
              <div key={idx} className="w-full h-full">{cell}</div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent" />
      </div>

      <AnimatePresence>
        {hoveredEnemy && <EnemyDetailPanel key={hoveredEnemy.id} enemy={hoveredEnemy} />}
      </AnimatePresence>
    </div>
  );
}
