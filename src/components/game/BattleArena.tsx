import { motion } from 'motion/react';
import { Flame, Skull, Swords, Bot } from 'lucide-react';
import type { BattleState, BossTheme } from '../../types/game';
import { DropAnimation } from './DropAnimation';
import { MonsterCard } from './MonsterCard';
import { PlayerAvatar } from './PlayerAvatar';

interface BattleArenaProps {
  battleState: BattleState;
  loading: boolean;
  onChallengeMonster: () => void;
  onChallengeBoss: () => void;
  onChallengeWave: () => void;
  autoBattleEnabled: boolean;
  onToggleAutoBattle: () => void;
}

const bossThemeArenaStyles: Record<BossTheme, { arena: string; overlay: string; phaseColor: string; laneColor: string }> = {
  abyss: {
    arena: 'bg-gradient-to-br from-violet-950/90 via-fuchsia-950/60 to-slate-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(147,51,234,0.3),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(217,70,239,0.2),transparent_42%)]',
    phaseColor: 'text-violet-300',
    laneColor: 'rgba(147, 51, 234, 0.5)',
  },
  dragonfire: {
    arena: 'bg-gradient-to-br from-orange-950/90 via-red-950/60 to-zinc-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(249,115,22,0.28),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(239,68,68,0.2),transparent_42%)]',
    phaseColor: 'text-orange-300',
    laneColor: 'rgba(249, 115, 22, 0.5)',
  },
  iron: {
    arena: 'bg-gradient-to-br from-slate-900 via-zinc-900 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(148,163,184,0.22),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(161,161,170,0.18),transparent_42%)]',
    phaseColor: 'text-slate-300',
    laneColor: 'rgba(148, 163, 184, 0.5)',
  },
  necro: {
    arena: 'bg-gradient-to-br from-emerald-950/90 via-lime-950/55 to-zinc-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.24),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(132,204,22,0.18),transparent_42%)]',
    phaseColor: 'text-emerald-300',
    laneColor: 'rgba(16, 185, 129, 0.5)',
  },
  storm: {
    arena: 'bg-gradient-to-br from-sky-950/90 via-cyan-950/55 to-slate-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.24),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(34,211,238,0.18),transparent_42%)]',
    phaseColor: 'text-sky-300',
    laneColor: 'rgba(14, 165, 233, 0.5)',
  },
  blood: {
    arena: 'bg-gradient-to-br from-rose-950/90 via-red-950/60 to-zinc-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(244,63,94,0.24),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(239,68,68,0.2),transparent_42%)]',
    phaseColor: 'text-rose-300',
    laneColor: 'rgba(244, 63, 94, 0.5)',
  },
  void: {
    arena: 'bg-gradient-to-br from-indigo-950/90 via-purple-950/60 to-slate-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(99,102,241,0.24),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(168,85,247,0.2),transparent_42%)]',
    phaseColor: 'text-indigo-300',
    laneColor: 'rgba(99, 102, 241, 0.5)',
  },
  clockwork: {
    arena: 'bg-gradient-to-br from-amber-950/90 via-yellow-950/55 to-zinc-950/90',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(245,158,11,0.24),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(234,179,8,0.18),transparent_42%)]',
    phaseColor: 'text-amber-300',
    laneColor: 'rgba(245, 158, 11, 0.5)',
  },
};

export function BattleArena({
  battleState,
  loading,
  onChallengeMonster,
  onChallengeBoss,
  onChallengeWave,
  autoBattleEnabled,
  onToggleAutoBattle,
}: BattleArenaProps) {
  const particles = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    left: `${(index * 37) % 100}%`,
    top: `${(index * 53) % 100}%`,
    delay: (index % 7) * 0.3,
    duration: 2.8 + (index % 5) * 0.6,
  }));

  const bossIdentity = battleState.currentMonsters.find((m) => m.isBoss)?.bossIdentity ?? battleState.currentMonster?.bossIdentity;
  const bossThemeStyle = bossIdentity ? bossThemeArenaStyles[bossIdentity.theme] : null;

  const defaultPhaseLabel =
    battleState.phase === 'entering'
      ? '怪物逼近中...'
      : battleState.phase === 'fighting'
        ? '激战进行中...'
        : battleState.phase === 'dying'
          ? '终结一击！'
          : battleState.phase === 'dropping'
            ? '战利品结算中...'
            : '准备迎敌';
  const phaseLabel =
    bossIdentity?.phasePrompts?.[battleState.phase === 'idle' ? 'entering' : battleState.phase] ?? defaultPhaseLabel;

  return (
    <div className={`relative h-full min-h-[420px] rounded-xl overflow-hidden border border-game-border/60 ${bossThemeStyle?.arena ?? 'bg-gradient-to-br from-[#1b1029] via-[#2a1020] to-[#140f1f]'}`}>
      <div className={`absolute inset-0 pointer-events-none ${bossThemeStyle?.overlay ?? 'bg-[radial-gradient(circle_at_18%_20%,rgba(139,92,246,0.22),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(239,68,68,0.18),transparent_42%)]'}`} />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,22,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_4px,6px_100%]" />
      </div>

      {battleState.phase === 'fighting' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2)_0%,transparent_70%)]" />
        </motion.div>
      )}
      
      {battleState.phase === 'dying' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.4)_0%,transparent_60%)]"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}

      {battleState.phase === 'dropping' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.3)_0%,transparent_60%)]"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{ left: particle.left, top: particle.top }}
          animate={{ opacity: [0.1, 0.7, 0.1], y: [0, -10, 0] }}
          transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
        />
      ))}

      <div className="relative z-10 h-full p-4 sm:p-6 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-end"
        >
          <div className="flex items-center gap-2">
            {battleState.elementLabel && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-2 py-0.5 rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[10px] tracking-normal flex items-center gap-1"
              >
                <span className="text-xs">⚡</span> {battleState.elementLabel}
              </motion.span>
            )}
            <motion.span 
              className={`${battleState.isBossBattle ? (bossThemeStyle?.phaseColor ?? 'text-red-400') : 'text-violet-400'} font-medium text-xs uppercase tracking-[0.15em]`}
              animate={battleState.phase === 'fighting' ? { scale: [1, 1.08, 1], textShadow: ['0_0_5px_currentColor', '0_0_20px_currentColor', '0_0_5px_currentColor'] } : {}}
              transition={{ duration: 0.6, repeat: battleState.phase === 'fighting' ? Infinity : 0 }}
            >
              {phaseLabel}
            </motion.span>
            {battleState.waveContext && (
              <motion.span
                className="text-xs text-emerald-200 ml-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {`波 ${battleState.waveContext.currentWave}/${battleState.waveContext.totalWaves}`}
                &nbsp;({battleState.waveContext.remainingInWave}剩)
              </motion.span>
            )}
          </div>
        </motion.div>

        <div className="flex-1 mt-4 rounded-xl border border-white/10 bg-black/20 px-4 sm:px-8 py-6 flex items-end justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-red-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          
          <div className="self-center relative z-10">
            <PlayerAvatar
              phase={battleState.phase}
              hpPercent={battleState.playerHpPercent}
              showAttackFlash={battleState.showAttackFlash}
            />
            {battleState.playerStatusLabel && (
              <motion.div
                key={`player-status-${battleState.playerStatusLabel}-${battleState.playerHpPercent}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border border-rose-400/40 bg-rose-500/15 text-rose-200"
              >
                {battleState.playerStatusLabel}
              </motion.div>
            )}
            {battleState.playerDamageLabel && (
              <motion.div
                key={`player-hit-${battleState.playerDamageLabel}-${battleState.playerHpPercent}`}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: -16, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute -right-2 top-8 text-sm font-bold text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]"
              >
                {battleState.playerDamageLabel}
              </motion.div>
            )}
          </div>

          <motion.div
            className="flex-1 h-px border-t border-dashed border-white/20 relative z-10"
            animate={battleState.phase === 'fighting' ? { opacity: [0.3, 1, 0.3], boxShadow: ['0_0_0px_currentColor', '0_0_10px_currentColor', '0_0_0px_currentColor'] } : { opacity: 0.35 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={
              battleState.phase === 'fighting'
                ? {
                    borderColor: bossThemeStyle?.laneColor ?? 'rgba(139, 92, 246, 0.5)',
                    boxShadow: `0 0 5px ${bossThemeStyle?.laneColor ?? 'rgba(139, 92, 246, 0.3)'}`,
                  }
                : undefined
            }
          />

          <div className="self-center min-w-[220px] max-w-[420px] flex justify-end relative z-10 overflow-visible">
            {battleState.currentMonsters.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-end">
                {battleState.currentMonsters.map((monster, index) => {
                  const hpPercent = battleState.monsterHpPercents[index] ?? battleState.monsterHpPercent;
                  const statusLabel = battleState.monsterStatusLabels[index] || '';
                  const damageLabel = battleState.monsterDamageLabels[index] || '';
                  return (
                    <div key={`${monster.id}-${index}`} className="relative">
                      <MonsterCard
                        monster={monster}
                        phase={battleState.phase}
                        hpPercent={hpPercent}
                      />
                      {statusLabel && (
                        <motion.div
                          key={`monster-status-${index}-${statusLabel}-${hpPercent}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border border-purple-400/40 bg-purple-500/15 text-purple-200"
                        >
                          {statusLabel}
                        </motion.div>
                      )}
                      {damageLabel && (
                        <motion.div
                          key={`monster-hit-${index}-${damageLabel}-${hpPercent}`}
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: -20, scale: 1.02 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="absolute -left-5 top-10 text-base font-extrabold text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
                        >
                          {damageLabel}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400">等待下一组怪物...</div>
            )}
          </div>

          <DropAnimation visible={battleState.showDropAnimation} label={battleState.dropLabel} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.button
            onClick={onChallengeMonster}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_20px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/50 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Skull size={16} className="text-violet-400" /> 挑战怪物</span>
          </motion.button>
          <motion.button
            onClick={onChallengeBoss}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_20px rgba(244, 63, 94, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Flame size={16} className="text-red-400" /> 挑战 BOSS</span>
          </motion.button>

          <motion.button
            onClick={onChallengeWave}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_20px rgba(16, 185, 129, 0.35)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-emerald-500/40 bg-emerald-950/35 hover:bg-emerald-900/45 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Swords size={16} className="text-emerald-400" /> 群怪来袭</span>
            <span className="text-xs text-emerald-200/70 block relative z-10">一次清剿 5 只怪物</span>
          </motion.button>

          <motion.button
            onClick={onToggleAutoBattle}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: autoBattleEnabled ? '0_0_20px rgba(16, 185, 129, 0.4)' : '0_0_20px rgba(148, 163, 184, 0.25)' }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-xl px-4 py-3 border disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group ${autoBattleEnabled ? 'border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50' : 'border-slate-500/35 bg-slate-900/40 hover:bg-slate-800/50'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${autoBattleEnabled ? 'from-emerald-500/0 via-emerald-500/10 to-emerald-500/0' : 'from-slate-500/0 via-slate-500/10 to-slate-500/0'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`} />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Bot size={16} className={autoBattleEnabled ? 'text-emerald-400' : 'text-slate-300'} /> 自动出怪</span>
            <span className={`text-xs block relative z-10 ${autoBattleEnabled ? 'text-emerald-200/70' : 'text-slate-300/70'}`}>{autoBattleEnabled ? '状态：运行中（自动连战）' : '状态：已关闭'}</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}
