import { Package, Shield, Zap, Gem, Crown, Star, Hexagon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { QUALITIES, QUALITY_CONFIG } from '../../../constants/game';
import type { Equipment } from '../../../types/game';
import { ItemCard } from '../ItemCard';

const iconMap: Record<string, ReactNode> = {
  shield: <Shield size={14} className="text-gray-400" />,
  zap: <Zap size={14} className="text-emerald-400" />,
  gem: <Gem size={14} className="text-blue-400" />,
  hexagon: <Hexagon size={14} className="text-purple-400" />,
  crown: <Crown size={14} className="text-yellow-400" />,
  star: <Star size={14} className="text-red-400" />,
};

interface InventoryTabProps {
  items: Equipment[];
  loading: boolean;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  autoSellQualities: Record<string, boolean>;
  onToggleAutoSellQuality: (quality: string) => void;
}

type SortField = 'quality' | 'price' | 'name' | '强化等级';
type SortOrder = 'asc' | 'desc';

export function InventoryTab({
  items,
  loading,
  onEquip,
  onSell,
  onForge,
  onQuickSellByQualityRange,
  autoSellQualities,
  onToggleAutoSellQuality,
}: InventoryTabProps) {
  const [sortField, setSortField] = useState<SortField>('quality');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sellMinQuality, setSellMinQuality] = useState('普通');
  const [sellMaxQuality, setSellMaxQuality] = useState('史诗');

  const qualityIndexMap = useMemo(
    () => Object.fromEntries(QUALITIES.map((quality, index) => [quality, index])) as Record<string, number>,
    [],
  );

  const sortedItems = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sortField === 'quality') {
        return ((qualityIndexMap[a.品质] ?? 0) - (qualityIndexMap[b.品质] ?? 0)) * direction;
      }
      if (sortField === 'price') {
        return (QUALITY_CONFIG[a.品质].price - QUALITY_CONFIG[b.品质].price) * direction;
      }
      if (sortField === '强化等级') {
        return (a.强化等级 - b.强化等级) * direction;
      }
      return a.名称.localeCompare(b.名称, 'zh-Hans-CN') * direction;
    });
  }, [items, qualityIndexMap, sortField, sortOrder]);

  return (
    <motion.div key="inventory" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full flex flex-col gap-3">
      <section className="border border-game-border rounded-xl bg-game-bg/60 p-3">
        <p className="text-xs text-gray-400 mb-2">自动售卖（勾选品质后，战斗掉落会自动出售）</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {QUALITIES.map((quality) => (
            <label key={quality} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer hover:bg-game-card/30 p-1.5 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={Boolean(autoSellQualities[quality])}
                onChange={() => onToggleAutoSellQuality(quality)}
                className="accent-violet-500"
              />
              <span className="flex items-center gap-1">
                {iconMap[QUALITY_CONFIG[quality]?.iconName || 'shield']}
                {quality}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="border border-game-border rounded-xl bg-game-bg/60 p-3 space-y-3">
        <p className="text-xs text-gray-400">一键售卖（按品质范围）与排序</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">售卖范围</span>
            <select
              value={sellMinQuality}
              onChange={(event) => setSellMinQuality(event.target.value)}
              className="text-xs bg-game-bg border border-game-border rounded px-2 py-1 text-gray-200"
            >
              {QUALITIES.map((quality) => (
                <option key={`min-${quality}`} value={quality}>{quality}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">到</span>
            <select
              value={sellMaxQuality}
              onChange={(event) => setSellMaxQuality(event.target.value)}
              className="text-xs bg-game-bg border border-game-border rounded px-2 py-1 text-gray-200"
            >
              {QUALITIES.map((quality) => (
                <option key={`max-${quality}`} value={quality}>{quality}</option>
              ))}
            </select>
            <button
              onClick={() => onQuickSellByQualityRange(sellMinQuality, sellMaxQuality)}
              disabled={loading || sortedItems.length === 0}
              className="text-xs px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              一键售卖
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">排序</span>
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as SortField)}
              className="text-xs bg-game-bg border border-game-border rounded px-2 py-1 text-gray-200"
            >
              <option value="quality">品质</option>
              <option value="price">售价</option>
              <option value="强化等级">强化等级</option>
              <option value="name">名称</option>
            </select>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="text-xs bg-game-bg border border-game-border rounded px-2 py-1 text-gray-200"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </section>

      <div className="h-[420px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
        {sortedItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-600">
            <Package size={48} className="mb-2 opacity-20" />
            <p>背包空空如也</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id}>
              <ItemCard
                item={item}
                readonly={item.已装备}
                onEquip={() => onEquip(item.id)}
                onSell={() => onSell(item.id)}
                onForge={() => onForge(item.id)}
                loading={loading}
              />
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
