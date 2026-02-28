import { Shield, Flame, Droplets, ShieldAlert, Sparkles, Gauge } from 'lucide-react';
import { getDerivedStats } from '../../domains/player/services/derivedStats';
import { SLOTS } from '../../config/game/equipment';
import type { Equipment, GameState } from '../../types/game';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { memo } from 'react';
import { EquipmentSlot } from './EquipmentSlot';

interface PlayerPanelProps {
  gameState: GameState;
  onUnequip: (slot: string) => void;
}

function PlayerPanelInner({ gameState, onUnequip }: PlayerPanelProps) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<'affix' | 'equipment'>('equipment');
  
  const derivedStats = useMemo(() => {
    const base = getDerivedStats(gameState);
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

  const handleSlotClick = (slot: string) => {
    const item = gameState.currentEquipment[slot as keyof typeof gameState.currentEquipment];
    if (item) {
      setSelectedSlot(selectedSlot === slot ? null : slot);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 w-56 stone-slab-panel clip-corner-8 border border-amber-900/35">
      <motion.section 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="p-3 relative overflow-visible flex-1 min-h-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent" />
        <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-amber-600/50 to-transparent" />
        
        <h3 className="text-[10px] font-display font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
          {detailView === 'equipment' ? (
            <>
              <Shield size={11} className="text-red-400" /> {t('player.currentEquipment')}
            </>
          ) : (
            <>
              <Sparkles size={11} className="text-cyan-400" /> {t('player.affixBonuses')}
            </>
          )}
        </h3>

        {detailView === 'equipment' ? (
          <div className="grid grid-cols-2 gap-2 relative z-10 translate-x-[1px]">
            {SLOTS.map((slot) => {
              const item = (gameState.currentEquipment as Record<string, Equipment | null>)[slot] || null;
              return (
                <EquipmentSlot
                  key={slot}
                  slot={slot}
                  item={item}
                  isSelected={selectedSlot === slot}
                  onSelect={handleSlotClick}
                  onUnequip={() => onUnequip(slot)}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 relative z-10 clip-corner-8 border border-stone-800/50 bg-stone-950/45 p-1.5">
            {derivedStats.map((stat) => {
              const active = stat.rawValue > 0;
              return (
                <motion.div
                  key={stat.key}
                  whileHover={{ scale: 1.05 }}
                  className={`px-2 py-1.5 text-[10px] border transition-all rounded-sm cursor-default ${
                    active 
                      ? `${stat.accent} bg-stone-900/50` 
                      : 'border-stone-800/50 bg-stone-900/30 text-stone-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {stat.icon}
                    <span className="font-mono">{stat.value}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      <div className="p-2 border-t border-amber-900/25 flex gap-2">
        <button
          onClick={() => setDetailView('affix')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-display uppercase tracking-wide clip-corner-8 border transition-colors cursor-pointer ${
            detailView === 'affix'
              ? 'text-cyan-200 bg-cyan-900/20 border-cyan-700/40'
              : 'text-stone-400 bg-black/25 border-stone-800/60 hover:text-stone-200'
          }`}
        >
          {t('player.affixBonuses')}
        </button>
        <button
          onClick={() => setDetailView('equipment')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-display uppercase tracking-wide clip-corner-8 border transition-colors cursor-pointer ${
            detailView === 'equipment'
              ? 'text-amber-200 bg-amber-900/20 border-amber-700/40'
              : 'text-stone-400 bg-black/25 border-stone-800/60 hover:text-stone-200'
          }`}
        >
          {t('player.currentEquipment')}
        </button>
      </div>
    </div>
  );
}

export const PlayerPanel = memo(PlayerPanelInner);
