import { Coins, Trash2, Shield, Zap, Gem, Crown, Star, Hexagon } from 'lucide-react';
import type { ReactNode } from 'react';
import { QUALITY_CONFIG } from '../../config/game/equipment';
import { getQualityLabel, getStatLabel } from '../../logic/i18n/labels';
import type { Equipment } from '../../types/game';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, ReactNode> = {
  shield: <Shield size={18} className="text-gray-400" />,
  zap: <Zap size={18} className="text-emerald-400" />,
  gem: <Gem size={18} className="text-blue-400" />,
  hexagon: <Hexagon size={18} className="text-purple-400" />,
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
  const qualityColor = QUALITY_CONFIG[item.品质]?.color || 'text-gray-400';
  const qualityIcon = iconMap[QUALITY_CONFIG[item.品质]?.iconName || 'shield'];
  const forgeCost = (item.强化等级 + 1) * 500;
  const { t } = useTranslation();
  const affixLabelMap: Record<string, string> = {
    crit_chance: t('stat.crit'),
    lifesteal: t('stat.lifesteal'),
    damage_bonus: t('stat.damage'),
    thorns: t('trait.thorns'),
    hp_bonus: t('stat.hp'),
  };

  const borderClass = item.品质 === 'mythic' 
    ? 'mythic-border shadow-lg shadow-red-900/30' 
    : item.品质 === 'legendary' 
      ? 'legendary-border shadow-lg shadow-amber-900/20' 
      : highlighted 
        ? 'border-violet-500 shadow-lg shadow-violet-500/20' 
        : 'border-game-border/50 hover:border-violet-500/50';

  const bgClass = item.品质 === 'mythic' 
    ? 'mythic-card-bg' 
    : item.品质 === 'legendary' 
      ? 'legendary-card-bg' 
      : 'bg-game-bg/80';

  return (
    <div
      onClick={onClick}
      className={`${bgClass} border rounded-xl p-4 space-y-3 transition-all duration-200 relative group hover:shadow-lg ${borderClass} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      {item.已装备 && (
        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 font-bold">
          {t('label.equipped')}
        </span>
      )}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-game-card/60 text-2xl leading-none">{item.icon || '🧰'}</div>
          <div>
            <h4 className={`font-bold text-sm ${qualityColor}`}>
              {item.名称} {item.强化等级 > 0 ? `+${item.强化等级}` : ''}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Lv.{item.等级} • {item.部位}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 bg-game-card/40 text-gray-300 font-mono inline-flex items-center gap-1">
                {qualityIcon}
                {getQualityLabel(item.品质)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-mono">
          <Coins size={10} /> {QUALITY_CONFIG[item.品质].price}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 border-y border-game-border/50">
        {Object.entries(item.属性).map(([k, v]) => (
          <div key={k} className="flex justify-between text-[10px]">
            <span className="text-gray-500">{getStatLabel(k)}</span>
            <span className="text-gray-300 font-mono">+{v}</span>
          </div>
        ))}
      </div>

      {item.affixes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.affixes.map((affix) => (
            <span
              key={`${affix.type}-${affix.value}`}
              className="text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            >
              {affixLabelMap[affix.type] || affix.type} +{affix.value}
            </span>
          ))}
        </div>
      )}

      {item.特殊效果 && <p className="text-[10px] text-violet-400 italic leading-tight">★ {item.特殊效果}</p>}

      {!readonly && (
        <div className="flex gap-2 pt-1">
          <button onClick={onEquip} disabled={loading} className="flex-1 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-violet-500/20 cursor-pointer hover:scale-105">{t('button.equip')}</button>
          <button onClick={onForge} disabled={loading} className="flex-1 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-yellow-500/20 cursor-pointer hover:scale-105" title={`消耗 ${forgeCost} 金币`}>{t('button.enchant')}</button>
          <button onClick={onSell} disabled={loading} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-red-500/20 cursor-pointer hover:scale-105"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  );
}
