import { Heart, Shield, Sword, Zap, TrendingUp, User } from 'lucide-react';
import { motion } from 'motion/react';
import type { PlayerStats } from '../../types/game';

interface PlayerInfoBadgeProps {
  playerName: string;
  stats: PlayerStats;
}

export function PlayerInfoBadge({ playerName, stats }: PlayerInfoBadgeProps) {
  const expNeeded = stats.等级 * 100;
  const expPercent = Math.min(100, (stats.经验 / expNeeded) * 100);
  const critLabel = String(stats.暴击率).replace('%', '');

  const statItems = [
    { icon: Sword, value: stats.攻击力, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'ATK' },
    { icon: Heart, value: stats.生命值, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'HP' },
    { icon: Shield, value: stats.防御力, color: 'text-sky-400', bg: 'bg-sky-500/20', label: 'DEF' },
    { icon: Zap, value: `${critLabel}%`, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'CRIT' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-violet-950/60 to-purple-900/40 px-4 py-2.5 rounded-2xl border border-violet-500/30 shadow-lg shadow-violet-500/10 backdrop-blur-sm">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/5 to-fuchsia-500/5 pointer-events-none" />
        
        <div className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-violet-200 leading-tight">{playerName}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-fuchsia-400">LV.{stats.等级}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-violet-500/30" />

        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>EXP</span>
            <span className="font-mono">{stats.经验}/{expNeeded}</span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-950/80 border border-violet-500/20 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 relative"
              initial={{ width: 0 }}
              animate={{ width: `${expPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </div>

        <div className="w-px h-8 bg-violet-500/30" />

        <div className="flex items-center gap-2">
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${stat.bg} border border-white/5`}
            >
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className={`text-xs font-mono font-semibold ${stat.color}`}>{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
