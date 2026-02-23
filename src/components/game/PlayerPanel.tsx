import { ArrowUpCircle, Heart, Shield, Sword, User, Zap, Gem, Crown, Star, Hexagon, Flame, Droplets, ShieldAlert, Sparkles, Gauge } from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Equipment, GameState } from '../../types/game';
import { getQualityColor, getQualityLabel, QUALITY_CONFIG, getSlotLabel } from '../../constants/game';

const slotIconMap: Record<string, ReactNode> = {
  shield: <Shield size={14} className="text-gray-400" />,
  zap: <Zap size={14} className="text-emerald-400" />,
  gem: <Gem size={14} className="text-blue-400" />,
  hexagon: <Hexagon size={14} className="text-purple-400" />,
  crown: <Crown size={14} className="text-yellow-400" />,
  star: <Star size={14} className="text-red-400" />,
};

interface PlayerPanelProps {
  gameState: GameState;
  onUnequip: (slot: string) => void;
}

export function PlayerPanel({ gameState, onUnequip }: PlayerPanelProps) {
  const expProgress = (gameState.玩家状态.经验 / (gameState.玩家状态.等级 * 100)) * 100;
  const critRateLabel = `${String(gameState.玩家状态.暴击率).replace('%', '')}%`;
  const derivedStats = [
    {
      key: 'dmg',
      label: '伤害加成',
      value: `${gameState.玩家状态.伤害加成}%`,
      rawValue: gameState.玩家状态.伤害加成,
      icon: <Flame size={12} className="text-orange-300" />,
      accent: 'border-orange-400/35 bg-orange-500/10 text-orange-200',
    },
    {
      key: 'ls',
      label: '吸血',
      value: `${gameState.玩家状态.吸血}%`,
      rawValue: gameState.玩家状态.吸血,
      icon: <Droplets size={12} className="text-red-300" />,
      accent: 'border-red-400/35 bg-red-500/10 text-red-200',
    },
    {
      key: 'thorns',
      label: '反伤',
      value: `${gameState.玩家状态.反伤}%`,
      rawValue: gameState.玩家状态.反伤,
      icon: <ShieldAlert size={12} className="text-emerald-300" />,
      accent: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
    },
    {
      key: 'element',
      label: '元素伤害',
      value: `+${gameState.玩家状态.元素伤害}`,
      rawValue: gameState.玩家状态.元素伤害,
      icon: <Sparkles size={12} className="text-cyan-300" />,
      accent: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
    },
    {
      key: 'spd',
      label: '攻击速度',
      value: `+${gameState.玩家状态.攻击速度}`,
      rawValue: gameState.玩家状态.攻击速度,
      icon: <Gauge size={12} className="text-violet-300" />,
      accent: 'border-violet-400/35 bg-violet-500/10 text-violet-200',
    },
  ];

  return (
    <div className="lg:col-span-4 space-y-6">
      <motion.section 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-game-card to-game-card/80 border border-game-border/50 rounded-2xl p-5 space-y-4 shadow-xl shadow-purple-500/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <User className="text-white" size={20} />
              </motion.div>
              <div>
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400"
                >
                  LV.{gameState.玩家状态.等级}
                </motion.span>
                <div className="text-[10px] text-gray-500 font-mono">冒险者</div>
              </div>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-right"
            >
              <div className="text-xs text-gray-500 font-mono">EXP</div>
              <div className="text-sm font-bold text-violet-300">{gameState.玩家状态.经验} / {gameState.玩家状态.等级 * 100}</div>
            </motion.div>
          </div>

          <div className="w-full bg-game-border/50 h-3 rounded-full overflow-hidden mt-3 relative">
            <motion.div
              className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 h-full shadow-lg shadow-purple-500/50 relative"
              initial={{ width: 0 }}
              animate={{ width: `${expProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-game-bg/50 rounded-xl p-3 border border-game-border/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sword size={14} className="text-red-400" />
                <span className="text-[10px] text-gray-500 uppercase">攻击力</span>
              </div>
              <motion.span 
                key={gameState.玩家状态.攻击力}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-red-400"
              >
                {gameState.玩家状态.攻击力}
              </motion.span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-game-bg/50 rounded-xl p-3 border border-game-border/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Heart size={14} className="text-green-400" />
                <span className="text-[10px] text-gray-500 uppercase">生命值</span>
              </div>
              <motion.span 
                key={gameState.玩家状态.生命值}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-green-400"
              >
                {gameState.玩家状态.生命值}
              </motion.span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-game-bg/50 rounded-xl p-3 border border-game-border/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-blue-400" />
                <span className="text-[10px] text-gray-500 uppercase">防御力</span>
              </div>
              <motion.span 
                key={gameState.玩家状态.防御力}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-blue-400"
              >
                {gameState.玩家状态.防御力}
              </motion.span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-game-bg/50 rounded-xl p-3 border border-game-border/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-[10px] text-gray-500 uppercase">暴击率</span>
              </div>
              <motion.span 
                key={gameState.玩家状态.暴击率}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-yellow-400"
              >
                {critRateLabel}
              </motion.span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-gradient-to-br from-game-card to-game-card/80 border border-game-border/50 rounded-2xl p-5 shadow-xl shadow-purple-500/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
          <Sparkles size={14} className="text-cyan-300" /> 战斗词条加成
        </h3>

        <div className="grid grid-cols-2 gap-2 relative z-10">
          {derivedStats.map((stat) => {
            const active = stat.rawValue > 0;
            return (
              <motion.div
                key={stat.key}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl border px-2.5 py-2 transition-all ${active ? stat.accent : 'border-white/10 bg-white/[0.03] text-gray-500'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                    {stat.icon}
                    {stat.label}
                  </span>
                  <span className={`font-mono text-xs font-bold ${active ? 'text-white' : 'text-gray-500'}`}>
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
        className="bg-gradient-to-br from-game-card to-game-card/80 border border-game-border/50 rounded-2xl p-5 shadow-xl shadow-purple-500/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 to-transparent" />
        
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
          <Shield size={14} className="text-violet-400" /> 当前装备
        </h3>
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {(Object.entries(gameState.当前装备) as [string, Equipment | null][]).map(([slot, item]) => (
            <div key={slot} className="relative group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`h-24 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all duration-200 ${item 
                  ? `bg-game-bg/80 border-solid ${getQualityColor(item.品质).replace('text-', 'border-')}` 
                  : 'border-game-border/50 hover:border-violet-500/50 hover:bg-game-card'}`}
              >
                {item ? (
                  <div className="flex flex-col items-center w-full px-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-2xl leading-none">{item.icon || '🧰'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 bg-game-card/50 text-gray-200 font-mono inline-flex items-center gap-1">
                        {slotIconMap[QUALITY_CONFIG[item.品质]?.iconName || 'shield']}
                        {getQualityLabel(item.品质)}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium truncate w-full text-center px-1 text-gray-200">{item.名称}</span>
                    <span className="text-[10px] text-violet-300/80 font-mono mt-0.5">Lv.{item.等级}</span>
                    {item.强化等级 > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 text-[8px] font-mono text-violet-400 bg-violet-950/50 px-1 rounded"
                      >
                        +{item.强化等级}
                      </motion.span>
                    )}
                    {item.品质 === 'legendary' && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
                    )}
                    {item.品质 === 'mythic' && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-transparent animate-pulse pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 uppercase font-mono">{getSlotLabel(slot)}</span>
                )}
              </motion.div>
              {item && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onUnequip(slot)} 
                    className="p-2 bg-violet-600/80 rounded-lg hover:bg-violet-500 transition-colors"
                  >
                    <ArrowUpCircle size={16} />
                  </motion.button>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
