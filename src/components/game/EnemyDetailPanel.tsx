import { memo } from 'react';
import { motion } from 'motion/react';
import { Sword, Shield, Heart, Zap, Activity, Circle, Sparkles, Skull } from 'lucide-react';
import type { BattleUnitInstance } from '../../types/battle/BattleUnit';

interface EnemyDetailPanelProps {
  enemy: BattleUnitInstance;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  dot:    <Circle size={10} className="text-red-400" />,
  hot:    <Heart size={10} className="text-green-400" />,
  buff:   <Sparkles size={10} className="text-yellow-300" />,
  debuff: <Skull size={10} className="text-gray-400" />,
  shield: <Shield size={10} className="text-blue-400" />,
};

const hpPercent = (v: number, max: number) =>
  max <= 0 ? 0 : Math.max(0, Math.min(100, (v / max) * 100));

function EnemyDetailPanelInner({ enemy }: EnemyDetailPanelProps) {
  const hp = Math.max(0, Math.round(enemy.currentHp));
  const maxHp = Math.max(1, Math.round(enemy.baseStats.hp));
  const pct = hpPercent(hp, maxHp);
  const hpColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const element = enemy.elements?.[0];
  const statuses = enemy.statuses ?? [];
  const icon = typeof enemy.meta?.icon === 'string' ? enemy.meta.icon : '👾';
  const isAlive = enemy.currentHp > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="w-52 rounded-sm border border-stone-700/60 bg-stone-950/95 shadow-2xl p-3 flex flex-col gap-2 pointer-events-none"
    >
      {/* 头部：图标 + 名字 */}
      <div className="flex items-center gap-2">
        <div className={`text-2xl leading-none ${isAlive ? '' : 'opacity-40 grayscale'}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-display font-bold text-stone-100 truncate">
            {enemy.name}
          </div>
          <div className="text-[9px] font-mono text-stone-500 flex gap-2">
            <span>Lv.{enemy.level}</span>
            {element && <span className="text-indigo-400">{element}</span>}
            {!isAlive && <span className="text-red-500">已死亡</span>}
          </div>
        </div>
      </div>

      {/* HP 条 */}
      <div>
        <div className="flex justify-between text-[9px] text-stone-500 mb-0.5">
          <span className="flex items-center gap-0.5"><Heart size={8} className="text-red-400" /> HP</span>
          <span className="font-mono text-stone-300">{hp}/{maxHp}</span>
        </div>
        <div className="h-1.5 rounded-sm bg-stone-900 border border-stone-800/60 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${hpColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 基础属性 */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-900/60 border border-stone-800/40">
          <Sword size={10} className="text-red-400 shrink-0" />
          <span className="text-stone-300 font-mono">{enemy.baseStats.attack}</span>
          <span className="text-stone-600 text-[8px]">攻击</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-900/60 border border-stone-800/40">
          <Shield size={10} className="text-blue-400 shrink-0" />
          <span className="text-stone-300 font-mono">{enemy.baseStats.defense}</span>
          <span className="text-stone-600 text-[8px]">防御</span>
        </div>
        {(enemy.derivedStats?.damageReduction ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-900/60 border border-stone-800/40 col-span-2">
            <Activity size={10} className="text-emerald-400 shrink-0" />
            <span className="text-stone-300 font-mono">
              {Math.round((enemy.derivedStats?.damageReduction ?? 0) * 100)}%
            </span>
            <span className="text-stone-600 text-[8px]">减伤</span>
          </div>
        )}
      </div>

      {/* 意图 */}
      {enemy.nextIntent && isAlive && (
        <div
          className={`px-2 py-1 rounded text-[9px] font-mono ${
            enemy.nextIntent.type === 'heavy_attack'
              ? 'bg-red-900/40 text-red-300 border border-red-700/30'
              : enemy.nextIntent.type === 'defend'
              ? 'bg-blue-900/30 text-blue-300 border border-blue-700/20'
              : 'bg-stone-900/40 text-stone-400 border border-stone-700/30'
          }`}
        >
          <span className="flex items-center gap-1">
            <Zap size={8} /> 下一行动：{enemy.nextIntent.label}
            {enemy.nextIntent.estimatedDamage != null && (
              <span className="text-red-400 ml-1">≈{enemy.nextIntent.estimatedDamage}</span>
            )}
          </span>
        </div>
      )}

      {/* 状态效果 */}
      {statuses.length > 0 && (
        <div>
          <div className="text-[8px] text-stone-600 uppercase tracking-wider mb-1">状态效果</div>
          <div className="flex flex-wrap gap-1">
            {statuses.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-stone-900/60 border border-stone-800/40 text-[9px] text-stone-300"
              >
                {STATUS_ICONS[s.kind] ?? '❓'}
                <span className="ml-0.5">{s.id}</span>
                {s.stacks > 1 && <span className="text-stone-500">×{s.stacks}</span>}
                <span className="text-stone-600 ml-0.5">{s.remainingTurns}t</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 技能列表 */}
      {enemy.skills && enemy.skills.length > 0 && (
        <div>
          <div className="text-[8px] text-stone-600 uppercase tracking-wider mb-1">技能</div>
          <div className="flex flex-wrap gap-0.5">
            {enemy.skills.map((s) => (
              <span
                key={s}
                className="px-1 py-0.5 rounded bg-indigo-900/20 border border-indigo-800/30 text-[8px] text-indigo-400"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export const EnemyDetailPanel = memo(EnemyDetailPanelInner);
export default EnemyDetailPanel;
