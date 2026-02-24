import { AnimatePresence, motion } from 'motion/react';
import type { BattlePhase } from '../../types/game';
import { useTranslation } from 'react-i18next';

interface PlayerAvatarProps {
  phase: BattlePhase;
  hpPercent: number;
  showAttackFlash: boolean;
}

export function PlayerAvatar({ phase, hpPercent, showAttackFlash }: PlayerAvatarProps) {
  const { t } = useTranslation();
  return (
    <div className="relative w-[170px]">
      <motion.div
        className="relative rounded-2xl border border-red-700/50 bg-red-950/30 p-4 backdrop-blur-sm"
        animate={phase === 'fighting' ? { x: [0, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.35, repeat: phase === 'fighting' ? Infinity : 0, repeatDelay: 0.2 }}
      >
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-red-800/20 to-red-900/20 blur opacity-50" />
        <div className="text-center space-y-2 relative">
          <div className="leading-none text-6xl filter drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">🧙‍♂️</div>
          <div className="font-display text-sm tracking-wide text-red-200 drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">{t('player.avatarTitle')}</div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-white/10 border border-white/10 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-red-700 to-red-900 relative"
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAttackFlash && (
          <motion.div
            className="absolute inset-y-8 -right-6 w-24 rounded-full bg-gradient-to-r from-yellow-300/80 to-transparent blur-sm"
            initial={{ opacity: 0, x: -16, scaleX: 0.4 }}
            animate={{ opacity: [0, 1, 0], x: [0, 20, 40], scaleX: [0.6, 1.1, 1.2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
