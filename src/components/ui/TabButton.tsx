import React from 'react';
import { motion } from 'motion/react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export const TabButton = React.memo(function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3.5 text-xs font-display font-semibold uppercase tracking-wider transition-all duration-250 cursor-pointer group ${
        active 
          ? 'text-amber-400 bg-gradient-to-b from-red-900/20 via-red-900/10 to-transparent border-t border-x border-amber-900/30' 
          : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/30 border-t border-transparent'
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {label}
      </span>
      
      {active && (
        <>
          <motion.div
            layoutId="tabActive"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
            style={{ width: '60%' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        </>
      )}
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
});
