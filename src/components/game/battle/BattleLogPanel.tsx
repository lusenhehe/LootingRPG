import { Scroll } from 'lucide-react';
import { motion } from 'motion/react';
import type { BattleSession } from '../../../shared/types/game';
import battleUiJson from '@data/config/game/battleUi.json';

const UI_CFG = battleUiJson as unknown as {
  battleView?: { log?: { displayLimit?: number } };
};

interface BattleLogPanelProps {
  session: BattleSession;
}

export function BattleLogPanel({ session }: BattleLogPanelProps) {
  const limit = UI_CFG.battleView?.log?.displayLimit ?? 50;

  return (
    <div className="flex-1 rounded-sm border border-stone-800/50 bg-stone-900/30 p-3 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between text-[10px] uppercase text-stone-500 tracking-[0.3em] mb-2">
        <span className="flex items-center gap-1.5">
          <Scroll size={12} /> Battle Log
        </span>
        <span className="font-mono text-stone-600">Turn {session.turn}</span>
      </div>

      <div className="flex-1 overflow-auto space-y-0.5 text-[11px] font-mono pr-1">
        {session.logs.slice(-limit).map((line, index) => (
          <motion.div
            key={`${line}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`border-l-2 pl-2 py-0.5 ${
              line.includes('伤害')
                ? 'border-red-500/40 text-red-200/70'
                : line.includes('回血') || line.includes('护盾')
                ? 'border-green-500/40 text-green-200/70'
                : line.includes('🗡️') || line.includes('🔥') || line.includes('->')
                ? 'border-amber-500/40 text-amber-200/70'
                : line.includes('[CD]') || line.includes('[MP]')
                ? 'border-orange-500/30 text-orange-300/60'
                : 'border-stone-700/30 text-stone-400'
            }`}
          >
            {line}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
