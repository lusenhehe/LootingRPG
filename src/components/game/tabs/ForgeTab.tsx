import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { QUALITY_CONFIG } from '../../../constants/game';
import type { Equipment, GameState } from '../../../types/game';

interface ForgeTabProps {
  gameState: GameState;
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onForge: (id: string) => void;
  onReroll: (id: string) => void;
}

type ForgeCandidate = {
  item: Equipment;
  source: string;
};

export function ForgeTab({ gameState, selectedId, loading, onSelect, onForge, onReroll }: ForgeTabProps) {
  const equipped = (Object.entries(gameState.当前装备) as [string, Equipment | null][])
    .filter(([, item]) => Boolean(item))
    .map(([slot, item]) => ({ item: { ...(item as Equipment), 已装备: true }, source: `已装备/${slot}` }));

  const backpack = gameState.背包.map((item) => ({ item: { ...item, 已装备: false }, source: '背包' }));
  const deduped = new Map<string, ForgeCandidate>();
  [...equipped, ...backpack].forEach((entry) => {
    deduped.set(entry.item.id, entry);
  });
  const candidates: ForgeCandidate[] = [...deduped.values()];

  const selected = candidates.find((entry) => entry.item.id === selectedId)?.item ?? candidates[0]?.item;

  if (!selected) {
    return (
      <motion.div key="forge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <Sparkles className="mx-auto text-violet-400" size={48} />
          <h2 className="text-xl font-display">锻造中心</h2>
          <p className="text-sm text-gray-500">暂无可锻造装备</p>
        </div>
      </motion.div>
    );
  }

  const forgeCost = (selected.强化等级 + 1) * 500;
  const rerollCost = (selected.强化等级 + 1) * 300;
  const qualityColor = QUALITY_CONFIG[selected.品质]?.color || 'text-gray-400';

  return (
    <motion.div key="forge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
      <div className="h-[420px] overflow-y-auto pr-2 space-y-2">
        {candidates.map(({ item, source }) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${selected.id === item.id ? 'border-violet-500 bg-violet-500/10 hover:border-violet-400' : 'border-game-border/50 bg-game-bg/50 hover:border-violet-500/50 hover:bg-game-card/50'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate flex items-center gap-1 ${QUALITY_CONFIG[item.品质]?.color || 'text-gray-200'}`}>
                  <span className="text-base leading-none">{item.icon || '🧰'}</span>
                  {item.名称} {item.强化等级 > 0 ? `+${item.强化等级}` : ''}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{item.部位} · {source}</p>
              </div>
              {item.已装备 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 font-bold">
                  已装备
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-game-bg/80 border border-game-border/50 rounded-xl p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className={`text-base font-bold ${qualityColor} flex items-center gap-1`}>
            <span className="text-lg leading-none">{selected.icon || '🧰'}</span>
            {selected.名称} {selected.强化等级 > 0 ? `+${selected.强化等级}` : ''}
          </h3>
          <p className="text-xs text-gray-500">{selected.部位} • {selected.品质}</p>
        </div>

        <div className="space-y-1">
          {Object.entries(selected.属性).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-400">{key}</span>
              <span className="font-mono text-gray-200">+{value}</span>
            </div>
          ))}
        </div>

        {selected.特殊效果 && <p className="text-xs text-violet-400 italic">★ {selected.特殊效果}</p>}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onForge(selected.id)}
            disabled={loading || gameState.玩家状态.金币 < forgeCost}
            className="py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-all cursor-pointer hover:scale-105"
          >
            强化（{forgeCost}）
          </button>
          <button
            onClick={() => onReroll(selected.id)}
            disabled={loading || gameState.玩家状态.金币 < rerollCost}
            className="py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-all cursor-pointer hover:scale-105"
          >
            洗练（{rerollCost}）
          </button>
        </div>
      </div>
    </motion.div>
  );
}
