import React, { type ReactNode } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  sub: string;
  active?: boolean;
  disabled?: boolean;
  color?: string;
}

export const ActionButton = React.memo(function ActionButton({ onClick, icon, label, sub, active, disabled, color }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20'} ${active ? 'bg-gradient-to-br from-violet-600 to-purple-700 border-violet-500 shadow-lg shadow-purple-500/30' : color || 'bg-game-card/80 border-game-border/50 hover:border-violet-500/50 hover:bg-game-card'}`}
    >
      <div className={`mb-2 ${active ? 'text-white drop-shadow-lg' : 'text-violet-400'}`}>{icon}</div>
      <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-200'}`}>{label}</span>
      <span className={`text-[10px] uppercase font-mono ${active ? 'text-white/70' : 'text-gray-500'}`}>{sub}</span>
    </button>
  );
});
