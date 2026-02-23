import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import type { RefObject } from 'react';

interface BattleLogTabProps {
  logs: string[];
  loading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export function BattleLogTab({ logs, loading, scrollRef, onScroll }: BattleLogTabProps) {
  return (
    <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
      <div ref={scrollRef} onScroll={onScroll} className="h-[420px] overflow-y-auto space-y-2 font-mono text-sm pr-1">
        {logs.map((log, i) => (
          <div key={`${i}-${log}`} className={`p-2 rounded border-l-2 ${log.includes('掉落') || log.includes('获得') ? 'bg-green-500/5 border-green-500' : 'bg-white/5 border-gray-700'}`}>
            {log}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-game-accent animate-pulse p-2">
            <RefreshCw size={14} className="animate-spin" /> 计算中...
          </div>
        )}
      </div>
    </motion.div>
  );
}
