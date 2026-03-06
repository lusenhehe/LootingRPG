import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** 内容区额外 className */
  className?: string;
  /** 遮罩层不透明度，默认 bg-black/60 */
  overlayClassName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * 全屏遮罩 + 居中弹窗。点击遮罩区域（非内容区）触发 onClose。
 */
export function Modal({ open, onClose, children, className = '', overlayClassName = 'bg-black/60' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
