import {ArrowDown,Droplets,Flame,Gauge,Gem,Shield,ShieldAlert,Sparkles,Sword,Target,User,Package,Star,X,Zap} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SLOT_CONFIG } from '../../../config/game/equipment';
import { getInventoryRarityVisual, getInventoryStatVisual, INVENTORY_LAYOUT, INVENTORY_SURFACE_PRESETS} from '../../../config/ui/inventory';
import { SLOT_EMOJI_MAP } from '../../../config/ui/icons';
import { getEquipmentScore } from '../../../domains/inventory/services/equipmentScore';
import { getQualityLabel, getSlotLabel, getStatLabel } from '../../../infra/i18n/labels';
import type { Equipment } from '../../../shared/types/game';

const slotTypeIconMap: Record<string, ReactNode> = {
  sword: <Sword size={14} className="text-amber-300" />,
  user: <User size={14} className="text-stone-300" />,
  package: <Package size={14} className="text-stone-300" />,
  star: <Star size={14} className="text-red-300" />,
  gem: <Gem size={14} className="text-blue-300" />,
  shield: <Shield size={14} className="text-stone-300" />,
};

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

interface EquipmentTooltipProps {
  item: Equipment;
  anchor?: { x: number; y: number };
  onClose: () => void;
  onUnequip?: () => void;
}

interface EquipmentSlotProps {
  slot: string;
  item: Equipment | null;
  isSelected: boolean;
  onSelect: (slot: string) => void;
  onUnequip?: () => void;
}

function getTooltipPosition(anchor?: { x: number; y: number }) {
  const fallback = { left: 24, top: 24 };
  if (!anchor || typeof window === 'undefined') {
    return fallback;
  }

  const width = INVENTORY_LAYOUT.tooltipWidth;
  const height = INVENTORY_LAYOUT.tooltipApproxHeight;
  const padding = INVENTORY_LAYOUT.tooltipViewportPadding;
  const preferredLeft = anchor.x + INVENTORY_LAYOUT.tooltipOffsetX;
  const preferredTop = anchor.y - height / 3;

  return {
    left: Math.min(window.innerWidth - width - padding, Math.max(padding, preferredLeft)),
    top: Math.min(window.innerHeight - height - padding, Math.max(padding, preferredTop)),
  };
}

function EquipmentTooltip({ item, anchor, onClose, onUnequip }: EquipmentTooltipProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const displayName = item.localeNames?.[lang] || item.name;
  const rarity = getInventoryRarityVisual(item.quality);
  const score = getEquipmentScore(item);
  const affixIconMap: Record<string, string> = {
    crit_chance: '🎯',
    lifesteal: '🩸',
    damage_bonus: '🔥',
    thorns: '❄️',
    hp_bonus: '💚',
  };
  const affixIcon = affixIconMap[item.affixes[0]?.type] ?? '✨';
  const position = getTooltipPosition(anchor);
  const mainStatValue = item.attributes[item.mainStat] || 0;
  const otherAttrs = Object.entries(item.attributes).filter(([key]) => key !== item.mainStat);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.16 }}
      className="z-popover fixed w-[30%] overflow-hidden rounded-2xl border"
      style={{
        ...INVENTORY_SURFACE_PRESETS.detailPanel,
        left: position.left,
        top: position.top,
        borderColor: `${rarity.accentColor}66`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 border-b border-white/6 px-4 pb-3 pt-3" style={{ background: `linear-gradient(135deg, ${rarity.detailGradient[0]}55 0%, transparent 72%)` }}>
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[1.8rem] leading-none">
            {(item.icon || SLOT_EMOJI_MAP[item.slot] || '🧰')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{displayName}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <span style={{ color: rarity.accentColor }}>◆ {getQualityLabel(item.quality)}</span>
              <span>Lv.{item.level}</span>
              <span>{getSlotLabel(item.slot)}</span>
              <span className="font-mono text-cyan-200">{t('label.score', '评分')} {score}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-black/20 p-1.5 text-stone-500 transition-colors hover:text-stone-200">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="relative z-10 space-y-2 px-4 py-3">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
          <div className="text-[9px] uppercase tracking-[0.24em] text-stone-500">{t('tooltip.mainStat')}</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-200">
              <Sword size={13} className="text-stone-200" />
              {getStatLabel(item.mainStat)}
            </div>
            <span className="font-mono text-sm font-bold text-white">+{mainStatValue}</span>
          </div>
        </div>

        {otherAttrs.length > 0 && (
          <div className="space-y-2 rounded-xl border border-white/8 bg-black/18 px-3 py-3">
            {otherAttrs.map(([key, value]) => {
              const visual = getInventoryStatVisual(key);
              const Icon = statIconMap[visual.icon] ?? Sword;
              return (
                <div key={key} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex min-w-0 items-center gap-2 uppercase tracking-[0.16em] text-stone-400">
                    <Icon size={12} className={visual.labelClass} />
                    <span className="truncate">{getStatLabel(key)}</span>
                  </span>
                  <span className={[visual.valueClass, 'shrink-0 font-mono text-xs font-semibold'].join(' ')}>+{value}</span>
                </div>
              );
            })}
          </div>
        )}

        {item.affixes.length > 0 && (
          <div className="rounded-xl border border-cyan-500/16 bg-cyan-500/6 px-3 py-3">
            <div className="mb-2 text-[9px] uppercase tracking-[0.24em] text-cyan-300">{t('tooltip.affixes')}</div>
            <div className="space-y-1.5">
              {item.affixes.map((affix) => {
                const visual = getInventoryStatVisual(affix.type);
                const Icon = statIconMap[visual.icon] ?? Sword;
                return (
                  <div key={`${affix.type}-${affix.value}`} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="flex min-w-0 items-center gap-2 text-cyan-100">
                      <Icon size={12} className={visual.labelClass} />
                      <span className="truncate">{t(`stat.${affix.type}`, getStatLabel(affix.type))}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-cyan-100">+{affix.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {item.special && (
          <div className="rounded-xl border border-purple-500/16 bg-purple-500/8 px-3 py-3 text-[11px] leading-5 text-purple-100">
            <div className="mb-1 text-[9px] uppercase tracking-[0.24em] text-purple-300">{t('tooltip.special')}</div>
            {item.special}
          </div>
        )}
      </div>

      {onUnequip && (
        <div className="relative z-10 border-t border-white/6 px-4 py-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onUnequip();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-600/50 bg-stone-900/70 px-4 py-2.5 text-xs font-semibold text-stone-200 transition-colors hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-100"
          >
            <ArrowDown size={13} />
            {t('tooltip.unequip', 'Unequip')}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function EquipmentSlotInner({ slot, item, isSelected, onSelect, onUnequip }: EquipmentSlotProps) {
  const [tooltipAnchor, setTooltipAnchor] = useState<{ x: number; y: number } | null>(null);
  const rarity = useMemo(() => (item ? getInventoryRarityVisual(item.quality) : null), [item]);

  const affixIconMap: Record<string, string> = {
    crit_chance: '🎯',
    lifesteal: '🩸',
    damage_bonus: '🔥',
    thorns: '❄️',
    hp_bonus: '💚',
  };

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!item) {
      return;
    }

    setTooltipAnchor({ x: event.clientX, y: event.clientY });
    onSelect(slot);
  };

  return (
    <div className="overflow-visible">
      <button
        type="button"
        onClick={handleClick}
        className={[
          'group relative aspect-square w-[90%] overflow-hidden border transition-all duration-200',
          'flex-col items-center',
          item ? 'cursor-pointer' : 'cursor-default',
          item ? rarity?.borderClass ?? 'border-stone-700/80' : 'border-stone-800/70',
          rarity?.pulseClass ?? '',
        ].join(' ')}
        style={item
          ? {
              backgroundImage: [
                `linear-gradient(180deg, ${rarity?.cellGradient[0]}, ${rarity?.cellGradient[1]})`,
              ].join(', '),
              boxShadow: [
                rarity?.slotHaloShadow ?? '0 0 0 rgba(0,0,0,0)',
                isSelected ? '0 0 0 1px rgba(255,255,255,0.35)' : '',
              ].filter(Boolean).join(', '),
            }
          : INVENTORY_SURFACE_PRESETS.emptySlot}
        aria-pressed={isSelected}
      >
        <div className="pointer-events-none absolute inset-[2px] clip-corner-8 border border-white/6" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,120,0,0.08),transparent_68%)] opacity-70" />

        {item ? (
          <>
            <span className="relative z-10 text-[2rem] leading-none transition-transform duration-150 group-hover:scale-[1.12]">
              {(item.icon || SLOT_EMOJI_MAP[item.slot] || '🧰')}+{affixIconMap[item.affixes[0]?.type] ?? '✨'}
            </span>
            <span className="relative z-10 mt-1 line-clamp-1 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-200/85">
              {getQualityLabel(item.quality)}
            </span>
            {item.enhancementLevel > 0 && (
              <span className="absolute right-1 top-1 rounded-md border border-amber-400/30 bg-amber-950/85 px-1 py-0.5 text-[8px] font-mono font-bold text-amber-200">
                +{item.enhancementLevel}
              </span>
            )}
            {item.quality === 'legendary' && (
              <div className="pointer-events-none absolute inset-0 clip-corner-8 legendary-shine opacity-90" />
            )}
            {item.quality === 'mythic' && (
              <div className="pointer-events-none absolute inset-0 clip-corner-8 mythic-glow opacity-95" />
            )}
          </>
        ) : (
          <span className="relative flex flex-col items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-stone-500">
            {slotTypeIconMap[SLOT_CONFIG[slot]?.icon || 'package']}
            <span className="text-center">{getSlotLabel(slot)}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isSelected && item && (
          <EquipmentTooltip
            item={item}
            anchor={tooltipAnchor ?? undefined}
            onClose={() => onSelect('')}
            onUnequip={onUnequip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const EquipmentSlot = memo(EquipmentSlotInner);
