import { Swords, Zap, GripHorizontal, Sword } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { BattleSession } from '../../../shared/types/game';
import type { DragState } from './hooks/useBattleDrag';
import skillsJson from '@data/config/game/skills.json';

type SkillMeta = {
  energyCost?: number;
  cooldown?: number;
  displayName?: string;
  description?: string;
  icon?: string;
  targetScope?: string;
};
const SKILLS_META: Record<string, SkillMeta> = skillsJson as unknown as Record<string, SkillMeta>;

interface BattleActionPanelProps {
  session: BattleSession;
  dragState: DragState | null;
  actionEnabled: boolean;
  isWaveTransitioning: boolean;
  displayWaveIndex: number;
  waveOrderLength: number;
  onRetreat: () => void;
  onPointerDownAttack: (e: React.PointerEvent) => void;
  onPointerDownSkill: (skillId: string, e: React.PointerEvent) => void;
  onFireToast: () => void;
}

export function BattleActionPanel({
  session,
  dragState,
  actionEnabled,
  isWaveTransitioning,
  displayWaveIndex,
  waveOrderLength,
  onRetreat,
  onPointerDownAttack,
  onPointerDownSkill,
  onFireToast,
}: BattleActionPanelProps) {
  const { t } = useTranslation();
  const isFighting = session.status === 'fighting';

  return (
    <div className="w-56 rounded-sm border border-stone-800/50 bg-stone-900/30 p-3 flex flex-col gap-2">
      <div className="text-[10px] font-display uppercase text-stone-500 tracking-[0.3em] flex items-center gap-1.5">
        <Swords size={12} /> Actions
      </div>

      {/* 能量条 */}
      {isFighting && (
        <div className="mt-0.5">
          <div className="flex items-center justify-between text-[9px] text-stone-500 mb-0.5">
            <span className="flex items-center gap-1">
              <Zap size={8} className="text-indigo-400" />能量
            </span>
            <span className="font-mono text-indigo-300">
              {session.player.currentEnergy}/{session.player.maxEnergy}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-stone-900 border border-stone-800/60 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
              animate={{
                width: `${(session.player.currentEnergy / Math.max(1, session.player.maxEnergy)) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* 换阵提示 */}
      {isWaveTransitioning && (
        <div className="text-[10px] px-2 py-1 rounded-sm border border-amber-700/40 bg-amber-900/20 text-amber-300">
          敌军换阵中...
        </div>
      )}

      {/* 攻击按钮（拖拽式） */}
      {isFighting && (
        <motion.div
          className={`w-full px-3 py-2.5 rounded-sm font-display text-sm font-semibold border relative overflow-hidden select-none cursor-grab active:cursor-grabbing transition-all duration-200 ${
            dragState?.type === 'attack'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400/60 text-amber-50 shadow-lg shadow-amber-900/30'
              : 'bg-gradient-to-r from-red-800 to-red-700 border-red-600/50 text-red-100 hover:from-red-700 hover:to-red-600'
          }`}
          whileHover={actionEnabled ? { scale: 1.02 } : {}}
          onPointerDown={(e) => {
            if (!actionEnabled) return;
            e.currentTarget.releasePointerCapture(e.pointerId);
            onPointerDownAttack(e);
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
            <GripHorizontal size={12} className="opacity-60" />
            <Sword size={14} strokeWidth={2} />
            {t('battle.attack')}
          </span>
        </motion.div>
      )}

      {/* 撤退按钮 */}
      <motion.button
        type="button"
        onClick={onRetreat}
        disabled={!actionEnabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-3 py-2 rounded-sm bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-400 hover:text-stone-300 text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        ↩ Retreat
      </motion.button>

      {/* 技能栏 */}
      {isFighting && session.player.skills.length > 0 && (
        <div className="mt-1 pt-2 border-t border-stone-800/50">
          <div className="text-[9px] text-stone-600 uppercase tracking-wider mb-1.5">Skills</div>
          <div className="flex flex-col gap-1.5">
            {session.player.skills.map((skillId) => {
              const meta = SKILLS_META[skillId] ?? {};
              const cost = meta.energyCost ?? 0;
              const cd = session.player.skillCooldowns[skillId] ?? 0;
              const noEnergy = session.player.currentEnergy < cost;
              const disabled = cd > 0 || noEnergy;
              const skillIcon = meta.icon ?? '✨';
              const name = meta.displayName ?? skillId;

              return (
                <motion.div
                  key={skillId}
                  onPointerDown={(e) => {
                    if (!actionEnabled) return;
                    if (disabled) { onFireToast(); return; }
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    onPointerDownSkill(skillId, e);
                  }}
                  onClick={() => { if (!disabled) onFireToast(); }}
                  whileHover={disabled ? {} : { scale: 1.02 }}
                  whileTap={disabled ? {} : { scale: 0.97 }}
                  title={meta.description ?? name}
                  className={`w-full px-2 py-1.5 rounded-sm border text-xs transition-all flex items-start gap-1.5 text-left cursor-grab active:cursor-grabbing select-none ${
                    disabled
                      ? 'bg-stone-900/40 border-stone-800/30 text-stone-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-900/30 to-violet-900/20 border-indigo-700/30 text-indigo-200 hover:border-indigo-500/50'
                  }`}
                >
                  <span className="mt-px shrink-0">{skillIcon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium leading-tight truncate">{name}</span>
                    <span
                      className={`flex items-center gap-1.5 text-[9px] mt-0.5 ${
                        disabled ? 'text-stone-700' : 'text-indigo-400/70'
                      }`}
                    >
                      <Zap size={8} />
                      <span className={noEnergy && cd === 0 ? 'text-red-400' : ''}>{cost}</span>
                      {cd > 0 && <span className="ml-auto text-amber-500/80">CD {cd}</span>}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-stone-800/30">
        <div className="text-[9px] text-stone-600 font-mono">
          Wave {Math.min(displayWaveIndex + 1, waveOrderLength)}/{waveOrderLength} • Turn {session.turn}
        </div>
      </div>
    </div>
  );
}
