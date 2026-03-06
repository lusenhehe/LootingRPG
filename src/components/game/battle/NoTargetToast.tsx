import { AnimatePresence, motion } from 'motion/react';

interface NoTargetToastProps {
  visible: boolean;
  text?: string;
}

export function NoTargetToast({ visible, text }: NoTargetToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-sm bg-amber-900/80 border border-amber-500/50 text-amber-200 text-xs font-display shadow-lg pointer-events-none"
        >
          {text ?? '⚔ 请将技能/攻击拖拽至目标再释放'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
