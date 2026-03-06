import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { memo,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SLOTS } from '../../../config/game/equipment';
import { INVENTORY_SURFACE_PRESETS } from '../../../config/ui/inventory';
import type { Equipment, GameState } from '../../../shared/types/game';
import { EquipmentSlot } from './EquipmentSlot';

interface PlayerEquipmentPanelProps {
  gameState: GameState;
  onUnequip: (slot: string) => void;
}

function PlayerEquipmentPanelInner({ gameState, onUnequip }: PlayerEquipmentPanelProps) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const handleSlotClick = (slot: string) => {
    const item = gameState.currentEquipment[slot as keyof typeof gameState.currentEquipment];
    if (item) {
      setSelectedSlot((current) => current === slot ? null : slot);
      return;
    }
    setSelectedSlot(null);
  };
  return (
    <div
      className="flex h-full flex-col border border-stone-900/35"
      style={INVENTORY_SURFACE_PRESETS.equipmentPanel}
    >
      <motion.section
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="relative flex-1 overflow-visible p-3"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-900/6 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-12 bg-gradient-to-r from-amber-500/50 to-transparent" />

        <h3 className="relative z-10 mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
            <Shield size={12} className="text-amber-400" />
            {t('player.currentEquipment')}
        </h3>

        <div className="grid grid-cols-1 gap-2">
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
      </motion.section>

    </div>
  );
}

export const PlayerEquipmentPanel = memo(PlayerEquipmentPanelInner);
