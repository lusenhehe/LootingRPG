import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { BattlePhase, BossTheme, Monster } from '../../types/game';

interface MonsterCardProps {
  monster: Monster;
  phase: BattlePhase;
  hpPercent: number;
}

const bossThemeCardStyles: Record<BossTheme, {
  card: string;
  glow: string;
  name: string;
  hpBar: string;
}> = {
  abyss: {
    card: 'border-violet-500/60 bg-violet-950/30',
    glow: 'from-violet-600/25 to-fuchsia-500/20',
    name: 'text-violet-200',
    hpBar: 'from-violet-600 to-fuchsia-400',
  },
  dragonfire: {
    card: 'border-orange-500/60 bg-orange-950/30',
    glow: 'from-orange-600/30 to-red-500/25',
    name: 'text-orange-200',
    hpBar: 'from-orange-600 to-red-400',
  },
  iron: {
    card: 'border-slate-400/60 bg-slate-900/35',
    glow: 'from-slate-400/25 to-zinc-500/20',
    name: 'text-slate-200',
    hpBar: 'from-slate-500 to-zinc-300',
  },
  necro: {
    card: 'border-emerald-500/60 bg-emerald-950/30',
    glow: 'from-emerald-600/25 to-lime-500/20',
    name: 'text-emerald-200',
    hpBar: 'from-emerald-600 to-lime-400',
  },
  storm: {
    card: 'border-sky-500/60 bg-sky-950/30',
    glow: 'from-sky-600/25 to-cyan-500/20',
    name: 'text-sky-200',
    hpBar: 'from-sky-600 to-cyan-400',
  },
  blood: {
    card: 'border-rose-500/60 bg-rose-950/30',
    glow: 'from-rose-600/25 to-red-500/20',
    name: 'text-rose-200',
    hpBar: 'from-rose-600 to-red-400',
  },
  void: {
    card: 'border-indigo-500/60 bg-indigo-950/30',
    glow: 'from-indigo-600/25 to-purple-500/20',
    name: 'text-indigo-200',
    hpBar: 'from-indigo-600 to-purple-400',
  },
  clockwork: {
    card: 'border-amber-500/60 bg-amber-950/30',
    glow: 'from-amber-600/25 to-yellow-500/20',
    name: 'text-amber-200',
    hpBar: 'from-amber-600 to-yellow-400',
  },
};

export function MonsterCard({ monster, phase, hpPercent }: MonsterCardProps) {
  const { t } = useTranslation();
  const isBoss = monster.tier === 'boss';
  const bossThemeStyle = isBoss && monster.bossIdentity ? bossThemeCardStyles[monster.bossIdentity.theme] : null;
  const traitTags: string[] = (monster.traits ?? []).map((trait) => t(`trait.${trait}`));
  const x = phase === 'entering' ? 18 : 0;
  const scale = phase === 'dying' ? 0.75 : isBoss ? 1.02 : 1;
  const opacity = phase === 'dying' ? 0 : 1;
  return (
    <motion.div
      className={`relative rounded-2xl border ${isBoss ? (bossThemeStyle?.card ?? 'border-red-500/60 bg-red-950/30') : 'border-gray-600/60 bg-black/30'} p-4 backdrop-blur-sm min-w-[140px]`}
      initial={{ x: 80, opacity: 0 }}
      animate={{
        x,
        opacity,
        scale,
      }}
      transition={{ duration: phase === 'entering' ? 0.5 : 0.35, ease: 'easeOut' }}
    >
      {isBoss && <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${bossThemeStyle?.glow ?? 'from-red-600/20 to-orange-500/20'} blur opacity-50`} />}
      <div className="absolute top-1 right-1 text-[9px] px-2 py-0.5 rounded-full bg-black/70 border border-white/20 uppercase tracking-widest">
        {isBoss ? t('label.boss') : t('label.monster')}
      </div>
      <div className="text-center space-y-2 relative">
        <motion.div
          className={`leading-none tracking-tight ${isBoss ? 'text-6xl' : 'text-5xl'}`}
          animate={phase === 'fighting' ? { y: [0, -4, 0, -2, 0] } : { y: 0 }}
          transition={{ duration: 0.8, repeat: phase === 'fighting' ? Infinity : 0 }}
          style={isBoss ? { filter: 'drop-shadow(0_0_15px rgba(244,63,94,0.6))' } : {}}
        >
          {monster.icon}
        </motion.div>
        <div className={`font-display text-sm tracking-wide ${isBoss ? `${bossThemeStyle?.name ?? 'text-red-200'} drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]` : 'text-gray-200'}`}>{monster.name}</div>
        <div className="text-[10px] text-gray-300/80 font-mono">Lv.{monster.等级}</div>

        {isBoss && monster.counterGoalLabel && (
          <div
            className={`text-[9px] px-2 py-1 rounded border ${monster.counterGoalPassed ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/40 bg-amber-500/10 text-amber-200'}`}
          >
            {monster.counterGoalLabel}
          </div>
        )}

        {traitTags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {traitTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`text-[9px] px-1.5 py-0.5 rounded border ${isBoss ? 'border-red-400/35 bg-red-500/10 text-red-200' : 'border-violet-400/30 bg-violet-500/10 text-violet-200'}`}
              >
                {tag}
              </span>
            ))}
            {traitTags.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/20 bg-white/5 text-gray-300">
                +{traitTags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="w-full h-2 rounded-full overflow-hidden bg-white/10 border border-white/10">
          <motion.div
            className={`h-full ${isBoss ? `bg-gradient-to-r ${bossThemeStyle?.hpBar ?? 'from-red-600 to-orange-400'}` : 'bg-gradient-to-r from-emerald-500 to-lime-400'} relative`}
            animate={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </motion.div>
        </div>
      </div>

      {phase === 'dying' && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gray-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.35 }}
        />
      )}
    </motion.div>
  );
}
