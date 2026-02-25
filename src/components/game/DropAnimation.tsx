import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface DropAnimationProps {
  visible: boolean;
  label: string | null;
}

export function DropAnimation({ visible, label }: DropAnimationProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {visible && label && (
        <motion.div
          className="pointer-events-none absolute right-24 top-1/2"
          initial={{ x: 0, y: 0, scale: 0.9, opacity: 0 }}
          animate={{ x: 170, y: -150, scale: 0.6, opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 border border-amber-300/50 text-amber-100 shadow-lg">
            {t('label.drop')} {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
