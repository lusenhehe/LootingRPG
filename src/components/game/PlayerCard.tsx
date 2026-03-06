import BattleUnitCardBase from './BattleUnitCardBase';
import type { BattleSession } from '../../shared/types/game';
import { memo } from 'react';
import { User } from 'lucide-react';
import { StatusBadge } from './battle/StatusBadge';
import { ProgressBar } from '../../shared/ui';

interface PlayerCardProps {
  session: BattleSession;
  isActive?: boolean;
}

function PlayerCardInner({ session, isActive = false }: PlayerCardProps) {
  const playerName = session.player.name || 'PLAYER';
  const hpText = `${Math.max(0, Math.round(session.player.currentHp))}/${Math.max(1, Math.round(session.player.baseStats.hp))}`;
  const statuses = session.player.statuses ?? [];

  /** 仅在「处理中」阶段显示荧光边框，避免玩家等待时一直有选中感 */
  const activeRing = isActive && session.phase === 'resolving'
    ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-black/30 shadow-[0_0_12px_2px_rgba(129,140,248,0.5)]'
    : '';

  return (
    <BattleUnitCardBase
      className={`w-full p-0 transition-all duration-300 ${activeRing}`}
      subtitle={
        <div className="min-w-0 flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-[clamp(0.52rem,1vw,0.75rem)] font-semibold text-white">{playerName}</span>
          <span className="shrink-0 text-[clamp(0.45rem,0.85vw,0.68rem)] text-gray-400">Lv.{session.player.level}</span>
        </div>
      }
    >
      <div className="w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden">
        {/* 状态徽章 */}
        {statuses.length > 0 && (
          <div className="mb-1 flex items-center gap-0.5 flex-wrap min-w-0 shrink-0 overflow-hidden max-h-[14px]">
            {statuses.slice(0, 3).map((s) => (
              <StatusBadge key={s.id} status={s} />
            ))}
            {statuses.length > 3 && (
              <span className="text-[7px] text-gray-400">+{statuses.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <div
            className="rounded-full bg-indigo-600/30 flex items-center justify-center"
            style={{ width: 'clamp(1.9rem, 4vw, 3rem)', height: 'clamp(1.9rem, 4vw, 3rem)' }}
          >
            <User className="text-indigo-400" style={{ width: 'clamp(1rem, 2.2vw, 1.7rem)', height: 'clamp(1rem, 2.2vw, 1.7rem)' }} />
          </div>
        </div>

        <div className="px-1 py-1 text-center text-[clamp(0.42rem,0.8vw,0.6rem)] text-gray-300 truncate shrink-0">
          HP {hpText}
        </div>

        {/* HP 条 */}
        <ProgressBar value={session.player.currentHp} max={session.player.baseStats.hp} />


      </div>
    </BattleUnitCardBase>
  );
}

export const PlayerCard = memo(PlayerCardInner);

export default PlayerCard;