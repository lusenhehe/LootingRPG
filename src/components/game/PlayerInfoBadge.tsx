import { Heart, Shield, Sword, Zap, User } from 'lucide-react';
import { motion } from 'motion/react';
import type { PlayerStats } from '../../types/game';
import { useTranslation } from 'react-i18next';

interface PlayerInfoBadgeProps {
  playerName: string;
  stats: PlayerStats;
}

export function PlayerInfoBadge({ playerName, stats }: PlayerInfoBadgeProps) {
  const { t } = useTranslation();
  const expNeeded = stats.level * 100;
  const expPercent = Math.min(100, (stats.xp / expNeeded) * 100);

  const statItems = [
    { icon: Sword, value: stats.attack, color: 'text-rose-500', bg: 'bg-rose-950/40', border: 'border-rose-900/30', label: 'ATK' },
    { icon: Heart, value: stats.hp, color: 'text-emerald-600', bg: 'bg-emerald-950/40', border: 'border-emerald-900/30', label: 'HP' },
    { icon: Shield, value: stats.defense, color: 'text-sky-600', bg: 'bg-sky-950/40', border: 'border-sky-900/30', label: 'DEF' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-stone-900/80 to-stone-800/60 px-3 py-2 rounded-xl border border-stone-700/40 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center border border-stone-600/40 shadow-inner">
            <User className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-300 leading-tight">{playerName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-600">LV.{stats.level}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-stone-700/50" />

        <div className="flex flex-col gap-1 min-w-[100px]">
          <div className="flex items-center justify-between text-[9px] text-stone-500">
            <span>{t('label.experience')}</span>
            <span className="font-mono text-stone-400">{stats.xp}/{expNeeded}</span>
          </div>
          <div className="h-1 rounded-full bg-stone-800 border border-stone-700/50 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-800 to-amber-700 relative"
              initial={{ width: 0 }}
              animate={{ width: `${expPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-amber-500/20" />
            </motion.div>
          </div>
        </div>

        <div className="w-px h-8 bg-stone-700/50" />

        <div className="flex items-center gap-1.5">
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${stat.bg} border ${stat.border}`}
            >
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className={`text-[10px] font-mono font-semibold ${stat.color}`}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        <div className="w-px h-8 bg-stone-700/50" />

        <div className="flex items-center gap-1.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/40 border border-amber-900/30"
          >
            <Zap className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-mono font-semibold text-amber-600">{stats.critRate}</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
