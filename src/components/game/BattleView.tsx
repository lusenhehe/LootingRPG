import { useTranslation } from 'react-i18next';
import type { BattleSession } from '../../shared/types/game';
import PlayerCard from './PlayerCard';
import EnemyCard from './EnemyCard';
import BattleUnitCardBase from './BattleUnitCardBase';
import EnemyDetailPanel from './EnemyDetailPanel';
import BattleResultOverlay from './BattleResultOverlay';
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Swords, Skull, ChevronRight, Scroll, Zap, GripHorizontal } from 'lucide-react';
import skillsJson from '@data/config/game/skills.json';
import battleUiJson from '@data/config/game/battleUi.json';

type SkillMeta = { energyCost?: number; cooldown?: number; displayName?: string; description?: string; icon?: string; targetScope?: string };
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;
const UI_CFG = battleUiJson as unknown as {
  battleView?: {
    noTargetToast?: { text?: string; durationMs?: number };
    drag?: { releaseText?: string };
    log?: { displayLimit?: number };
    waveTransition?: { delayMs?: number };
  };
  enemyCard?: {
    attackMotion?: { travelToPlayerRatio?: number; travelToPlayerYRatio?: number; minTravelPx?: number; maxTravelPx?: number; maxTravelYPx?: number };
  };
};

type AttackDrag = { type: 'attack'; x: number; y: number; hoveredEnemyId: string | null };
type SkillDrag = { type: 'skill'; skillId: string; x: number; y: number; hoveredEnemyId: string | null };
type DragState = AttackDrag | SkillDrag;

interface BattleViewProps {
  session: BattleSession;
  onAttack: (targetId?: string) => void;
  onRetreat: () => void;
  onSkill?: (skillId: string, targetId?: string) => void;
  onClose?: () => void;
}

function NoTargetToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-sm bg-amber-900/80 border border-amber-500/50 text-amber-200 text-xs font-display shadow-lg pointer-events-none"
        >
          {UI_CFG.battleView?.noTargetToast?.text ?? '⚔ 请将技能/攻击拖拽至目标再释放'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BattleViewInner({ session, onAttack, onRetreat, onSkill, onClose }: BattleViewProps) {
  const { t } = useTranslation();
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showNoTargetToast, setShowNoTargetToast] = useState(false);
  const [displayWaveIndex, setDisplayWaveIndex] = useState(0);
  const [isWaveTransitioning, setIsWaveTransitioning] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSkillRef = useRef(onSkill);
  useEffect(() => { onSkillRef.current = onSkill; }, [onSkill]);

  const fireNoTargetToast = useCallback(() => {
    setShowNoTargetToast(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const durationMs = UI_CFG.battleView?.noTargetToast?.durationMs ?? 2000;
    toastTimerRef.current = setTimeout(() => setShowNoTargetToast(false), durationMs);
  }, []);

  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: PointerEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const enemyEl = elements.find((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.enemyId);
      const hovered = enemyEl ? (enemyEl.dataset.enemyId ?? null) : null;
      setDragState((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY, hoveredEnemyId: hovered } : null);
    };
    const onUp = () => {
      setDragState((prev) => {
        if (!prev) return null;
        if (prev.type === 'attack') {
          if (prev.hoveredEnemyId) {
            onAttack(prev.hoveredEnemyId);
          } else {
            fireNoTargetToast();
          }
        } else {
          const meta = SKILLS_META[prev.skillId] ?? {};
          const scope = meta.targetScope ?? 'enemy';
          if (scope === 'self') {
            onSkillRef.current?.(prev.skillId, undefined);
          } else if (prev.hoveredEnemyId) {
            onSkillRef.current?.(prev.skillId, prev.hoveredEnemyId);
          } else {
            fireNoTargetToast();
          }
        }
        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, onAttack, fireNoTargetToast]);

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
  const currentWaveId = waveOrder[displayWaveIndex];
  const currentWaveEnemies = (session.enemies ?? []).filter((enemy) => {
    if (!currentWaveId) return true;
    const waveId = enemy.meta?.waveId;
    return (typeof waveId === 'string' ? waveId : 'wave-1') === currentWaveId;
  });

  useEffect(() => {
    if (displayWaveIndex === safeWaveIndex) return;
    if (safeWaveIndex < displayWaveIndex) {
      setDisplayWaveIndex(safeWaveIndex);
      setIsWaveTransitioning(false);
      return;
    }
    const delayMs = UI_CFG.battleView?.waveTransition?.delayMs ?? 650;
    setIsWaveTransitioning(true);
    if (waveSwitchTimerRef.current) {
      clearTimeout(waveSwitchTimerRef.current);
    }
    waveSwitchTimerRef.current = setTimeout(() => {
      setDisplayWaveIndex(safeWaveIndex);
      setIsWaveTransitioning(false);
    }, delayMs);
  }, [safeWaveIndex, displayWaveIndex]);

  useEffect(() => {
    if (waveOrder.length <= 0) return;
    setDisplayWaveIndex((prev) => {
      const maxIdx = Math.max(0, waveOrder.length - 1);
      return Math.max(0, Math.min(maxIdx, prev));
    });
  }, [waveOrder.length]);

  useEffect(() => {
    return () => {
      if (waveSwitchTimerRef.current) {
        clearTimeout(waveSwitchTimerRef.current);
      }
    };
  }, []);

  const leftSlotCount = 6;
  const rightEnemies = currentWaveEnemies.slice(0, 9);

  const isVictory = session.status === 'victory';
  const isDefeat = session.status === 'defeat';
  const isFighting = session.status === 'fighting';
  const actionEnabled = isFighting && !isWaveTransitioning;

  const cellSize = 96;
  const mapSize = [8, 3];

  const hoveredEnemy = hoveredEnemyId ? (session.enemies ?? []).find((e) => e.id === hoveredEnemyId) ?? null : null;
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

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-700/30" />
        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-amber-700/30" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-amber-700/30" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-700/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-amber-950/5" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-red-900/40 to-stone-900/60 border border-red-700/30 flex items-center justify-center">
              <Skull size={20} className="text-red-400" />
            </div>
            <div>
              <div className="text-[10px] font-display uppercase text-stone-500 tracking-[0.3em] flex items-center gap-2">
                <ChevronRight size={10} />
                <span>{session.chapterName}</span>
              </div>
              <div className="text-lg font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-stone-200 to-stone-300">
                {t('battle.title')}
              </div>
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-[0.2em]">{session.nodeName}</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Wave</div>
              <div className="text-xl font-display font-bold text-amber-500">
                {Math.min(displayWaveIndex + 1, waveOrder.length)}
                <span className="text-stone-600 text-sm">/{waveOrder.length}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Turn</div>
              <div className="text-xl font-display font-bold text-stone-300">{session.turn}</div>
            </div>
            {isVictory && (
              <div className="px-3 py-1.5 bg-emerald-900/30 border border-emerald-600/40 rounded-sm">
                <span className="text-emerald-400 font-display text-sm font-bold">VICTORY</span>
              </div>
            )}
            {isDefeat && (
              <div className="px-3 py-1.5 bg-red-900/30 border border-red-600/40 rounded-sm">
                <span className="text-red-400 font-display text-sm font-bold">DEFEATED</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex gap-2 items-start">
        <div className="border border-stone-800/60 bg-stone-950/50">
          <div className="relative overflow-auto" style={{ width: `${cellSize * mapSize[0]}px`, height: `${cellSize * mapSize[1]}px` }}>
            <div
              className="grid"
              style={{
                width: `${cellSize * mapSize[0]}px`,
                height: `${cellSize * mapSize[1]}px`,
                gridTemplateRows: `repeat(${mapSize[1]}, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${mapSize[0]}, ${cellSize}px)`,
              }}
            >
              {(() => {
                const rows = mapSize[1];
                const cols = mapSize[0];
                const total = rows * cols;
                const leftIdx = [0, 1, 8, 9, 16, 17];
                const rightIdx = [5, 6, 7, 13, 14, 15, 21, 22, 23];
                const playerGridIndex = 9;
                const playerCol = playerGridIndex % cols;
                const playerRow = Math.floor(playerGridIndex / cols);
                const cells: React.ReactNode[] = Array(total).fill(null);
                const leftSlots: React.ReactNode[] = [];
                for (let i = 0; i < leftSlotCount; i++) {
                  if (i === 3) {
                    const playerActive = session.phase === 'player_input' || session.phase === 'resolving';
                    leftSlots.push(<PlayerCard key="player" session={session} isActive={playerActive && session.status === 'fighting'} />);
                  } else {
                    leftSlots.push(
                      <BattleUnitCardBase key={`ally-slot-${i}`} subtitle="" className="w-full">
                        <div className="h-full flex items-center justify-center">
                          <div className="w-8 h-8 rounded-sm border border-stone-800/50 bg-stone-900/30" />
                        </div>
                      </BattleUnitCardBase>,
                    );
                  }
                }
                leftIdx.forEach((idx, i) => { cells[idx] = leftSlots[i] || null; });

                rightIdx.forEach((idx, i) => {
                  const enemy = rightEnemies[i];
                  if (enemy) {
                    const enemyActive = session.phase === 'enemy_turn' && session.status === 'fighting';
                    const enemyCol = idx % cols;
                    const enemyRow = Math.floor(idx / cols);
                    const travelRatio = UI_CFG.enemyCard?.attackMotion?.travelToPlayerRatio ?? 0.9;
                    const travelYRatio = UI_CFG.enemyCard?.attackMotion?.travelToPlayerYRatio ?? 0.9;
                    const minTravel = UI_CFG.enemyCard?.attackMotion?.minTravelPx ?? 260;
                    const maxTravel = UI_CFG.enemyCard?.attackMotion?.maxTravelPx ?? 560;
                    const maxTravelY = UI_CFG.enemyCard?.attackMotion?.maxTravelYPx ?? 120;
                    const travelRaw = Math.abs(enemyCol - playerCol) * cellSize * travelRatio;
                    const travelYRaw = (playerRow - enemyRow) * cellSize * travelYRatio;
                    const attackTravelPx = Math.max(minTravel, Math.min(maxTravel, travelRaw));
                    const attackTravelYPx = Math.max(-maxTravelY, Math.min(maxTravelY, travelYRaw));
                    const dragAim =
                      dragState !== null &&
                      dragState.hoveredEnemyId === enemy.id &&
                      (dragState.type === 'attack' || (SKILLS_META[dragState.type === 'skill' ? dragState.skillId : '']?.targetScope ?? 'enemy') === 'enemy');
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
                        onHover={setHoveredEnemyId}
                      />
                    );
                  } else {
                    cells[idx] = (
                      <BattleUnitCardBase key={`enemy-slot-${i}`} subtitle="" className="w-full">
                        <div className="h-full flex items-center justify-center">
                          <div className="w-8 h-8 rounded-sm border border-stone-800/50 bg-stone-900/30" />
                        </div>
                      </BattleUnitCardBase>
                    );
                  }
                });

                return cells.map((cell, idx) => (
                  <div key={idx} className="w-full h-full">{cell}</div>
                ));
              })()}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent" />
        </div>

        <AnimatePresence>
          {hoveredEnemy && (
            <EnemyDetailPanel key={hoveredEnemy.id} enemy={hoveredEnemy} />
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 flex-1 min-h-[220px] relative z-10">
        <div className="w-56 rounded-sm border border-stone-800/50 bg-stone-900/30 p-3 flex flex-col gap-2">
          <div className="text-[10px] font-display uppercase text-stone-500 tracking-[0.3em] flex items-center gap-1.5">
            <Swords size={12} /> Actions
          </div>

          {isFighting && (
            <div className="mt-0.5">
              <div className="flex items-center justify-between text-[9px] text-stone-500 mb-0.5">
                <span className="flex items-center gap-1"><Zap size={8} className="text-indigo-400" />能量</span>
                <span className="font-mono text-indigo-300">{session.player.currentEnergy}/{session.player.maxEnergy}</span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-900 border border-stone-800/60 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                  animate={{ width: `${(session.player.currentEnergy / Math.max(1, session.player.maxEnergy)) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {isWaveTransitioning && (
            <div className="text-[10px] px-2 py-1 rounded-sm border border-amber-700/40 bg-amber-900/20 text-amber-300">
              敌军换阵中...
            </div>
          )}

          {isFighting && (
            <motion.div
              className={`w-full px-3 py-2.5 rounded-sm font-display text-sm font-semibold border relative overflow-hidden select-none cursor-grab active:cursor-grabbing transition-all duration-200 ${
                dragState?.type === 'attack'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400/60 text-amber-50 shadow-lg shadow-amber-900/30'
                  : 'bg-gradient-to-r from-red-800 to-red-700 border-red-600/50 text-red-100 hover:from-red-700 hover:to-red-600'
              }`}
              whileHover={actionEnabled ? { scale: 1.02 } : {}}
              onPointerDown={(e) => {
                if (!actionEnabled) return;
                e.currentTarget.releasePointerCapture(e.pointerId);
                setDragState({ type: 'attack', x: e.clientX, y: e.clientY, hoveredEnemyId: null });
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
                <GripHorizontal size={12} className="opacity-60" />
                <Sword size={14} strokeWidth={2} />
                {t('battle.attack')}
              </span>
            </motion.div>
          )}

          <motion.button
            type="button"
            onClick={onRetreat}
            disabled={!actionEnabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-3 py-2 rounded-sm bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-400 hover:text-stone-300 text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            ↩ Retreat
          </motion.button>

          {onSkill && isFighting && session.player.skills.length > 0 && (
            <div className="mt-1 pt-2 border-t border-stone-800/50">
              <div className="text-[9px] text-stone-600 uppercase tracking-wider mb-1.5">Skills</div>
              <div className="flex flex-col gap-1.5">
                {session.player.skills.map((skillId) => {
                  const meta = SKILLS_META[skillId] ?? {};
                  const cost = meta.energyCost ?? 0;
                  const cd = session.player.skillCooldowns[skillId] ?? 0;
                  const noEnergy = session.player.currentEnergy < cost;
                  const disabled = cd > 0 || noEnergy;
                  const skillIcon = meta.icon ?? '✨';
                  const name = meta.displayName ?? skillId;
                  return (
                    <motion.div
                      key={skillId}
                      onPointerDown={(e) => {
                        if (!actionEnabled) return;
                        if (disabled) {
                          fireNoTargetToast();
                          return;
                        }
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        setDragState({ type: 'skill', skillId, x: e.clientX, y: e.clientY, hoveredEnemyId: null });
                      }}
                      onClick={() => {
                        if (!disabled) fireNoTargetToast();
                      }}
                      whileHover={disabled ? {} : { scale: 1.02 }}
                      whileTap={disabled ? {} : { scale: 0.97 }}
                      title={meta.description ?? name}
                      className={`w-full px-2 py-1.5 rounded-sm border text-xs transition-all flex items-start gap-1.5 text-left cursor-grab active:cursor-grabbing select-none ${
                        disabled
                          ? 'bg-stone-900/40 border-stone-800/30 text-stone-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-900/30 to-violet-900/20 border-indigo-700/30 text-indigo-200 hover:border-indigo-500/50'
                      }`}
                    >
                      <span className="mt-px shrink-0">{skillIcon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium leading-tight truncate">{name}</span>
                        <span className={`flex items-center gap-1.5 text-[9px] mt-0.5 ${disabled ? 'text-stone-700' : 'text-indigo-400/70'}`}>
                          <Zap size={8} />
                          <span className={noEnergy && cd === 0 ? 'text-red-400' : ''}>{cost}</span>
                          {cd > 0 && <span className="ml-auto text-amber-500/80">CD {cd}</span>}
                        </span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto pt-2 border-t border-stone-800/30">
            <div className="text-[9px] text-stone-600 font-mono">
              Wave {Math.min(displayWaveIndex + 1, waveOrder.length)}/{waveOrder.length} • Turn {session.turn}
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-sm border border-stone-800/50 bg-stone-900/30 p-3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between text-[10px] uppercase text-stone-500 tracking-[0.3em] mb-2">
            <span className="flex items-center gap-1.5">
              <Scroll size={12} /> Battle Log
            </span>
            <span className="font-mono text-stone-600">Turn {session.turn}</span>
          </div>
          <div className="flex-1 overflow-auto space-y-0.5 text-[11px] font-mono pr-1">
            {session.logs.slice(-(UI_CFG.battleView?.log?.displayLimit ?? 50)).map((line, index) => (
              <motion.div
                key={`${line}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`border-l-2 pl-2 py-0.5 ${
                  line.includes('伤害')
                    ? 'border-red-500/40 text-red-200/70'
                    : line.includes('回血') || line.includes('护盾')
                    ? 'border-green-500/40 text-green-200/70'
                    : line.includes('🗡️') || line.includes('🔥') || line.includes('->')
                    ? 'border-amber-500/40 text-amber-200/70'
                    : line.includes('[CD]') || line.includes('[MP]')
                    ? 'border-orange-500/30 text-orange-300/60'
                    : 'border-stone-700/30 text-stone-400'
                }`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const BattleView = memo(BattleViewInner);
