import { useTranslation } from 'react-i18next';
import type { BattleSession } from '../../shared/types/game';
import PlayerCard from './PlayerCard';
import EnemyCard from './EnemyCard';
import BattleUnitCardBase from './BattleUnitCardBase';
import TurnOrderBar from './TurnOrderBar';
import { memo } from 'react';
interface BattleViewProps {
  session: BattleSession;
  onAttack: () => void;
  onRetreat: () => void;
  onSkill?: (skillId: string) => void;
}


function BattleViewInner({ session, onAttack, onRetreat, onSkill }: BattleViewProps) {
  const { t } = useTranslation();
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

  return (
    <div className="bg-gradient-to-br from-game-card/90 to-game-card/70 border border-game-border/40 rounded-2xl p-5 flex flex-col h-[68vh] max-h-[820px] min-h-[420px] gap-4">
      <div className="flex items-center justify-between border-b border-game-border/30 pb-3">
        <div>
          <div className="text-[11px] uppercase text-gray-400 tracking-[0.5em] flex items-center gap-2">
            <span>📍</span>
            <span>{session.chapterName}</span>
          </div>
          <div className="text-xl font-semibold text-white">{t('battle.title')}</div>
          <div className="text-[11px] uppercase text-gray-400 tracking-[0.5em]">{session.nodeName}</div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>{t('battle.turn')}: {session.turn}</div>
          <div>{t('battle.enemyProgress')}: {Math.min(safeWaveIndex + 1, waveOrder.length)} / {waveOrder.length}</div>
          <div className="text-[11px] uppercase tracking-[0.4em] mt-1">Rewards</div>
          <div className="text-sm text-white">—</div>
        </div>
      </div>

      {/* 行动顺序可视化条 */}
      <TurnOrderBar session={session} />

      {/* battlefield section with square grid background */}
      <div className="rounded-2xl border border-game-border/60 bg-black/20">
        <div className="relative overflow-auto" style={{ width:'768px', height:'288px' }}>
          {/* grid lines overlay covering grid area */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundSize: '96px 96px',
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),\
                 linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            }}
          />

          {/* fixed 3×8 battlefield grid with constant cell size */}
          <div
            className="grid"
            style={{
              width: `${96 * 8}px`,
              height: `${96 * 3}px`,
              gridTemplateRows: `repeat(3, ${96}px)`,
              gridTemplateColumns: `repeat(8, ${96}px)`,
              gap: '0px',
            }}
          >
          {(() => {
            const rows = 3;
            const cols = 8;
            const total = rows * cols;
            const leftIdx = [0,1,8,9,16,17];
            const rightIdx = [5,6,7,13,14,15,21,22,23];
            const cells: React.ReactNode[] = Array(total).fill(null);

            // fill left slots (placeholders with player in fourth position)
            const leftSlots: React.ReactNode[] = [];
            for (let i = 0; i < leftSlotCount; i++) {
              if (i === 3) {
                const playerActive = session.phase === 'player_input' || session.phase === 'resolving';
                leftSlots.push(<PlayerCard key="player" session={session} isActive={playerActive && session.status === 'fighting'} />);
              } else {
                leftSlots.push(
                  <BattleUnitCardBase
                    key={`ally-slot-${i}`}
                    subtitle="预留"
                    className="w-full"
                  >
                    <div className="h-full flex items-center justify-center text-xs text-gray-500">
                      Empty
                    </div>
                  </BattleUnitCardBase>
                );
              }
            }
            leftIdx.forEach((idx, i) => {
              cells[idx] = leftSlots[i] || null;
            });

            // fill right slots (enemies + placeholders)
            rightIdx.forEach((idx, i) => {
              const enemy = rightEnemies[i];
              if (enemy) {
                const enemyActive = session.phase === 'enemy_turn' && session.status === 'fighting';
                cells[idx] = <EnemyCard key={enemy.id} enemy={enemy} isActive={enemyActive} />;
              } else {
                cells[idx] = (
                  <BattleUnitCardBase
                    key={`enemy-slot-${i}`}
                    subtitle="空"
                    className="w-full"
                  >
                    <div className="h-full flex items-center justify-center text-xs text-gray-500">
                      Empty
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

      <div className="flex gap-4 flex-1 min-h-[230px]">
        <div className="w-[260px] rounded-2xl border border-game-border/60 bg-black/20 p-4 flex flex-col gap-3">
          <div className="text-[10px] uppercase text-gray-400 tracking-[0.4em]">Actions</div>
          <button
            type="button"
            onClick={onAttack}
            disabled={session.status !== 'fighting'}
            className="w-full px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm disabled:opacity-50"
          >
            {t('battle.attack')}
          </button>
          <button
            type="button"
            onClick={onRetreat}
            disabled={session.status !== 'fighting'}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm disabled:opacity-50"
          >
            {t('battle.retreat')}
          </button>
          {onSkill && session.status === 'fighting' && (
            <>
              <div className="mt-2 text-[10px] text-gray-400">Debug Skills</div>
              <button
                type="button"
                onClick={() => onSkill('poison_blade')}
                className="w-full px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs"
              >
                Poison Blade
              </button>
              <button
                type="button"
                onClick={() => onSkill('flame_shield')}
                className="w-full px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs mt-1"
              >
                Flame Shield
              </button>
            </>
          )}
          <div className="text-[11px] text-gray-500">
            {Math.min(safeWaveIndex + 1, waveOrder.length)} / {waveOrder.length}
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-game-border/60 bg-black/20 p-4 flex flex-col">
          <div className="flex items-center justify-between text-[10px] uppercase text-gray-400 tracking-[0.4em]">
            <span>battle log</span>
            <span>{t('battle.turn')}: {session.turn}</span>
          </div>
          <div className="mt-3 flex-1 overflow-auto space-y-1 text-xs text-gray-200 max-h-[180px]">
            {session.logs.slice(-30).map((line, index) => (
              <div key={`${line}-${index}`} className="border-b border-game-border/10 pb-1">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export const BattleView = memo(BattleViewInner);
