import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Equipment } from '../../shared/types/game';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Zap, Shield, Sword, Flame, Droplets, Sparkles, AlertTriangle, User, Package, Gem } from 'lucide-react';
import { getSlotLabel } from '../../infra/i18n/labels';
import { SLOT_CONFIG } from '../../config/game/equipment';

const qualityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common:   { bg: 'from-stone-600 to-stone-700', border: 'border-stone-500', text: 'text-stone-300', glow: 'shadow-stone-500/20' },
  uncommon: { bg: 'from-green-700 to-green-800', border: 'border-green-500', text: 'text-green-300', glow: 'shadow-green-500/30' },
  rare:     { bg: 'from-blue-700 to-blue-800', border: 'border-blue-400', text: 'text-blue-300', glow: 'shadow-blue-500/30' },
  epic:     { bg: 'from-red-700 to-red-800', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/40' },
  legendary:{ bg: 'from-amber-600 to-amber-700', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-500/50' },
  mythic:   { bg: 'from-purple-700 to-purple-800', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
};

const slotTypeIconMap: Record<string, React.ReactNode> = {
  sword:   <Sword   size={14} className="text-amber-400" />,
  user:    <User    size={14} className="text-gray-300"  />,
  package: <Package size={14} className="text-gray-300"  />,
  star:    <Star    size={14} className="text-red-400"   />,
  gem:     <Gem     size={14} className="text-blue-400"  />,
  shield:  <Shield  size={14} className="text-gray-400"  />,
};

interface EquipmentTooltipProps {
  item: Equipment;
  position: 'hover' | 'click';
  onClose: () => void;
}

const affixLabels: Record<string, string> = {
  attack: 'Attack',
  defense: 'Defense', 
  hp: 'HP',
  crit: 'Crit',
  critDamage: 'Crit DMG',
  dodge: 'Dodge',
  block: 'Block',
  lifesteal: 'LifeSteal',
  thorns: 'Thorns',
  fireDmg: 'Fire DMG',
  iceDmg: 'Ice DMG',
  lightningDmg: 'Lightning DMG',
  poisonDmg: 'Poison DMG',
  fireRes: 'Fire RES',
  iceRes: 'Ice RES',
  lightningRes: 'Lightning RES',
  poisonRes: 'Poison RES',
};

const affixIcons: Record<string, React.ReactNode> = {
  attack: <Sword size={10} />,
  defense: <Shield size={10} />,
  hp: <Sparkles size={10} />,
  crit: <Star size={10} />,
  critDamage: <Zap size={10} />,
  lifesteal: <Droplets size={10} />,
  thorns: <AlertTriangle size={10} />,
  fireDmg: <Flame size={10} />,
};

function EquipmentTooltipInner({ item, position, onClose }: EquipmentTooltipProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const displayName = item.localeNames?.[lang] || item.name;
  const quality = qualityColors[item.quality] || qualityColors.common;
  
  const mainStatValue = item.attributes[item.mainStat] || 0;
  const otherAttrs = Object.entries(item.attributes).filter(([key]) => key !== item.mainStat);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 5 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-tooltip-fixed w-64 p-3 rounded-sm border ${quality.border} bg-gradient-to-b ${quality.bg} shadow-xl ${quality.glow}`}
      style={position === 'click' ? { position: 'fixed', zIndex: 9999 } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute -top-px left-4 w-4 h-px bg-current opacity-50" />
      <div className="absolute -bottom-px right-4 w-4 h-px bg-current opacity-50" />
      
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl leading-none">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-display font-bold text-sm ${quality.text} truncate`}>
            {displayName}
          </div>
          <div className="text-[10px] text-stone-400 uppercase tracking-wider">
            Lv.{item.level} • {item.slot}
          </div>
        </div>
      </div>

      {item.enhancementLevel > 0 && (
        <div className="mb-2 px-1.5 py-0.5 bg-red-900/50 border border-red-500/50 rounded-sm">
          <span className="text-red-300 font-mono text-xs font-bold">+{item.enhancementLevel}</span>
        </div>
      )}

      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between px-1.5 py-1 bg-black/30 rounded-sm border border-white/5">
          <span className="text-[10px] text-stone-400 uppercase">Main Stat</span>
          <span className={`font-mono font-bold text-sm ${quality.text}`}>
            +{mainStatValue} {item.mainStat}
          </span>
        </div>
        
        {otherAttrs.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-1.5 py-1 bg-black/20 rounded-sm">
            <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
              {affixIcons[key]}
              {affixLabels[key] || key}
            </span>
            <span className="font-mono text-xs text-stone-300">+{value}</span>
          </div>
        ))}
      </div>

      {item.affixes && item.affixes.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-[9px] text-stone-500 uppercase mb-1">Affixes</div>
          {item.affixes.map((affix, idx) => (
            <div key={idx} className="text-[10px] text-amber-300/80">
              {affix.type}: +{affix.value}
            </div>
          ))}
        </div>
      )}

      {item.special && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-[9px] text-stone-500 uppercase mb-1">Special</div>
          <div className="text-[10px] text-purple-300">{item.special}</div>
        </div>
      )}

      {position === 'click' && (
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-stone-500 hover:text-stone-300 text-xs"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}

export const EquipmentTooltip = memo(EquipmentTooltipInner);

interface EquipmentSlotProps {
  slot: string;
  item: Equipment | null;
  isSelected: boolean;
  onSelect: (slot: string) => void;
}

function EquipmentSlotInner({ slot, item, isSelected, onSelect }: EquipmentSlotProps) {
  const [showTooltip, setShowTooltip] = useState<'hover' | null>(null);
  
  const qualityClass = item ? {
    common:   'border-quality-common',
    uncommon: 'equip-slot-uncommon',
    rare:     'equip-slot-rare',
    epic:     'equip-slot-epic',
    legendary:'equip-slot-legendary',
    mythic:   'equip-slot-mythic',
  }[item.quality] || 'border-stone-700' : '';

  const handleMouseEnter = () => {
    if (item) {
      setShowTooltip('hover');
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(slot);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div 
        className={`relative aspect-square rounded-sm border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
          isSelected 
            ? 'ring-2 ring-red-700 ring-offset-1 ring-offset-stone-950' 
            : item 
              ? `bg-stone-900/60 border-solid ${qualityClass} hover:ring-2 hover:ring-amber-500/30` 
              : 'border-stone-800/40 hover:border-red-800/40 hover:bg-stone-800/30'
        }`}
      >
        {item ? (
          <div className="flex flex-col items-center">
            <span className="text-3xl leading-none">{item.icon || '🧰'}</span>
            {item.enhancementLevel > 0 && (
              <span className="absolute top-0.5 right-0.5 text-[8px] font-mono text-red-400 bg-red-950/50 px-1 rounded-sm">
                +{item.enhancementLevel}
              </span>
            )}
            {item.quality === 'legendary' && (
              <div className="absolute inset-0 rounded-sm legendary-shine pointer-events-none" />
            )}
            {item.quality === 'mythic' && (
              <div className="absolute inset-0 rounded-sm mythic-glow pointer-events-none" />
            )}
          </div>
        ) : (
          <span className="text-[9px] text-stone-600 uppercase font-mono flex flex-col items-center gap-1">
            {slotTypeIconMap[SLOT_CONFIG[slot]?.icon || 'package']}
            {getSlotLabel(slot)}
          </span>
        )}

        <AnimatePresence>
          {showTooltip === 'hover' && item && (
            <div className="absolute z-tooltip left-full top-0 ml-2 pointer-events-auto">
              <EquipmentTooltip item={item} position="hover" onClose={() => {}} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const EquipmentSlot = memo(EquipmentSlotInner);
