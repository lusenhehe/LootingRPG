import { motion } from 'motion/react';
import { Flame, Skull, Swords, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    arena: 'bg-gradient-to-br from-stone-950 via-red-950/80 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(180,83,9,0.15),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(153,27,27,0.12),transparent_42%)]',
    phaseColor: 'text-amber-600',
    laneColor: 'rgba(180, 83, 9, 0.5)',
  },
  dragonfire: {
    arena: 'bg-gradient-to-br from-stone-950 via-orange-950/70 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(249,115,22,0.15),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(220,38,38,0.1),transparent_42%)]',
    phaseColor: 'text-orange-600',
    laneColor: 'rgba(249, 115, 22, 0.5)',
  },
  iron: {
    arena: 'bg-gradient-to-br from-stone-950 via-zinc-800/40 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(120,113,108,0.12),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(87,83,78,0.1),transparent_42%)]',
    phaseColor: 'text-stone-500',
    laneColor: 'rgba(120, 113, 108, 0.5)',
  },
  necro: {
    arena: 'bg-gradient-to-br from-stone-950 via-emerald-950/60 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(21,128,61,0.12),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(132,204,22,0.08),transparent_42%)]',
    phaseColor: 'text-emerald-700',
    laneColor: 'rgba(21, 128, 61, 0.5)',
  },
  storm: {
    arena: 'bg-gradient-to-br from-stone-950 via-slate-800/50 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(100,116,139,0.12),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(148,162,165,0.08),transparent_42%)]',
    phaseColor: 'text-slate-500',
    laneColor: 'rgba(100, 116, 139, 0.5)',
  },
  blood: {
    arena: 'bg-gradient-to-br from-stone-950 via-red-950/70 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(153,27,27,0.18),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(220,38,38,0.12),transparent_42%)]',
    phaseColor: 'text-red-700',
    laneColor: 'rgba(153, 27, 27, 0.5)',
  },
  void: {
    arena: 'bg-gradient-to-br from-stone-950 via-zinc-900/60 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(82,82,89,0.1),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(113,113,122,0.08),transparent_42%)]',
    phaseColor: 'text-zinc-500',
    laneColor: 'rgba(82, 82, 89, 0.5)',
  },
  clockwork: {
    arena: 'bg-gradient-to-br from-stone-950 via-amber-950/60 to-stone-950',
    overlay: 'bg-[radial-gradient(circle_at_20%_18%,rgba(217,119,6,0.12),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(202,138,4,0.08),transparent_42%)]',
    phaseColor: 'text-amber-700',
    laneColor: 'rgba(217, 119, 6, 0.5)',
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
  const { t } = useTranslation();
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
      ? t('battle.phase.entering')
      : battleState.phase === 'fighting'
        ? t('battle.phase.fighting')
        : battleState.phase === 'dying'
          ? t('battle.phase.dying')
          : battleState.phase === 'dropping'
            ? t('battle.phase.dropping')
            : t('battle.phase.idle');
  const phaseLabel =
    bossIdentity?.phasePrompts?.[battleState.phase === 'idle' ? 'entering' : battleState.phase] ?? defaultPhaseLabel;

  return (
    <div className={`relative h-full min-h-[420px] rounded-xl overflow-hidden border border-stone-700/60 ${bossThemeStyle?.arena ?? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950'}`}>
      <div className={`absolute inset-0 pointer-events-none ${bossThemeStyle?.overlay ?? 'bg-[radial-gradient(circle_at_18%_20%,rgba(180,83,9,0.1),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(153,27,27,0.08),transparent_42%)]'}`} />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(10,9,8,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(180,83,9,0.03),rgba(0,0,0,0.02),rgba(0,0,0,0.03))] z-[1] bg-[length:100%_4px,6px_100%]" />
      </div>

      {battleState.phase === 'fighting' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.1)_0%,transparent_70%)]" />
        </motion.div>
      )}
      
      {battleState.phase === 'dying' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.25)_0%,transparent_60%)]"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}

      {battleState.phase === 'dropping' && (
        <motion.div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.2)_0%,transparent_60%)]"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-amber-700/40"
          style={{ left: particle.left, top: particle.top }}
          animate={{ opacity: [0.05, 0.5, 0.05], y: [0, -8, 0] }}
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
                className="px-2 py-0.5 rounded-md border border-cyan-800/40 bg-cyan-950/30 text-cyan-500 text-[10px] tracking-normal flex items-center gap-1"
              >
                <span className="text-xs">⚡</span> {battleState.elementLabel}
              </motion.span>
            )}
            <motion.span 
              className={`${battleState.isBossBattle ? (bossThemeStyle?.phaseColor ?? 'text-red-700') : 'text-amber-700'} font-medium text-xs uppercase tracking-[0.15em] candle-glow`}
              animate={battleState.phase === 'fighting' ? { scale: [1, 1.08, 1], textShadow: ['0_0_2px_currentColor', '0_0_8px_currentColor', '0_0_2px_currentColor'] } : {}}
              transition={{ duration: 0.6, repeat: battleState.phase === 'fighting' ? Infinity : 0 }}
            >
              {phaseLabel}
            </motion.span>
            {battleState.waveContext && (
              <motion.span
                className="text-xs text-emerald-600 ml-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {t('battle.wave_display', { current: battleState.waveContext.currentWave, total: battleState.waveContext.totalWaves, remaining: battleState.waveContext.remainingInWave })}
              </motion.span>
            )}
          </div>
        </motion.div>

        <div className="flex-1 mt-4 rounded-xl border border-stone-700/40 bg-black/30 px-4 sm:px-8 py-6 flex items-end justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/5 via-transparent to-red-900/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
          
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
                className="absolute -top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border border-rose-800/40 bg-rose-950/30 text-rose-400"
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
                className="absolute -right-2 top-8 text-sm font-bold text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]"
              >
                {battleState.playerDamageLabel}
              </motion.div>
            )}
          </div>

          <motion.div
            className="flex-1 h-px border-t border-dashed border-stone-600/40 relative z-10"
            animate={battleState.phase === 'fighting' ? { opacity: [0.3, 1, 0.3], boxShadow: ['0_0_0px_currentColor', '0_0_8px_currentColor', '0_0_0px_currentColor'] } : { opacity: 0.35 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={
              battleState.phase === 'fighting'
                ? {
                    borderColor: bossThemeStyle?.laneColor ?? 'rgba(180, 83, 9, 0.4)',
                    boxShadow: `0 0 3px ${bossThemeStyle?.laneColor ?? 'rgba(180, 83, 9, 0.3)'}`,
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
                          className="absolute -top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border border-amber-800/40 bg-amber-950/30 text-amber-500"
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
                          className="absolute -left-5 top-10 text-base font-extrabold text-amber-400 drop-shadow-[0_0_8px_rgba(217,119,6,0.7)]"
                        >
                          {damageLabel}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-stone-500">{t('battle.waiting_next_wave')}</div>
            )}
          </div>

          <DropAnimation visible={battleState.showDropAnimation} label={battleState.dropLabel} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.button
            onClick={onChallengeMonster}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_15px rgba(180, 83, 9, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-amber-700/40 bg-stone-900/60 hover:bg-stone-800/70 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-700/0 via-amber-700/5 to-amber-700/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Skull size={16} className="text-amber-600" /> {t('button.challenge_monster')}</span>
          </motion.button>
          <motion.button
            onClick={onChallengeBoss}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_15px rgba(153, 27, 27, 0.35)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-red-900/40 bg-stone-900/60 hover:bg-stone-800/70 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-900/5 to-red-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Flame size={16} className="text-red-700" /> {t('button.challenge_boss')}</span>
          </motion.button>

          <motion.button
            onClick={onChallengeWave}
            disabled={loading || battleState.phase !== 'idle'}
            whileHover={{ scale: 1.02, boxShadow: '0_0_15px rgba(21, 128, 61, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-xl px-4 py-3 border border-emerald-900/40 bg-stone-900/60 hover:bg-stone-800/70 disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/0 via-emerald-900/5 to-emerald-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Swords size={16} className="text-emerald-700" /> {t('button.challenge_wave')}</span>
            <span className="text-xs text-stone-400 block relative z-10">{t('battle.wave_note')}</span>
          </motion.button>

          <motion.button
            onClick={onToggleAutoBattle}
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: autoBattleEnabled ? '0_0_15px rgba(21, 128, 61, 0.35)' : '0_0_15px rgba(87, 83, 78, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-xl px-4 py-3 border disabled:opacity-45 disabled:cursor-not-allowed text-left relative overflow-hidden group ${autoBattleEnabled ? 'border-emerald-800/50 bg-stone-900/60 hover:bg-stone-800/70' : 'border-stone-700/40 bg-stone-900/60 hover:bg-stone-800/70'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${autoBattleEnabled ? 'from-emerald-900/0 via-emerald-900/5 to-emerald-900/0' : 'from-stone-700/0 via-stone-700/5 to-stone-700/0'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`} />
            <span className="flex items-center gap-2 text-sm font-semibold relative z-10"><Bot size={16} className={autoBattleEnabled ? 'text-emerald-600' : 'text-stone-500'} /> {t('battle.auto_spawn')}</span>
            <span className={`text-xs block relative z-10 ${autoBattleEnabled ? 'text-emerald-500/80' : 'text-stone-500/70'}`}>{autoBattleEnabled ? t('battle.auto_state_on') : t('battle.auto_state_off')}</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}
