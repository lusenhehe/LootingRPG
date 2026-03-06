import { ArrowDown, Coins, Droplets, Flame, Gauge, Gem, Shield, ShieldAlert, Sparkles, Sword, Target, Trash2, X, Zap} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QUALITY_CONFIG } from '../../../config/game/equipment';
import { getInventoryRarityVisual, getInventoryStatVisual, INVENTORY_SURFACE_PRESETS } from '../../../config/ui/inventory';
import { getEquipmentScore } from '../../../domains/inventory/services/equipmentScore';
import { getQualityLabel, getSlotLabel, getStatLabel } from '../../../infra/i18n/labels';
import type { Equipment } from '../../../shared/types/game';

interface InventoryItemDetailPanelProps {
  item: Equipment;
  equippedItem: Equipment | null;
  loading: boolean;
  onEquip: () => void;
  onSell: () => void;
  onClose: () => void;
}

const statIconMap: Record<string, LucideIcon> = {
  sword: Sword,
  shield: Shield,
  sparkles: Sparkles,
  droplets: Droplets,
  flame: Flame,
  zap: Zap,
  gem: Gem,
  shieldAlert: ShieldAlert,
  gauge: Gauge,
  target: Target,
};

interface StatRowProps {
  statKey: string;
  value: number;
  valueText?: string;
  labelText?: string;
  highlight?: boolean;
}

const PERCENT_STAT_KEYS = new Set<string>(['crit_chance', 'lifesteal', 'damage_bonus', 'thorns']);
const BASE_STAT_KEYS = new Set<string>(['attack', 'defense', 'hp', 'block']);

const toNumericMap = (target: Equipment | null): Record<string, number> => {
  if (!target) {
    return {};
  }

  const stats: Record<string, number> = {};
  Object.entries(target.attributes).forEach(([key, value]) => {
    stats[key] = (stats[key] ?? 0) + (typeof value === 'number' ? value : Number(value) || 0);
  });
  target.affixes.forEach((affix) => {
    stats[affix.type] = (stats[affix.type] ?? 0) + affix.value;
  });

  return stats;
};

const formatValue = (statKey: string, value: number): string => {
  const sign = value > 0 ? '+' : '';
  const suffix = PERCENT_STAT_KEYS.has(statKey) ? '%' : '';
  return `${sign}${value}${suffix}`;
};

function StatRow({ statKey, value, valueText, labelText, highlight = false }: StatRowProps) {
  const visual = getInventoryStatVisual(statKey);
  const Icon = statIconMap[visual.icon] ?? Sword;
  const display = valueText ?? formatValue(statKey, value);

  return (
    <div className={[
      'flex items-center justify-between gap-3 border px-3 py-2.5',
      highlight ? 'border-white/12 bg-black/32' : 'border-white/8 bg-black/20',
    ].join(' ')}>
      <div className="flex min-w-0 items-center gap-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <Icon size={14} className={visual.labelClass} />
        </span>
        <span className={['truncate text-[11px] uppercase tracking-[0.18em]', visual.labelClass].join(' ')}>
          {labelText ?? getStatLabel(statKey)}
        </span>
      </div>
      <span className={[
        'shrink-0 font-mono text-sm font-bold', highlight ? 'text-white' : visual.valueClass,
      ].join(' ')}>
        {display}
      </span>
    </div>
  );
}

export function InventoryItemDetailPanel({
  item,
  equippedItem,
  loading,
  onEquip, onSell, onClose,
}: InventoryItemDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const displayName = item.localeNames?.[lang] || item.name;
  const rarity = getInventoryRarityVisual(item.quality);
  const score = getEquipmentScore(item);
  const currentScore = equippedItem ? getEquipmentScore(equippedItem) : 0;
  const allStats = useMemo(() => {
    const merged: Array<{ key: string; value: number }> = [];
    Object.entries(item.attributes).forEach(([key, value]) => {
      merged.push({ key, value: typeof value === 'number' ? value : Number(value) || 0 });
    });
    return merged;
  }, [item.attributes]);

  const baseStats = allStats.filter((entry) => BASE_STAT_KEYS.has(entry.key));
  const tacticalStats = allStats.filter((entry) => !BASE_STAT_KEYS.has(entry.key));

  const compareRows = useMemo(() => {
    const currentMap = toNumericMap(equippedItem);
    const nextMap = toNumericMap(item);
    const statKeys = new Set<string>([...Object.keys(currentMap), ...Object.keys(nextMap)]);
    return Array.from(statKeys)
      .map((statKey) => {
        const currentValue = currentMap[statKey] ?? 0;
        const nextValue = nextMap[statKey] ?? 0;
        const delta = nextValue - currentValue;
        return { statKey, currentValue, nextValue, delta };
      })
      .filter((entry) => entry.currentValue !== 0 || entry.nextValue !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [equippedItem, item]);

  const price = QUALITY_CONFIG[item.quality]?.price ?? 0;
  const getDisplayStatLabel = (statKey: string): string => {
    if (statKey === 'attackSpeed') {
      return t('stat.actionSpeed', t(`stat.${statKey}`, getStatLabel(statKey)));
    }
    return t(`stat.${statKey}`, getStatLabel(statKey));
  };

  return (
    <motion.section
      key={item.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="relative shrink-0 overflow-y-auto rounded-xl border"
      style={{
        ...INVENTORY_SURFACE_PRESETS.detailPanel,
        borderColor: `${rarity.accentColor}5e`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${rarity.accentColor}, transparent)` }} />
      <div
        className="relative z-10 flex items-start gap-3 border-b border-white/6 px-4 pb-4 pt-4"
        style={{ background: `linear-gradient(135deg, ${rarity.detailGradient[0]}66 0%, transparent 72%)` }}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[2.25rem] leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {item.icon || '🧰'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <h3 className="truncate text-lg font-bold text-white">{displayName}</h3>
            {item.enhancementLevel > 0 && (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/12 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-200">
                +{item.enhancementLevel} {t('tooltip.enhancement')}
              </span>
            )}
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-100">
              {t('label.score', '评分')} {score}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone-400">
            <span className="font-semibold" style={{ color: rarity.accentColor }}>◆ {getQualityLabel(item.quality)}</span>
            <span>Lv.{item.level}</span>
            <span>{getSlotLabel(item.slot)}</span>
            <span className="inline-flex items-center gap-1 text-amber-200">
              <Coins size={12} />
              {price}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 bg-black/20 p-2 text-stone-500 transition-colors hover:text-stone-200"
          aria-label={t('button.close', '关闭')}
        >
          <X size={14} />
        </button>
      </div>
      {/* 主要属性和操作按钮区域 */}
      <div className="relative z-10 px-4 py-4">
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            {/* 基础属性通常是攻击、防御、生命等直接影响战斗力的数值，单独分类展示以突出其重要性 */}
            {baseStats.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-stone-500">{t('tooltip.baseStats', '基础属性')}</div>
                <div className="space-y-2">
                  {baseStats.map(({ key, value }) => (
                    <StatRow key={key} statKey={key} value={value} valueText={formatValue(key, value)} labelText={getDisplayStatLabel(key)} highlight={key === item.mainStat} />
                  ))}
                </div>
              </div>
            )}
            {/* 战术属性通常是一些非直接数值的属性，如暴击率、元素伤害加成等，单独分类展示以突出其特殊性 */}
            {tacticalStats.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-orange-300">{t('tooltip.tacticalStats', '战术属性')}</div>
                <div className="space-y-2">
                  {tacticalStats.map(({ key, value }) => (
                    <StatRow key={key} statKey={key} value={value} valueText={formatValue(key, value)} labelText={getDisplayStatLabel(key)} highlight={key === item.mainStat} />
                  ))}
                </div>
              </div>
            )}
            {item.affixes.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-400">{t('tooltip.affixes')}</div>
                <div className="space-y-2">
                  {item.affixes.map((affix, index) => (
                    <StatRow
                      key={`${affix.type}-${affix.value}-${index}`}
                      statKey={affix.type}
                      value={affix.value}
                      valueText={formatValue(affix.type, affix.value)}
                      labelText={getDisplayStatLabel(affix.type)}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 特殊属性描述，如套装效果、特殊能力等，通常是纯文本描述 */}
            {item.special && (
              <div className="rounded-2xl border border-purple-500/18 bg-purple-500/8 px-4 py-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-purple-300">{t('tooltip.special')}</div>
                <p className="text-sm leading-6 text-purple-100/90">{item.special}</p>
              </div>
            )}
            {/* 装备对比区域 - 仅当有已装备的同类型装备时显示 */}
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-stone-400">{t('tooltip.compare', '装备对比')}</div>
              {equippedItem ? (
                <>
                  <div className="mb-2 flex items-center justify-between rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[11px]">
                    <span className="text-stone-400">{t('label.currentEquipment', '当前装备')}</span>
                    <span className="font-mono text-stone-200">{currentScore}</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/8 px-3 py-2 text-[11px]">
                    <span className="text-cyan-200">{t('label.newEquipment', '新装备')}</span>
                    <span className="font-mono text-cyan-100">{score}</span>
                  </div>
                  <div className="space-y-1.5">
                    {compareRows.map(({ statKey, currentValue, nextValue, delta }) => {
                      const formatted = formatValue(statKey, Math.abs(delta)).replace('+', '');
                      const deltaText = delta > 0 ? `↑${formatted}` : delta < 0 ? `↓${formatted}` : '—';
                      const deltaClass = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-red-300' : 'text-stone-500';
                      return (
                        <div key={statKey} className="flex items-center justify-between gap-2 border border-white/8 bg-black/20 px-2.5 py-1.5 text-[11px]">
                          <span className="truncate text-stone-300">{getDisplayStatLabel(statKey)}</span>
                          <span className="font-mono text-stone-300">{formatValue(statKey, currentValue)} → {formatValue(statKey, nextValue)}</span>
                          <span className={[deltaClass, 'font-mono font-semibold'].join(' ')}>{deltaText}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs text-stone-500">
                  {t('message.noCompareTarget', '该槽位当前无装备，无法对比。')}
                </div>
              )}
            </div>
            {/* 操作按钮 - 装备- 强化- 出售 */}
            <div className="grid grid-cols-2 gap-1 w-full">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEquip}
                disabled={loading}
                className="flex items-center justify-center gap-1 border border-red-500/30 bg-red-500/12 px-4 py-3 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/22 disabled:opacity-40"
              >
                <ArrowDown size={14} />
                {t('button.equip')}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSell}
                disabled={loading}
                className="flex items-center justify-center gap-1 border border-stone-700/50 bg-stone-900/70 px-4 py-3 text-sm font-bold text-stone-200 transition-colors hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-100 disabled:opacity-40"
              >
                <Trash2 size={14} />
                {t('button.sell', 'Sell')}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
