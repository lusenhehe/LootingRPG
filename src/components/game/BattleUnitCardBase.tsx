import type { ReactNode } from 'react';

interface BattleUnitCardBaseProps {
  subtitle?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function BattleUnitCardBase({subtitle, className = '', children }: BattleUnitCardBaseProps) {
  return (
    <div className={`aspect-square rounded-2xl border border-game-border/60 bg-black/20 pt-3 px-3 pb-0 flex flex-col ${className}`}>
      <div className="mb-2 min-h-[36px]">
        {subtitle ? <div className="text-xs text-gray-400 mt-1">{subtitle}</div> : null}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default BattleUnitCardBase;
