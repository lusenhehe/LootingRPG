import BattleUnitCardBase from './BattleUnitCardBase';
import type { BattleSession } from '../../shared/types/game';
import { memo } from 'react';

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

interface PlayerCardProps {
  session: BattleSession;
}

function PlayerCardInner({ session }: PlayerCardProps) {
  const hpRatio = percent(session.player.currentHp, session.player.baseStats.hp);

  return (
    <BattleUnitCardBase
      className="w-full p-0"
    >
      <div className="relative w-full h-full">
        {/* icon explicitly centered with transform */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl leading-none">
          🧙
        </div>
        {/* health bar flush to bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 rounded bg-gray-800 overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${hpRatio}%` }} />
        </div>
      </div>
    </BattleUnitCardBase>
  );
}

export const PlayerCard = memo(PlayerCardInner);

export default PlayerCard;
