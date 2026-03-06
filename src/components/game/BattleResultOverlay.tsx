import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import battleUiJson from '@data/config/game/battleUi.json';

interface BattleResultOverlayProps {
  status: 'victory' | 'defeat' | 'fighting';
  onClose: () => void;
}

const UI_CFG = battleUiJson as unknown as {
  resultOverlay?: {
    buttonText?: string;
    title?: { victory?: string; defeat?: string };
    subtitle?: { victory?: string; defeat?: string };
    durations?: {
      overlayFade?: number;
      entryDelay?: number;
      entrySpringStiffness?: number;
      entrySpringDamping?: number;
      iconVictoryLoop?: number;
      iconDefeatLoop?: number;
      dividerReveal?: number;
      buttonRevealDelay?: number;
    };
    effects?: { victoryParticleCount?: number; defeatCrackCount?: number };
  };
};

/** 战斗胜利/失败结算动画覆盖层 */
function BattleResultOverlayInner({ status, onClose }: BattleResultOverlayProps) {
  const isVisible = status === 'victory' || status === 'defeat';
  const isVictory = status === 'victory';
  const resultCfg = UI_CFG.resultOverlay;
  const durations = resultCfg?.durations;
  const effects = resultCfg?.effects;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations?.overlayFade ?? 0.4 }}
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ backdropFilter: 'blur(3px)' }}
        >
          {/* 背景遮罩 */}
          <div
            className={`absolute inset-0 ${
              isVictory
                ? 'bg-gradient-to-b from-emerald-950/80 via-stone-950/70 to-stone-950/80'
                : 'bg-gradient-to-b from-red-950/85 via-stone-950/75 to-stone-950/85'
            }`}
          />

          {/* 粒子效果（胜利时） */}
          {isVictory && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: effects?.victoryParticleCount ?? 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: `${10 + (i % 9) * 10}%`,
                    background: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#10b981' : '#6366f1',
                  }}
                  initial={{ y: '110%', opacity: 0.9 }}
                  animate={{ y: '-20%', opacity: 0, x: (i % 2 === 0 ? 1 : -1) * (20 + i * 8) }}
                  transition={{ duration: 1.5 + (i % 5) * 0.3, delay: i * 0.07, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}

          {/* 失败时的裂缝效果 */}
          {!isVictory && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: effects?.defeatCrackCount ?? 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-full w-px bg-red-600/30"
                  style={{ left: `${15 + i * 18}%` }}
                  initial={{ scaleY: 0, originY: '50%' }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                />
              ))}
            </div>
          )}

          {/* 主内容卡片 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: durations?.entrySpringStiffness ?? 260,
              damping: durations?.entrySpringDamping ?? 20,
              delay: durations?.entryDelay ?? 0.1,
            }}
            className={`relative z-10 flex flex-col items-center gap-6 px-16 py-10 rounded-sm border ${
              isVictory
                ? 'bg-gradient-to-b from-emerald-950/90 to-stone-950/95 border-emerald-600/40 shadow-[0_0_60px_8px_rgba(16,185,129,0.25)]'
                : 'bg-gradient-to-b from-red-950/90 to-stone-950/95 border-red-700/40 shadow-[0_0_60px_8px_rgba(239,68,68,0.25)]'
            }`}
          >
            {/* 图标 */}
            <motion.div
              animate={isVictory ? { rotateY: [0, 360] } : { scale: [1, 1.1, 1] }}
              transition={{
                duration: isVictory ? (durations?.iconVictoryLoop ?? 1.2) : (durations?.iconDefeatLoop ?? 0.8),
                delay: 0.4,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isVictory
                  ? 'bg-gradient-to-br from-emerald-600/30 to-emerald-900/50 border-2 border-emerald-500/50 shadow-[0_0_24px_4px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-br from-red-700/30 to-red-950/50 border-2 border-red-600/50 shadow-[0_0_24px_4px_rgba(239,68,68,0.4)]'
              }`}
            >
              {isVictory
                ? <Trophy size={36} className="text-emerald-300" />
                : <Skull size={36} className="text-red-400" />
              }
            </motion.div>

            {/* 标题 */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, letterSpacing: '0.5em' }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className={`text-3xl font-display font-bold uppercase ${
                  isVictory ? 'text-emerald-300' : 'text-red-400'
                }`}
              >
                {isVictory ? (resultCfg?.title?.victory ?? 'VICTORY') : (resultCfg?.title?.defeat ?? 'DEFEAT')}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-stone-500 font-mono mt-2 tracking-widest uppercase"
              >
                {isVictory ? (resultCfg?.subtitle?.victory ?? '战斗胜利！') : (resultCfg?.subtitle?.defeat ?? '战斗失败，下次再来！')}
              </motion.div>
            </div>

            {/* 分割线 */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: durations?.dividerReveal ?? 0.5 }}
              className={`w-48 h-px ${isVictory ? 'bg-emerald-700/50' : 'bg-red-800/50'}`}
            />

            {/* 返回按钮 */}
            <motion.button
              type="button"
              onClick={onClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: durations?.buttonRevealDelay ?? 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-sm font-display font-semibold text-sm border transition-all ${
                isVictory
                  ? 'bg-emerald-800/40 border-emerald-600/50 text-emerald-200 hover:bg-emerald-700/50'
                  : 'bg-red-900/40 border-red-700/50 text-red-200 hover:bg-red-800/50'
              }`}
            >
              <RotateCcw size={14} />
              {resultCfg?.buttonText ?? '返回地图'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const BattleResultOverlay = memo(BattleResultOverlayInner);
export default BattleResultOverlay;
