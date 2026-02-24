import { ArrowUpCircle, Shield, Sword, User, Star, Gem, Package, Flame, Droplets, ShieldAlert, Sparkles, Gauge, Coins } from 'lucide-react';
import { getSlotLabel, getQualityLabel, getStatLabel } from '../../logic/i18n/labels';
import { getDerivedStats } from '../../logic/uiHelpers';
import { getEquipmentTotals } from '../../logic/equipmentUtils';
import { QUALITY_CONFIG, SLOT_CONFIG, SLOTS } from '../../config/game/equipment';
import type { Equipment, GameState } from '../../types/game';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';

const slotTypeIconMap: Record<string, ReactNode> = {
  sword: <Sword size={14} className="text-amber-400" />,
  user: <User size={14} className="text-gray-300" />,
  package: <Package size={14} className="text-gray-300" />,
  star: <Star size={14} className="text-red-400" />,
  gem: <Gem size={14} className="text-blue-400" />,
  shield: <Shield size={14} className="text-gray-400" />,
};

interface PlayerPanelProps {
  gameState: GameState;
  onUnequip: (slot: string) => void;
}

export function PlayerPanel({ gameState, onUnequip }: PlayerPanelProps) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  const derivedStats = useMemo(() => {
    const base = getDerivedStats(gameState);
    // add icons to each entry here so the util stays UI-agnostic
    return base.map((stat) => {
      let icon: ReactNode = null;
      switch (stat.key) {
        case 'dmg':
          icon = <Flame size={12} className="text-orange-300" />;
          break;
        case 'ls':
          icon = <Droplets size={12} className="text-red-300" />;
          break;
        case 'thorns':
          icon = <ShieldAlert size={12} className="text-emerald-300" />;
          break;
        case 'element':
          icon = <Sparkles size={12} className="text-cyan-300" />;
          break;
        case 'spd':
          icon = <Gauge size={12} className="text-red-400" />;
          break;
      }
      return { ...stat, icon };
    });
  }, [gameState]);

  const selectedItem = selectedSlot 
    ? gameState.currentEquipment[selectedSlot as keyof typeof gameState.currentEquipment] as Equipment | null
    : null;

  const selectedLocaleName = selectedItem
    ? (t('quality.common') === '普通'
      ? (selectedItem.localeNames?.zh || selectedItem.name)
      : (selectedItem.localeNames?.en || selectedItem.name))
    : '';

  const qualityColor = useMemo(() => {
    return selectedItem
      ? QUALITY_CONFIG[selectedItem.quality]?.color || 'text-gray-400'
      : 'text-gray-400';
  }, [selectedItem]);

  const equipmentTotals = useMemo(() => {
    return getEquipmentTotals(gameState.currentEquipment);
  }, [gameState]);

  // you could render equipmentTotals in a tooltip or debug panel; for now we simply log when it changes
  useMemo(() => {
    console.debug('equipment totals', equipmentTotals);
    return null;
  }, [equipmentTotals]);

  const handleSlotClick = (slot: string) => {
    const item = gameState.currentEquipment[slot as keyof typeof gameState.currentEquipment];
    if (item) {
      setSelectedSlot(selectedSlot === slot ? null : slot);
    }
  };

  const handleUnequipClick = () => {
    if (selectedSlot) {
      onUnequip(selectedSlot);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="lg:col-span-4 space-y-3">
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-gradient-to-br from-game-card to-game-card/80 border border-game-border/50 rounded-xl p-3 shadow-xl shadow-red-900/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
          <Sparkles size={12} className="text-cyan-300" /> {t('player.battleAffixes')}
        </h3>

        <div className="grid grid-cols-5 gap-1.5 relative z-10">
          {derivedStats.map((stat) => {
            const active = stat.rawValue > 0;
            return (
              <motion.div
                key={stat.key}
                whileHover={{ scale: 1.02 }}
                className={`rounded-lg border px-2 py-1.5 transition-all ${active ? stat.accent : 'border-white/10 bg-white/[0.03] text-gray-500'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1">
                    {stat.icon}
                  </span>
                  <span className={`font-mono text-[10px] font-bold ${active ? 'text-white' : 'text-gray-500'}`}>
                    {stat.value}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-game-card to-game-card/80 border border-game-border/50 rounded-xl p-3 shadow-xl shadow-red-900/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent" />
        
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
          <Shield size={12} className="text-red-400" /> {t('player.currentEquipment')}
        </h3>
        
        <div className="grid grid-cols-3 gap-2 relative z-10">
          {SLOTS.map((slot) => {
            const item = (gameState.currentEquipment as Record<string, Equipment | null>)[slot] || null;
            const qualityClass = item ? {
              common: 'border-quality-common',
              uncommon: 'equip-slot-uncommon',
              rare: 'equip-slot-rare',
              epic: 'equip-slot-epic',
              legendary: 'equip-slot-legendary',
              mythic: 'equip-slot-mythic',
            }[item.quality] || 'border-game-border' : '';

            return (
            <div 
              key={slot}
              onClick={() => handleSlotClick(slot)}
              className={`relative aspect-square rounded-lg border border-dashed flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                selectedSlot === slot 
                  ? 'ring-2 ring-red-700 ring-offset-2 ring-offset-game-bg' 
                  : item 
                    ? `bg-game-bg/60 border-solid ${qualityClass}` 
                    : 'border-game-border/40 hover:border-red-800/40 hover:bg-game-card'
              }`}
            >
              {item ? (
                <div className="flex flex-col items-center">
                  <span className="text-3xl leading-none">{item.icon || '🧰'}</span>
                  {item.enhancementLevel > 0 && (
                    <span className="absolute top-1 right-1 text-[8px] font-mono text-red-400 bg-red-950/50 px-1 rounded">
                      +{item.enhancementLevel}
                    </span>
                  )}
                  {item.quality === 'legendary' && (
                    <div className="absolute inset-0 rounded-lg legendary-shine pointer-events-none" />
                  )}
                  {item.quality === 'mythic' && (
                    <div className="absolute inset-0 rounded-lg mythic-glow pointer-events-none" />
                  )}
                </div>
              ) : (
                <span className="text-[9px] text-gray-600 uppercase font-mono flex flex-col items-center gap-1">
                  {slotTypeIconMap[SLOT_CONFIG[slot]?.icon || 'package']}
                  {getSlotLabel(slot)}
                </span>
              )}
            </div>
          );        
        })}
        </div>
      </motion.section>

      {selectedItem && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-game-bg/95 backdrop-blur-sm border rounded-xl p-4 shadow-2xl ${selectedItem.quality === 'mythic' ? 'mythic-border' : selectedItem.quality === 'legendary' ? 'legendary-border' : 'border-game-border'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-game-card/60 text-3xl leading-none">{selectedItem.icon || '🧰'}</div>
            <div>
              <h4 className={`font-bold text-sm ${qualityColor}`}>
                {selectedLocaleName} {selectedItem.enhancementLevel > 0 ? `+${selectedItem.enhancementLevel}` : ''}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500 uppercase font-mono">Lv.{selectedItem.level} • {selectedItem.slot}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 bg-game-card/40 text-gray-300 font-mono mt-1 inline-block">
                {getQualityLabel(selectedItem.quality)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-mono ml-auto">
              <Coins size={10} /> {QUALITY_CONFIG[selectedItem.quality].price}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 border-y border-game-border/50">
            {Object.entries(selectedItem.attributes).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="text-gray-500">{getStatLabel(k)}</span>
                <span className="text-gray-300 font-mono">+{v}</span>
              </div>
            ))}
          </div>

          {selectedItem.affixes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(() => {
                const labelMap: Record<string, string> = {
                  crit_chance: t('stat.crit'),
                  lifesteal: t('stat.lifesteal'),
                  damage_bonus: t('stat.damage'),
                  thorns: t('trait.thorns'),
                  hp_bonus: t('stat.hp'),
                };
                return selectedItem.affixes.map((affix) => (
                  <span
                    key={`${affix.type}-${affix.value}`}
                    className="text-[9px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  >
                    {labelMap[affix.type] || getStatLabel(affix.type)} +{affix.value}
                  </span>
                ));
              })()}
            </div>
          )}

          {selectedItem.special && (
            <p className="text-[10px] text-red-400 italic leading-tight mt-2">★ {selectedItem.special}</p>
          )}

          <div className="mt-3 pt-2 border-t border-game-border/50">
            <button 
              onClick={handleUnequipClick}
              className="w-full py-2 bg-red-900/30 hover:bg-red-800 text-red-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-red-700/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowUpCircle size={14} />
              卸下装备
            </button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
