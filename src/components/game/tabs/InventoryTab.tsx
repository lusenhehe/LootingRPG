import { Package, Shield, Zap, Gem, Crown, Star, Hexagon, ArrowDown, Trash2, Hammer, ChevronDown, ChevronUp } from 'lucide-react';
import { QUALITIES, QUALITY_CONFIG } from '../../../config/game/equipment';
import { getQualityLabel, getSlotLabel, getStatLabel } from '../../../infra/i18n/labels';
import { SLOT_EMOJI_MAP, QUALITY_STYLE_MAP_ENHANCED} from '../../../config/ui/icons';
import { useMemo, useState, useCallback, memo } from 'react';
import type { Equipment } from '../../../types/game';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  shield:  <Shield  size={14} className="text-gray-400" />,
  zap:     <Zap     size={14} className="text-emerald-400" />,
  gem:     <Gem     size={14} className="text-blue-400" />,
  hexagon: <Hexagon size={14} className="text-red-400" />,
  crown:   <Crown   size={14} className="text-yellow-400" />,
  star:    <Star    size={14} className="text-red-400" />,
};
// ─── 背包格子 ───────────────────────────────────────────────────────────────
function BackpackCell({ item, isSelected, onClick }: { item: Equipment; isSelected: boolean; onClick: () => void }) {
  const qs = QUALITY_STYLE_MAP_ENHANCED[item.quality] ?? QUALITY_STYLE_MAP_ENHANCED.common;
  return (
    <motion.button
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={item.name}
      className={`
        relative aspect-square rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-150
        ${qs.bg} ${qs.border}
        ${isSelected
          ? `ring-2 ring-offset-1 ring-offset-stone-950 ring-white/50 shadow-lg ${qs.glow}`
          : `hover:ring-1 hover:ring-white/20 ${qs.glow}`}
      `}
    >
      <span className="text-xl leading-none select-none">
        {SLOT_EMOJI_MAP[item.slot] || '🧰'}-{item.icon || '🧰'}
      </span>

      {item.enhancementLevel > 0 && (
        <span className="absolute top-0.5 right-0.5 text-[7px] font-mono text-amber-300 bg-amber-950/80 px-0.5 rounded-sm leading-none">
          +{item.enhancementLevel}
        </span>
      )}

      {/* 品质底条 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b opacity-80"
        style={{ backgroundColor: qs.hex }}
      />

      {item.quality === 'legendary' && (
        <div className="absolute inset-0 rounded legendary-shine pointer-events-none" />
      )}
      {item.quality === 'mythic' && (
        <div className="absolute inset-0 rounded mythic-glow pointer-events-none" />
      )}
    </motion.button>
  );
}

// ─── 选中装备详情面板 ────────────────────────────────────────────────────────
function ItemDetailPanel({
  item, loading, onEquip, onSell, onForge, onClose,
}: {
  item: Equipment;
  loading: boolean;
  onEquip: () => void;
  onSell:  () => void;
  onForge: () => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const displayName = item.localeNames?.[lang] || item.name;
  const qs = QUALITY_STYLE_MAP_ENHANCED[item.quality] ?? QUALITY_STYLE_MAP_ENHANCED.common;
  const mainStatValue = item.attributes[item.mainStat] || 0;
  const otherAttrs = Object.entries(item.attributes).filter(([k]) => k !== item.mainStat);

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className={`h-full flex flex-col rounded-lg border-2 ${qs.border} bg-stone-950 shadow-xl overflow-hidden`}
    >
      {/* 顶部品质渐变背景区 */}
      <div
        className="px-3 pt-3 pb-2 flex items-start gap-2 shrink-0"
        style={{ background: `linear-gradient(135deg, ${qs.hex}22 0%, transparent 70%)` }}
      >
        <span className="text-4xl leading-none">
          {SLOT_EMOJI_MAP[item.slot] || '🧰'}-{item.icon || '🧰'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white truncate leading-tight">{displayName}</div>
          <div className="text-[10px] text-stone-400 uppercase tracking-wider flex flex-wrap items-center gap-1 mt-0.5">
            <span style={{ color: qs.hex }}>◆</span>
            <span>{getQualityLabel(item.quality)}</span>
            <span className="text-stone-600">•</span>
            <span>Lv.{item.level}</span>
            <span className="text-stone-600">•</span>
            <span>{getSlotLabel(item.slot)}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-600 hover:text-stone-300 text-xs shrink-0">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
        {/* 强化等级 */}
        {item.enhancementLevel > 0 && (
          <div className="px-2 py-1 bg-amber-900/30 border border-amber-600/40 rounded text-amber-300 font-mono text-xs font-bold">
            +{item.enhancementLevel} {t('tooltip.enhancement')}
          </div>
        )}

        {/* 主属性 */}
        <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
          <div className="text-[9px] text-stone-500 uppercase mb-1">{t('tooltip.mainStat')}</div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-stone-400 uppercase">{getStatLabel(item.mainStat)}</span>
            <span className="font-mono text-sm font-bold" style={{ color: qs.hex }}>+{mainStatValue}</span>
          </div>
        </div>

        {/* 副属性 */}
        {otherAttrs.length > 0 && (
          <div className="rounded border border-white/8 bg-black/20 px-2 py-1.5 space-y-1">
            {otherAttrs.map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[10px] text-stone-500 uppercase">{getStatLabel(key)}</span>
                <span className="font-mono text-xs text-stone-300">+{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 专属词缀 */}
        {item.affixes && item.affixes.length > 0 && (
          <div className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5">
            <div className="text-[9px] text-cyan-400 uppercase mb-1">{t('tooltip.affixes')}</div>
            <div className="flex flex-col gap-0.5">
              {item.affixes.map((affix, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan-300">
                    {t(`stat.${affix.type}`, affix.type)}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-200">+{affix.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 特效描述 */}
        {item.special && (
          <div className="rounded border border-purple-500/20 bg-purple-500/5 px-2 py-1.5">
            <div className="text-[9px] text-purple-400 uppercase mb-1">{t('tooltip.special')}</div>
            <p className="text-[10px] text-purple-200">{item.special}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="px-3 py-2 border-t border-stone-800 flex gap-1.5 shrink-0">
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onEquip} disabled={loading}
          className="flex-1 py-1.5 rounded bg-red-900/30 hover:bg-red-800/60 border border-red-700/40 text-red-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
        >
          <ArrowDown size={11} /> {t('button.equip')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onForge} disabled={loading}
          className="flex-1 py-1.5 rounded bg-amber-900/30 hover:bg-amber-800/60 border border-amber-700/40 text-amber-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
        >
          <Hammer size={11} /> {t('button.enchant')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onSell} disabled={loading}
          className="px-2.5 py-1.5 rounded bg-stone-800/60 hover:bg-red-800/60 border border-stone-700/40 hover:border-red-600/40 text-stone-400 hover:text-red-300 transition-all flex items-center justify-center disabled:opacity-40"
        >
          <Trash2 size={11} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── 主组件 ─────────────────────────────────────────────────────────────────
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

type SortField = 'quality' | 'price' | 'name' | 'enchantment';
type SortOrder = 'asc' | 'desc';

function InventoryTabInner({
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const { t } = useTranslation();
  const [sellMinQuality, setSellMinQuality] = useState(QUALITIES[0]);
  const [sellMaxQuality, setSellMaxQuality] = useState(QUALITIES[2]);

  const qualityIndexMap = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {};
    QUALITIES.forEach((quality, index) => { map[quality] = index; });
    return map;
  }, []);

  const sortedItems = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sortField === 'quality')     return ((qualityIndexMap[a.quality] ?? 0) - (qualityIndexMap[b.quality] ?? 0)) * direction;
      if (sortField === 'price')       return ((QUALITY_CONFIG[a.quality]?.price || 0) - (QUALITY_CONFIG[b.quality]?.price || 0)) * direction;
      if (sortField === 'enchantment') return (a.enhancementLevel - b.enhancementLevel) * direction;
      return a.name.localeCompare(b.name, 'zh-Hans-CN') * direction;
    });
  }, [items, qualityIndexMap, sortField, sortOrder]);

  const selectedItem = useMemo(() => sortedItems.find(i => i.id === selectedId) ?? null, [sortedItems, selectedId]);

  const handleEquip = useCallback(() => { if (selectedId) { onEquip(selectedId);  setSelectedId(null); } }, [selectedId, onEquip]);
  const handleSell  = useCallback(() => { if (selectedId) { onSell(selectedId);   setSelectedId(null); } }, [selectedId, onSell]);
  const handleForge = useCallback(() => { if (selectedId) { onForge(selectedId); }                      }, [selectedId, onForge]);

  return (
    <motion.div
      key="inventory"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="h-full flex flex-col gap-2"
    >
      {/* ── 可折叠控制栏 ── */}
      <section className="border border-game-border/50 rounded-xl bg-game-bg/60 shrink-0">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          onClick={() => setShowControls(v => !v)}
        >
          <span className="flex items-center gap-2">
            <Package size={12} />
            {t('label.backpack')}
            <span className="text-stone-600 font-mono">{items.length}</span>
          </span>
          {showControls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-game-border/30 px-3 pb-3 pt-2 space-y-3"
            >
              {/* 自动售卖 */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">{t('ui.autoSellHint')}</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
                  {QUALITIES.map((quality) => (
                    <label key={quality} className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer hover:bg-game-card/30 p-1 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(autoSellQualities[quality])}
                        onChange={() => onToggleAutoSellQuality(quality)}
                        className="accent-red-700 w-3 h-3"
                      />
                      <span className="flex items-center gap-0.5">
                        {iconMap[QUALITY_CONFIG[quality]?.iconName || 'shield']}
                        {getQualityLabel(quality)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 快速售卖 + 排序 */}
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{t('label.sellRange')}</span>
                  <select value={sellMinQuality} onChange={e => setSellMinQuality(e.target.value)} className="text-[10px] bg-game-bg border border-game-border rounded px-1.5 py-0.5 text-gray-300">
                    {QUALITIES.map(q => <option key={q} value={q}>{getQualityLabel(q)}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-600">{t('label.to')}</span>
                  <select value={sellMaxQuality} onChange={e => setSellMaxQuality(e.target.value)} className="text-[10px] bg-game-bg border border-game-border rounded px-1.5 py-0.5 text-gray-300">
                    {QUALITIES.map(q => <option key={q} value={q}>{getQualityLabel(q)}</option>)}
                  </select>
                  <button
                    onClick={() => onQuickSellByQualityRange(sellMinQuality, sellMaxQuality)}
                    disabled={loading || sortedItems.length === 0}
                    className="text-[10px] px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    {t('button.quickSell')}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{t('label.sort')}</span>
                  <select value={sortField} onChange={e => setSortField(e.target.value as SortField)} className="text-[10px] bg-game-bg border border-game-border rounded px-1.5 py-0.5 text-gray-300">
                    <option value="quality">{t('label.quality')}</option>
                    <option value="price">{t('label.price')}</option>
                    <option value="enchantment">{t('label.enchantLevel')}</option>
                    <option value="name">{t('label.name')}</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-game-border bg-game-bg text-gray-400 hover:text-gray-200 flex items-center"
                  >
                    {sortOrder === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── 主体：网格背包 + 详情面板 ── */}
      <div className="flex-1 min-h-0 flex gap-2">
        {/* 左侧 RPG 方格网格 */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Package size={40} className="mb-2 opacity-20" />
              <p className="text-xs">{t('message.empty_inventory')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1.5">
              {sortedItems.map((item) => (
                <BackpackCell
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧详情面板 */}
        <AnimatePresence mode="wait">
          {selectedItem && (
            <div key={selectedItem.id} className="w-52 shrink-0 min-h-0">
              <ItemDetailPanel
                item={selectedItem}
                loading={loading}
                onEquip={handleEquip}
                onSell={handleSell}
                onForge={handleForge}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export const InventoryTab = memo(InventoryTabInner);
