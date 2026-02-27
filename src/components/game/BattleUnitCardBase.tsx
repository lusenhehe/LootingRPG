import type { ReactNode } from 'react';

interface BattleUnitCardBaseProps {
  subtitle?: ReactNode;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function BattleUnitCardBase({subtitle, className = '', children, onClick }: BattleUnitCardBaseProps) {
  return (
    <div
      className={`aspect-square border border-game-border/60 bg-black/20 p-2 flex flex-col overflow-hidden ${className}`}
      onClick={onClick}
    >
      <div>
        {subtitle ? <div className="text-xs leading-tight">{subtitle}</div> : null}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default BattleUnitCardBase;
