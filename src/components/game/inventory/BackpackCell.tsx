import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { getInventoryRarityVisual } from '../../../config/ui/inventory';
import { SLOT_EMOJI_MAP } from '../../../config/ui/icons';
import { getEquipmentScore } from '../../../domains/inventory/services/equipmentScore';
import type { Equipment } from '../../../shared/types/game';

interface BackpackCellProps {
  item: Equipment;
  isSelected: boolean;
  onClick: () => void;
}

export function BackpackCell({ item, isSelected, onClick }: BackpackCellProps) {
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
  const surfaceStyle: CSSProperties = {
    backgroundImage: [
      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.08), transparent 32%)',
      `linear-gradient(180deg, ${rarity.cellGradient[0]}, ${rarity.cellGradient[1]})`,
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.05)',
      'inset 0 -2px 6px rgba(0,0,0,0.6)',
      isSelected ? rarity.activeGlowShadow : rarity.glowShadow,
    ].join(', '),
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={item.name}
      aria-pressed={isSelected}
      className={[
        'group relative aspect-square overflow-hidden  border text-left transition-all duration-150',
        'flex items-center justify-center cursor-pointer',
        rarity.borderClass,
        rarity.pulseClass ?? '',
        isSelected ? 'ring-2 ring-white/55 ring-offset-2 ring-offset-stone-950' : 'hover:ring-1 hover:ring-white/15',
      ].join(' ')}
      style={surfaceStyle} >
      <div className="pointer-events-none absolute inset-[2px] rounded-[10px] border border-white/5" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,120,0,0.08),transparent_62%)] opacity-60" />
      <span className="relative transition-transform duration-150 group-hover:scale-[1.15]">
        {(item.icon || SLOT_EMOJI_MAP[item.slot] || '🧰')}+{affixIcon}
      </span>
      <span className="absolute left-1 top-1 rounded-md border border-cyan-400/30 bg-cyan-900/75 px-1 py-0.5 text-[9px] font-mono font-bold text-cyan-100">
        {score}
      </span>
      {item.enhancementLevel > 0 && (
        <span className="absolute right-1 top-1 rounded-md border border-amber-400/30 bg-amber-950/85 px-1 py-0.5 text-[9px] font-mono font-bold text-amber-200">
          +{item.enhancementLevel}
        </span>
      )}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] opacity-90"
        style={{ background: `linear-gradient(90deg, transparent, ${rarity.accentColor}, transparent)` }}
      />
    </motion.button>
  );
}
