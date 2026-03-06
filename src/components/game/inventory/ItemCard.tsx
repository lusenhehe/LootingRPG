import { Coins, Trash2, Shield, Zap, Gem, Crown, Star, Hexagon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { QUALITY_CONFIG } from '../../../config/game/equipment';
import { SLOT_EMOJI_MAP } from '../../../config/ui/icons';
import { getQualityLabel, getStatLabel } from '../../../infra/i18n/labels';
import type { Equipment } from '../../../shared/types/game';

const iconMap: Record<string, ReactNode> = {
  shield: <Shield size={18} className="text-gray-400" />,
  zap: <Zap size={18} className="text-emerald-400" />,
  gem: <Gem size={18} className="text-blue-400" />,
  hexagon: <Hexagon size={18} className="text-red-400" />,
  crown: <Crown size={18} className="text-yellow-400" />,
  star: <Star size={18} className="text-red-400" />,
};

interface ItemCardProps {
  item: Equipment;
  onEquip?: () => void;
  onSell?: () => void;
  onForge?: () => void;
  loading: boolean;
  readonly?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
}

export function ItemCard({ item, onEquip, onSell, onForge, loading, readonly, highlighted, onClick }: ItemCardProps) {
  const qualityColor = QUALITY_CONFIG[item.quality]?.color || 'text-gray-400';
  const qualityIcon = iconMap[QUALITY_CONFIG[item.quality]?.iconName || 'shield'];
  const forgeCost = (item.enhancementLevel + 1) * 500;
  const { t, i18n } = useTranslation();
  const localeName = i18n.language.startsWith('zh') ? (item.localeNames?.zh || item.name) : (item.localeNames?.en || item.name);
  const borderClass = item.quality === 'mythic'
    ? 'mythic-border shadow-lg shadow-red-900/30'
    : item.quality === 'legendary'
      ? 'legendary-border shadow-lg shadow-amber-900/20'
      : highlighted
        ? 'border-red-700 shadow-lg shadow-red-900/30'
        : 'border-game-border/50 hover:border-red-800/50';

  const bgClass = item.quality === 'mythic'
    ? 'mythic-card-bg'
    : item.quality === 'legendary'
      ? 'legendary-card-bg'
      : 'bg-game-bg/80';

  return (
    <div
      onClick={onClick}
      className={`${bgClass} relative space-y-3 rounded-xl border p-4 transition-all duration-200 hover:shadow-lg ${borderClass} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      {item.quality === 'mythic' && (
        <div className="mythic-ornaments" aria-hidden>
          <div className="mythic-embers" />
          <span className="mythic-sparkle s1" />
          <span className="mythic-sparkle s2" />
          <span className="mythic-sparkle s3" />
          <span className="mythic-sparkle s4" />
          <span className="mythic-sparkle s5" />
          <div className="mythic-shard sh1" />
          <div className="mythic-shard sh2" />
          <div className="mythic-shard sh3" />
          <div className="mythic-ember-trail" />
        </div>
      )}
      {item.equipped && (
        <span className="absolute right-2 top-2 rounded-full border border-red-700/30 bg-red-900/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
          {t('label.equipped')}
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-game-card/60 p-2 text-2xl leading-none">
            {SLOT_EMOJI_MAP[item.slot] || '🧰'}-{item.icon || '🧰'}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${qualityColor}`}>
              {localeName} {item.enhancementLevel > 0 ? `+${item.enhancementLevel}` : ''}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-gray-500">Lv.{item.level} • {item.slot}</span>
              <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-game-card/40 px-1.5 py-0.5 text-[10px] font-mono text-gray-300">
                {qualityIcon}
                {getQualityLabel(item.quality)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-yellow-400">
          <Coins size={10} /> {QUALITY_CONFIG[item.quality].price}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-y border-game-border/50 py-2">
        {Object.entries(item.attributes).map(([key, value]) => (
          <div key={key} className="flex justify-between text-[10px]">
            <span className="text-gray-500">{getStatLabel(key)}</span>
            <span className="font-mono text-gray-300">+{value}</span>
          </div>
        ))}
      </div>

      {item.affixes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.affixes.map((affix) => (
            <span
              key={`${affix.type}-${affix.value}`}
              className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300"
            >
              {t(`stat.${affix.type}`, affix.type)} +{affix.value}
            </span>
          ))}
        </div>
      )}
      {!readonly && (
        <div className="flex gap-2 pt-1">
          <button onClick={onEquip} disabled={loading} className="flex-1 cursor-pointer rounded-lg border border-red-700/20 bg-red-900/20 py-1.5 text-[10px] font-bold text-red-400 transition-all hover:scale-105 hover:bg-red-800 hover:text-white">{t('button.equip')}</button>
          <button onClick={onForge} disabled={loading} className="flex-1 cursor-pointer rounded-lg border border-yellow-500/20 bg-yellow-500/10 py-1.5 text-[10px] font-bold text-yellow-400 transition-all hover:scale-105 hover:bg-yellow-500 hover:text-white" title={`Cost ${forgeCost} gold`}>{t('button.enchant')}</button>
          <button onClick={onSell} disabled={loading} className="cursor-pointer rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-400 transition-all hover:scale-105 hover:bg-red-500 hover:text-white"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  );
}
