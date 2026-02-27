import { useTranslation } from 'react-i18next';
import type { BattleSession } from '../../shared/types/game';
import PlayerCard from './PlayerCard';
import EnemyCard from './EnemyCard';
import BattleUnitCardBase from './BattleUnitCardBase';
import TurnOrderBar from './TurnOrderBar';
import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Swords, Skull, ChevronRight, Scroll } from 'lucide-react';

interface BattleViewProps {
  session: BattleSession;
  onAttack: (targetId?: string) => void;
  onRetreat: () => void;
  onSkill?: (skillId: string, targetId?: string) => void;
}


function BattleViewInner({ session, onAttack, onRetreat, onSkill }: BattleViewProps) {
  const { t } = useTranslation();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== 'fighting') setSelectedTargetId(null);
  }, [session.turn, session.status]);

  const handleSelectTarget = useCallback((enemyId: string) => {
    setSelectedTargetId((prev) => (prev === enemyId ? null : enemyId));
  }, []);

  const handleAttack = useCallback(() => {
    onAttack(selectedTargetId ?? undefined);
    setSelectedTargetId(null);
  }, [onAttack, selectedTargetId]);

  const handleSkill = useCallback((skillId: string) => {
    if (!onSkill) return;
    onSkill(skillId, selectedTargetId ?? undefined);
    setSelectedTargetId(null);
  }, [onSkill, selectedTargetId]);

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
  const currentWaveId = waveOrder[safeWaveIndex];
  const currentWaveEnemies = (session.enemies ?? []).filter((enemy) => {
    if (!currentWaveId) return true;
    const waveId = enemy.meta?.waveId;
    return (typeof waveId === 'string' ? waveId : 'wave-1') === currentWaveId;
  });

  const leftSlotCount = 6;
  const rightEnemies = currentWaveEnemies.slice(0, 9);

  const isVictory = session.status === 'victory';
  const isDefeat = session.status === 'defeat';
  const isFighting = session.status === 'fighting';

  const cellSize = 96; // should match the CSS grid cell size in the JSX below
  const mapSize = [8, 3]; // cols, rows

  return (
    <div className="fantasy-panel rounded-sm p-4 flex flex-col h-[72vh] max-h-[900px] min-h-[480px] gap-3 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-amber-700/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-amber-700/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-amber-700/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-amber-700/30 rounded-br-lg" />
        
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
                {Math.min(safeWaveIndex + 1, waveOrder.length)}
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

      <TurnOrderBar session={session} />

      <div className="relative z-10 rounded-sm border border-stone-800/60 bg-stone-950/50 overflow-hidden">        
        <div 
          className="absolute inset-0 pointer-events-none "
          style={{
            backgroundSize: `${cellSize}px ${cellSize}px`,
            backgroundImage: `
              linear-gradient(to right, rgba(180, 83, 9, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(180, 83, 9, 0.08) 1px, transparent 1px)
            `,
          }}
        />

        <div className="relative overflow-hidden" style={{ width: `${cellSize * mapSize[0]}px`, height: `${cellSize * mapSize[1]}px` }}>
          <div
            className="grid"
            style={{
              width: `${cellSize  * mapSize[0]}px`,
              height: `${cellSize * mapSize[1]}px`,
              gridTemplateRows: `repeat(${mapSize[1]}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${mapSize[0]}, ${cellSize}px)`,
            }}
          >
            {(() => {
              const rows = mapSize[1];
              const cols = mapSize[0];
              const total = rows * cols;
              const leftIdx  = [0,1,8,9,16,17];
              const rightIdx = [5,6,7,13,14,15,21,22,23];
              const cells: React.ReactNode[] = Array(total).fill(null);
              const leftSlots: React.ReactNode[] = [];
              for (let i = 0; i < leftSlotCount; i++) {
                if (i === 3) {
                  const playerActive = session.phase === 'player_input' || session.phase === 'resolving';
                  leftSlots.push(<PlayerCard key="player" session={session} isActive={playerActive && session.status === 'fighting'} />);
                } else {
                  leftSlots.push(
                    <BattleUnitCardBase
                      key={`ally-slot-${i}`}
                      subtitle=""
                      className="w-full"
                    >
                      <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-sm border border-stone-800/50 bg-stone-900/30" />
                      </div>
                    </BattleUnitCardBase>
                  );
                }
              }
              leftIdx.forEach((idx, i) => {
                cells[idx] = leftSlots[i] || null;
              });

              rightIdx.forEach((idx, i) => {
                const enemy = rightEnemies[i];
                if (enemy) {
                  const enemyActive = session.phase === 'enemy_turn' && session.status === 'fighting';
                  const canTarget = session.phase === 'player_input' && session.status === 'fighting' && enemy.currentHp > 0;
                  cells[idx] = (
                    <EnemyCard
                      key={enemy.id}
                      enemy={enemy}
                      isActive={enemyActive}
                      isSelected={selectedTargetId === enemy.id}
                      onClick={canTarget ? handleSelectTarget : undefined}
                    />
                  );
                } else {
                  cells[idx] = (
                    <BattleUnitCardBase
                      key={`enemy-slot-${i}`}
                      subtitle=""
                      className="w-full"
                    >
                      <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-sm border border-stone-800/50 bg-stone-900/30" />
                      </div>
                    </BattleUnitCardBase>
                  );
                }
              });

              return cells.map((cell, idx) => (
                <div key={idx} className="w-full h-full">
                  {cell}
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent" />
      </div>

      <div className="flex gap-3 flex-1 min-h-[220px] relative z-10">
        <div className="w-56 rounded-sm border border-stone-800/50 bg-stone-900/30 p-3 flex flex-col gap-2">
          <div className="text-[10px] font-display uppercase text-stone-500 tracking-[0.3em] flex items-center gap-1.5">
            <Swords size={12} /> Actions
          </div>

          <AnimatePresence mode="wait">
            {isFighting && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`text-[10px] px-2 py-1.5 rounded-sm border transition-all duration-200 ${
                  selectedTargetId
                    ? 'bg-amber-900/20 text-amber-400 border-amber-700/40'
                    : 'text-stone-500 border-stone-800/50'
                }`}
              >
                {selectedTargetId
                  ? `➤ Target: ${(() => { const e = session.enemies.find(e => e.id === selectedTargetId); return e?.name ?? 'Target'; })()}`
                  : '➤ Select target (optional)'}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleAttack}
            disabled={!isFighting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-3 py-2.5 rounded-sm font-display text-sm font-semibold transition-all duration-200 border relative overflow-hidden group ${
              selectedTargetId
                ? 'bg-gradient-to-r from-amber-700 to-amber-600 border-amber-500/50 text-amber-100 hover:from-amber-600 hover:to-amber-500'
                : 'bg-gradient-to-r from-red-800 to-red-700 border-red-600/50 text-red-100 hover:from-red-700 hover:to-red-600'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sword size={14} strokeWidth={2} />
              {selectedTargetId ? t('battle.attack') + ' ➤' : t('battle.attack')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          <motion.button
            type="button"
            onClick={onRetreat}
            disabled={!isFighting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-3 py-2 rounded-sm bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-400 hover:text-stone-300 text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            ↩ Retreat
          </motion.button>

          {onSkill && isFighting && (
            <div className="mt-1 pt-2 border-t border-stone-800/50">
              <div className="text-[9px] text-stone-600 uppercase tracking-wider mb-1.5">Skills</div>
              <div className="flex flex-col gap-1">
                <motion.button
                  type="button"
                  onClick={() => handleSkill('poison_blade')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-2 py-1.5 rounded-sm bg-gradient-to-r from-green-900/40 to-green-800/30 border border-green-700/30 text-green-300 text-xs hover:border-green-600/50 transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Poison Blade
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleSkill('flame_shield')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-2 py-1.5 rounded-sm bg-gradient-to-r from-orange-900/40 to-orange-800/30 border border-orange-700/30 text-orange-300 text-xs hover:border-orange-600/50 transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Flame Shield
                </motion.button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-2 border-t border-stone-800/30">
            <div className="text-[9px] text-stone-600 font-mono">
              Wave {Math.min(safeWaveIndex + 1, waveOrder.length)}/{waveOrder.length} • Turn {session.turn}
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
            {session.logs.slice(-25).map((line, index) => (
              <motion.div
                key={`${line}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`border-l-2 pl-2 py-0.5 ${
                  line.includes('damage') || line.includes('Damage')
                    ? 'border-red-500/40 text-red-200/70'
                    : line.includes('heal') || line.includes('Heal')
                    ? 'border-green-500/40 text-green-200/70'
                    : line.includes('Skill')
                    ? 'border-amber-500/40 text-amber-200/70'
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
