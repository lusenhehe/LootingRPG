import { Package, Shield, Zap, Gem, Crown, Star, Hexagon, ChevronDown, ChevronUp, User, Sword, Activity } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoSellContext } from '../../../app/context/autoSell';
import { useInventoryContext } from '../../../app/context/inventory';
import { useStateContext } from '../../../app/context/state';
import { QUALITIES, QUALITY_CONFIG } from '../../../config/game/equipment';
import {
  INVENTORY_LAYOUT,
  INVENTORY_SURFACE_PRESETS,
} from '../../../config/ui/inventory';
import { getQualityLabel } from '../../../infra/i18n/labels';
import { BackpackCell } from './BackpackCell';
import { InventoryItemDetailPanel } from './InventoryItemDetailPanel';
import { PlayerEquipmentPanel } from './PlayerEquipmentPanel';

const iconMap: Record<string, ReactNode> = {
  shield: <Shield size={14} className="text-gray-400" />,
  zap: <Zap size={14} className="text-emerald-400" />,
  gem: <Gem size={14} className="text-blue-400" />,
  hexagon: <Hexagon size={14} className="text-red-400" />,
  crown: <Crown size={14} className="text-yellow-400" />,
  star: <Star size={14} className="text-red-400" />,
};

type SortField = 'quality' | 'price' | 'name' | 'enchantment';
type SortOrder = 'asc' | 'desc';

function InventoryTabInner() {
  const { gameState, loading } = useStateContext();
  const {
    handleEquip: onEquip,
    handleSell: onSell,
    handleForge: onForge,
    handleUnequip: onUnequip,
    quickSellByQualityRange: onQuickSellByQualityRange,
  } = useInventoryContext();
  const { autoSellQualities, handleToggleAutoSellQuality: onToggleAutoSellQuality } = useAutoSellContext();
  const { t } = useTranslation();

  const items = useMemo(
    () => gameState.backpack.filter((item) => !item.equipped).map((item) => ({ ...item, equipped: false as const })),
    [gameState.backpack],
  );
  const [sortField, setSortField] = useState<SortField>('quality');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [sellMinQuality, setSellMinQuality] = useState(QUALITIES[0]);
  const [sellMaxQuality, setSellMaxQuality] = useState(QUALITIES[2]);

  const qualityIndexMap = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {};
    QUALITIES.forEach((quality, index) => {
      map[quality] = index;
    });
    return map;
  }, []);

  const sortedItems = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sortField === 'quality') {
        return ((qualityIndexMap[a.quality] ?? 0) - (qualityIndexMap[b.quality] ?? 0)) * direction;
      }
      if (sortField === 'price') {
        return ((QUALITY_CONFIG[a.quality]?.price || 0) - (QUALITY_CONFIG[b.quality]?.price || 0)) * direction;
      }
      if (sortField === 'enchantment') {
        return (a.enhancementLevel - b.enhancementLevel) * direction;
      }
      return a.name.localeCompare(b.name, 'zh-Hans-CN') * direction;
    });
  }, [items, qualityIndexMap, sortField, sortOrder]);

  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [sortedItems, selectedId],
  );
  const equippedCount = useMemo(
    () => Object.values(gameState.currentEquipment).filter(Boolean).length,
    [gameState.currentEquipment],
  );

  const handleEquip = useCallback(() => {
    if (selectedId) {
      onEquip(selectedId);
      setSelectedId(null);
    }
  }, [onEquip, selectedId]);

  const handleSell = useCallback(() => {
    if (selectedId) {
      onSell(selectedId);
      setSelectedId(null);
    }
  }, [onSell, selectedId]);

  const handleForge = useCallback(() => {
    if (selectedId) {
      onForge(selectedId);
    }
  }, [onForge, selectedId]);

  return (
    <motion.div
      key="inventory"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex h-full flex-col gap-3"
    >
      {/* 背包 */}
      <section className="overflow-hidden border border-game-border/45 bg-game-bg/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-xs text-gray-400 transition-colors hover:text-gray-200"
          onClick={() => setShowControls((value) => !value)}
        >
          <span className="flex items-center gap-2">
            <Package size={12} />
            {t('label.backpack')}
            <span className="font-mono text-stone-600">{items.length}</span>
          </span>
          {showControls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden border-t border-game-border/30 px-4 pb-4 pt-2"
            >
              <div>
                <p className="mb-1.5 text-[10px] text-gray-500">{t('ui.autoSellHint')}</p>
                <div className="grid grid-cols-3 gap-1.5 md:grid-cols-6">
                  {QUALITIES.map((quality) => (
                    <label
                      key={quality}
                      className="flex cursor-pointer items-center gap-1 rounded-xl p-1.5 text-[10px] text-gray-400 transition-colors hover:bg-game-card/30"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(autoSellQualities[quality])}
                        onChange={() => onToggleAutoSellQuality(quality)}
                        className="h-3 w-3 accent-red-700"
                      />
                      <span className="flex items-center gap-0.5">
                        {iconMap[QUALITY_CONFIG[quality]?.iconName || 'shield']}
                        {getQualityLabel(quality)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{t('label.sellRange')}</span>
                  <select value={sellMinQuality} onChange={(event) => setSellMinQuality(event.target.value)} className="rounded border border-game-border bg-game-bg px-1.5 py-0.5 text-[10px] text-gray-300">
                    {QUALITIES.map((quality) => (
                      <option key={quality} value={quality}>{getQualityLabel(quality)}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-600">{t('label.to')}</span>
                  <select value={sellMaxQuality} onChange={(event) => setSellMaxQuality(event.target.value)} className="rounded border border-game-border bg-game-bg px-1.5 py-0.5 text-[10px] text-gray-300">
                    {QUALITIES.map((quality) => (
                      <option key={quality} value={quality}>{getQualityLabel(quality)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onQuickSellByQualityRange(sellMinQuality, sellMaxQuality)}
                    disabled={loading || sortedItems.length === 0}
                    className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
                  >
                    {t('button.quickSell')}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{t('label.sort')}</span>
                  <select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)} className="rounded border border-game-border bg-game-bg px-1.5 py-0.5 text-[10px] text-gray-300">
                    <option value="quality">{t('label.quality')}</option>
                    <option value="price">{t('label.price')}</option>
                    <option value="enchantment">{t('label.enchantLevel')}</option>
                    <option value="name">{t('label.name')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder((value) => value === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center rounded border border-game-border bg-game-bg px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-200"
                  >
                    {sortOrder === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      {/* 主库存区域 */}
      <div className="flex flex-1 overflow-hidden">
        <section className="order-0 w-[10%] shrink-0 border border-stone-900/55 bg-black/20 p-3">
          <div className="rounded-xl border border-amber-500/20 bg-black/25 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-stone-400">
              <User size={12} className="text-amber-300" />
              {t('player.avatarTitle')}
            </div>
            <div className="text-sm font-semibold text-stone-100">{t('player.tacticalRole', '战术指挥官')}</div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-[10px]">
              <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5 text-stone-400">
                <div className="mb-1 flex items-center gap-1 text-stone-500"><Sword size={10} />ATK</div>
                <div className="font-mono text-stone-100">{Math.round(gameState.playerStats.attack)}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5 text-stone-400">
                <div className="mb-1 flex items-center gap-1 text-stone-500"><Shield size={10} />DEF</div>
                <div className="font-mono text-stone-100">{Math.round(gameState.playerStats.defense)}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5 text-stone-400">
                <div className="mb-1 flex items-center gap-1 text-stone-500"><Activity size={10} />ACT</div>
                <div className="font-mono text-stone-100">{Math.round(gameState.playerStats.attackSpeed)}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5 text-stone-400">
                <div className="mb-1 text-stone-500">{t('label.equipped')}</div>
                <div className="font-mono text-stone-100">{equippedCount}/6</div>
              </div>
            </div>
          </div>
        </section>
        <div className="order-1 w-[11%] flex flex-col">
          <PlayerEquipmentPanel gameState={gameState} onUnequip={onUnequip} />
        </div>
        <div className="order-2 flex min-w-0 flex-1 flex-col">
          <section
            className="relative min-h-0 flex-1 overflow-hidden border border-stone-900/80"
            style={INVENTORY_SURFACE_PRESETS.backpackPanel}
          >
            {/* 背包格子背景效果层，放在最底层以避免遮挡物品卡片上的交互元素 */ }
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,120,0,0.06),transparent_60%)]" />
            {/* 背包格子内容层 */ }
            <div className="relative z-10 h-full overflow-y-auto p-3 pr-2">
              {sortedItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-600">
                  <Package size={42} className="mb-3 opacity-20" />
                  <p className="text-sm">{t('message.empty_inventory')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-10 gap-2 z-10">
                  {sortedItems.map((item) => (
                    <BackpackCell
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      onClick={() => setSelectedId((current) => current === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <InventoryItemDetailPanel
                key={selectedItem.id}
                item={selectedItem}
                equippedItem={gameState.currentEquipment[selectedItem.slot] ?? null}
                loading={loading}
                onEquip={handleEquip}
                onSell={handleSell}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <motion.section
                key="inventory-placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 overflow-hidden rounded-2xl border border-stone-800/80 px-5 py-6"
                style={{
                  ...INVENTORY_SURFACE_PRESETS.placeholderPanel,
                  minHeight: INVENTORY_LAYOUT.detailPanelMinHeight,
                }}
              >
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-2xl text-amber-300">
                    ✦
                  </div>
                  <h3 className="text-base font-semibold text-stone-100">{t('label.selectEquipment', '选择一件装备')}</h3>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export const InventoryTab = memo(InventoryTabInner);
