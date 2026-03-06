import BattleResultOverlay from './BattleResultOverlay';
import { memo, useState, useCallback, useRef } from 'react';
import skillsJson from '@data/config/game/skills.json';
import battleUiJson from '@data/config/game/battleUi.json';
import { useStateContext } from '../../app/context/state';
import { useBattleContext } from '../../app/context/battle';
import {
  NoTargetToast,
  BattleWaveHeader,
  BattleGrid,
  BattleActionPanel,
  BattleLogPanel,
  useBattleDrag,
  useWaveTransition,
} from './battle';

type SkillMeta = { targetScope?: string; icon?: string };
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;
const UI_CFG = battleUiJson as unknown as {
  battleView?: {
    noTargetToast?: { durationMs?: number };
    drag?: { releaseText?: string };
    waveTransition?: { delayMs?: number };
  };
};

function BattleViewInner() {
  const { gameState } = useStateContext();
  const {
    handleBattleAttack: onAttack,
    handleBattleRetreat: onRetreat,
    handleBattleCloseResult: onClose,
    handleBattleUseSkill: onSkill,
  } = useBattleContext();
  const session = gameState.battle.activeSession!;

  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [showNoTargetToast, setShowNoTargetToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireNoTargetToast = useCallback(() => {
    setShowNoTargetToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const durationMs = UI_CFG.battleView?.noTargetToast?.durationMs ?? 2000;
    toastTimerRef.current = setTimeout(() => setShowNoTargetToast(false), durationMs);
  }, []);

  // ── Wave 计算 ──
  const fallbackWaveOrder = Array.from(new Set((session.enemies ?? []).map((enemy) => {
    const waveId = enemy.meta?.waveId;
    return typeof waveId === 'string' ? waveId : 'wave-1';
  })));
  const waveOrder = Array.isArray(session.waveOrder) && session.waveOrder.length > 0
    ? session.waveOrder
    : fallbackWaveOrder;
  const safeWaveIndex = Number.isFinite(session.currentWaveIndex)
    ? Math.max(0, Math.min(Math.max(0, waveOrder.length - 1), session.currentWaveIndex))
    : 0;

  const { displayWaveIndex, isWaveTransitioning } = useWaveTransition(
    safeWaveIndex,
    waveOrder.length,
    UI_CFG.battleView?.waveTransition?.delayMs ?? 650,
  );

  const currentWaveId = waveOrder[displayWaveIndex];
  const currentWaveEnemies = (session.enemies ?? []).filter((enemy) => {
    if (!currentWaveId) return true;
    const waveId = enemy.meta?.waveId;
    return (typeof waveId === 'string' ? waveId : 'wave-1') === currentWaveId;
  });

  // ── 拖拽 ──
  const { dragState, startAttackDrag, startSkillDrag } = useBattleDrag({
    onAttack: (targetId) => onAttack(targetId ?? ''),
    onSkill,
    onNoTarget: fireNoTargetToast,
    skillsMeta: SKILLS_META,
  });

  const isFighting = session.status === 'fighting';
  const isVictory = session.status === 'victory';
  const isDefeat = session.status === 'defeat';
  const actionEnabled = isFighting && !isWaveTransitioning;

  const dragIcon = dragState
    ? dragState.type === 'attack'
      ? '⚔️'
      : (SKILLS_META[dragState.skillId]?.icon ?? '✨')
    : null;
  const dragOnTarget = dragState?.hoveredEnemyId != null;

  return (
    <div className="fantasy-panel rounded-sm p-4 flex flex-col h-[100vh] gap-3 relative overflow-auto">
      <NoTargetToast visible={showNoTargetToast} />
      <BattleResultOverlay status={session.status as 'victory' | 'defeat' | 'fighting'} onClose={onClose ?? onRetreat} />

      {/* 拖拽游标 */}
      {dragState && (
        <div
          className="fixed z-50 pointer-events-none select-none"
          style={{ left: dragState.x, top: dragState.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl shadow-xl transition-colors ${
            dragOnTarget
              ? 'border-green-400 bg-green-500/30 shadow-green-500/40'
              : 'border-amber-400 bg-amber-500/20 shadow-amber-500/30'
          }`}>
            {dragIcon}
          </div>
          {dragOnTarget && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-green-400 whitespace-nowrap font-mono">
              {UI_CFG.battleView?.drag?.releaseText ?? '释放攻击'}
            </div>
          )}
        </div>
      )}

      {/* 角落装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-700/30" />
        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-amber-700/30" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-amber-700/30" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-700/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-amber-950/5" />
      </div>

      {/* 顶栏 */}
      <BattleWaveHeader
        session={session}
        displayWaveIndex={displayWaveIndex}
        waveOrderLength={waveOrder.length}
        isVictory={isVictory}
        isDefeat={isDefeat}
      />

      {/* 战场网格 */}
      <BattleGrid
        session={session}
        currentWaveEnemies={currentWaveEnemies}
        hoveredEnemyId={hoveredEnemyId}
        dragState={dragState}
        onHoverEnemy={setHoveredEnemyId}
      />

      {/* 底栏：操作面板 + 战斗日志 */}
      <div className="flex gap-3 flex-1 min-h-[220px] relative z-10">
        <BattleActionPanel
          session={session}
          dragState={dragState}
          actionEnabled={actionEnabled}
          isWaveTransitioning={isWaveTransitioning}
          displayWaveIndex={displayWaveIndex}
          waveOrderLength={waveOrder.length}
          onRetreat={onRetreat}
          onPointerDownAttack={(e) => {
            if (!actionEnabled) return;
            e.currentTarget.releasePointerCapture(e.pointerId);
            startAttackDrag(e.clientX, e.clientY);
          }}
          onPointerDownSkill={(skillId, e) => {
            if (!actionEnabled) return;
            e.currentTarget.releasePointerCapture(e.pointerId);
            startSkillDrag(skillId, e.clientX, e.clientY);
          }}
          onFireToast={fireNoTargetToast}
        />
        <BattleLogPanel session={session} />
      </div>
    </div>
  );
}

export const BattleView = memo(BattleViewInner);
