import type { ReactNode } from 'react';

interface BattleUnitCardBaseProps {
  subtitle?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function BattleUnitCardBase({subtitle, className = '', children }: BattleUnitCardBaseProps) {
  return (
    <div className={`aspect-square rounded-2xl border border-game-border/60 bg-black/20 p-2 flex flex-col overflow-hidden min-w-0 min-h-0 ${className}`}>
      <div className="mb-1 shrink-0 min-h-0">
        {subtitle ? <div className="text-xs text-gray-400 leading-tight min-w-0">{subtitle}</div> : null}
      </div>
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}

export default BattleUnitCardBase;
