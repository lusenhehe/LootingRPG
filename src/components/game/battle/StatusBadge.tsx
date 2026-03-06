import React from 'react';
import { Circle, Heart, Sparkles, Skull, Shield } from 'lucide-react';
import type { BattleStatusInstance } from '../../../types/battle/BattleUnit';

const EMOJI_ICONS: Record<string, string> = {
  dot: '🔴',
  hot: '💚',
  buff: '✨',
  debuff: '💀',
  shield: '🛡',
};

const LUCIDE_ICONS: Record<string, React.ReactNode> = {
  dot: <Circle size={12} className="text-red-500" />,
  hot: <Heart size={12} className="text-green-400" />,
  buff: <Sparkles size={12} className="text-yellow-300" />,
  debuff: <Skull size={12} className="text-gray-400" />,
  shield: <Shield size={12} className="text-blue-400" />,
};

interface StatusBadgeProps {
  status: BattleStatusInstance;
  iconMode?: 'emoji' | 'lucide';
}

export function StatusBadge({ status, iconMode = 'emoji' }: StatusBadgeProps) {
  const icon =
    iconMode === 'lucide'
      ? (LUCIDE_ICONS[status.kind] ?? '❓')
      : (EMOJI_ICONS[status.kind] ?? '❓');

  return (
    <span
      title={`${status.id} ×${status.stacks} (${status.remainingTurns}t)`}
      className="inline-flex items-center gap-[1px] text-[7px] leading-none px-0.5 py-[1px] rounded bg-black/60 text-gray-200 shrink-0"
    >
      <span className="text-[8px] leading-none">{icon}</span>
      {status.stacks > 1 && <span>×{status.stacks}</span>}
      <span className="text-gray-500">{status.remainingTurns}</span>
    </span>
  );
}
