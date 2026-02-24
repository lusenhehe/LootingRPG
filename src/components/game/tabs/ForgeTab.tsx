import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { QUALITY_CONFIG } from '../../../config/game/equipment';
import { getQualityLabel, getSlotLabel, getStatLabel } from '../../../logic/i18n/labels';
import type { Equipment, GameState } from '../../../types/game';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { calculateEnchantCost, previewEnchant, rerollAffixes } from '../../../logic/equipment';


interface ForgeTabProps {
  gameState: GameState;
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onForge: (id: string) => void;
  onReroll: (id: string) => void;
}

type ForgeCandidate = {
  item: Equipment;
  source: string;
};

export function ForgeTab({ gameState, selectedId, loading, onSelect, onForge, onReroll }: ForgeTabProps) {
  const { t } = useTranslation();

  const equipped = (Object.entries(gameState.currentEquipment) as [string, Equipment | null][])
    .filter(([, item]) => Boolean(item))
    .map(([slot, item]) => ({ item: { ...(item as Equipment), equipped: true }, source: t('label.equipped') + '/' + getSlotLabel(slot) }));

  const backpack = gameState.backpack.map((item) => ({ item: { ...item, equipped: false }, source: t('label.backpack') }));
  const deduped = new Map<string, ForgeCandidate>();
  [...equipped, ...backpack].forEach((entry) => {
    deduped.set(entry.item.id, entry);
  });
  const candidates: ForgeCandidate[] = [...deduped.values()];

  const selected = candidates.find((entry) => entry.item.id === selectedId)?.item ?? candidates[0]?.item;

  // UI state for Forge interactions
  const [lockedTypes, setLockedTypes] = useState<string[]>([]);
  const [previewTimes, setPreviewTimes] = useState<number>(1);
  const [previewResult, setPreviewResult] = useState<Equipment | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleLock = (type: string) => {
    setLockedTypes((prev) => (prev.includes(type) ? prev.filter((p) => p !== type) : [...prev, type]));
  };

  const enchantCost = useMemo(() => (selected ? calculateEnchantCost(selected) * previewTimes : 0), [selected, previewTimes]);

  if (!selected) {
    return (
      <motion.div key="forge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <Sparkles className="mx-auto text-red-400" size={48} />
          <h2 className="text-xl font-display">{t('ui.forgeCenter')}</h2>
          <p className="text-sm text-gray-500">{t('ui.no_forge_items')}</p>
        </div>
      </motion.div>
    );
  }

  const forgeCost =  (selected.enhancementLevel + 1) * 500;
  const rerollCost = (selected.enhancementLevel + 1) * 300;
  const qualityColor = QUALITY_CONFIG[selected.quality]?.color || 'text-gray-400';

  return (
    <motion.div
      key="forge"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full grid grid-cols-1 gap-4 overflow-hidden"
      style={{ gridTemplateColumns: selected ? '35% 65%' : undefined }}
    >
      <div className="h-[420px] overflow-y-auto pr-2 space-y-2">
        {candidates.map(({ item, source }) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${selected.id === item.id ? 'border-red-700 bg-red-900/10 hover:border-red-600' : 'border-game-border/50 bg-game-bg/50 hover:border-red-800/50 hover:bg-game-card/50'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate flex items-center gap-1 ${QUALITY_CONFIG[item.quality]?.color || 'text-gray-200'}`}>
                  <span className="text-base leading-none">{item.icon || '🧰'}</span>
                  {item.name} {item.enhancementLevel > 0 ? `+${item.enhancementLevel}` : ''}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{getSlotLabel(item.slot)} · {source}</p>
              </div>
              {item.equipped && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-700/30 font-bold">
                  已装备
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-game-bg/80 border border-game-border/50 rounded-xl p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className={`text-base font-bold ${qualityColor} flex items-center gap-1`}>
            <span className="text-lg leading-none">{selected.icon || '🧰'}</span>
            {selected.name} {selected.enhancementLevel > 0 ? `+${selected.enhancementLevel}` : ''}
          </h3>
          <p className="text-xs text-gray-500">{selected.slot} • {selected.quality}</p>
        </div>

        <div className="space-y-1">
          {Object.entries(selected.attributes).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-400">{getStatLabel(key)}</span>
              <span className="font-mono text-gray-200">+{value}</span>
            </div>
          ))}
        </div>

        {selected.affixes && selected.affixes.length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs text-gray-400 mb-1">{t('label.affixes') || 'Affixes'}</h4>
            <div className="flex flex-col gap-2">
              {selected.affixes.map((affix, idx) => {
                const labelMap: Record<string, string> = {
                  crit_chance: t('stat.crit'),
                  lifesteal: t('stat.lifesteal'),
                  damage_bonus: t('stat.damage'),
                  thorns: t('trait.thorns'),
                  hp_bonus: t('stat.hp'),
                };
                const isLocked = lockedTypes.includes(affix.type);
                return (
                  <div key={`${affix.type}-${idx}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] px-2 py-1 rounded border border-white/10 bg-game-card/20 text-gray-200">{labelMap[affix.type] || affix.type}</span>
                      <span className="font-mono text-gray-200">+{affix.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        aria-pressed={isLocked}
                        onClick={() => toggleLock(affix.type)}
                        className={`px-2 py-1 rounded ${isLocked ? 'bg-red-800 text-white' : 'bg-game-card/10 text-gray-200'} text-xs`}
                      >
                        {isLocked ? t('ui.forge.lock') || 'Lock' : t('ui.forge.unlock') || 'Lock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selected.special && <p className="text-xs text-red-400 italic">★ {selected.special}</p>}

        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">{t('ui.forge.preview_times') || 'Preview'}</label>
            <div className="flex gap-2 ml-2">
              {[1, 5, 10].map((n) => (
                <button key={n} onClick={() => setPreviewTimes(n)} className={`px-3 py-1 rounded text-sm ${previewTimes === n ? 'bg-red-700 text-white' : 'bg-game-card/10 text-gray-200'}`}>{n}</button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-400">{t('ui.forge.cost') || 'Cost'}: <span className="font-mono">{enchantCost}</span></div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!selected) return;
                const preview = previewEnchant(JSON.parse(JSON.stringify(selected)), previewTimes);
                setPreviewResult(preview);
              }}
              disabled={loading}
              className="flex-1 py-2 rounded-lg border border-red-700/30 bg-red-900/10 text-red-400 hover:bg-red-700 hover:text-white text-sm font-bold"
            >
              {t('ui.forge.preview') || 'Preview'}
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={loading || gameState.playerStats.gold < enchantCost}
              className="flex-1 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white text-sm font-bold"
            >
              {t('ui.forge.apply') || 'Apply'} ({enchantCost})
            </button>
            <button
              onClick={() => {
                if (!selected) return;
                const copy = JSON.parse(JSON.stringify(selected));
                const preview = rerollAffixes(copy, { lockTypes: lockedTypes });
                setPreviewResult(preview);
              }}
              disabled={loading}
              className="py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white text-sm font-bold"
            >
              {t('ui.forge.reroll') || 'Reroll'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      {confirmOpen && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-game-bg border border-game-border rounded-lg p-6" style={{ width: 'min(92%,560px)' }}>
            <h3 className="text-lg font-bold mb-2">{t('ui.forge.confirm_title') || 'Confirm Enchant'}</h3>
            <p className="text-sm text-gray-300 mb-4">{t('ui.forge.confirm_body') || 'This will consume resources and apply the enchant.'}</p>
            {previewResult && (
              <div className="mb-4">
                <h4 className="text-sm text-gray-400 mb-2">{t('ui.forge.preview') || 'Preview'}</h4>
                <div className="space-y-2">
                  {Object.entries(previewResult.attributes).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-400">{getStatLabel(k)}</span>
                      <span className="font-mono text-gray-200">+{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded bg-game-card/10">{t('button.cancel') || 'Cancel'}</button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  for (let i = 0; i < previewTimes; i++) {
                    onForge(selected.id);
                  }
                }}
                className="px-4 py-2 rounded bg-yellow-500 text-white"
              >
                {t('button.confirm') || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
