import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Crown, Skull, Heart, Swords, Shield, Flame, Zap, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { BOSS_MONSTERS, NORMAL_MONSTERS } from '../../../domains/monster/services/monsterCatalog';
import { UI_DIMENSIONS } from '../../../config/ui/tokens';
import { counterGoalScoreMap, StrategyTag } from '../../../config/game/monsterSchema';
import type {ThreatType } from '../../../shared/types/game';
import type { Monster } from '../../../shared/types/game';
const strategyTagStyleMap: Record<StrategyTag, string> = {
  offense: 'border-rose-400/35    bg-rose-500/10    text-rose-200',
  defense: 'border-blue-400/35    bg-blue-500/10    text-blue-200',
  sustain: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
};
const threatStyleMap: Record<ThreatType, string> = {
  burst_punish: 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-200',
  sustain_pressure: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  tank_breaker: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  attrition: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
};
const getStrategyTags = (monster: Monster): StrategyTag[] => {
  const score: Record<StrategyTag, number> = {
    offense: 0,
    defense: 0,
    sustain: 0,
  };
  if (monster.monsterType === 'boss') {
    score.defense += 1;
    score.sustain += 1;
  }
  if (monster.counterGoal?.stat) {
    const tag = counterGoalScoreMap[monster.counterGoal.stat];
    if (tag) {
      score[tag] += 2;
    }
  }

  return (Object.entries(score) as [StrategyTag, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, value], index) => value > 0 || index === 0)
    .slice(0, 2)
    .map(([tag]) => tag);
};

type CodexTranslator = TFunction;

const getStrategyHints = (monster: Monster, t: CodexTranslator): string[] => {
  const hints: string[] = [];

  if (monster.monsterType === 'boss') {
    hints.push(String(t('codex.hints.bossIntro')));
  } else {
    hints.push(String(t('codex.hints.normalIntro')));
  }

  if (monster.counterGoal) {
    hints.push(String(t('codex.hints.counterGoal')));
    if (monster.counterGoal.successText && !hints.includes(monster.counterGoal.successText)) {
      hints.push(monster.counterGoal.successText);
    }
    if (monster.counterGoal.failText && !hints.includes(monster.counterGoal.failText)) {
      hints.push(monster.counterGoal.failText);
    }
  }
  return hints.slice(0, 4);
};
function MonsterListItem({
  monster,
  isSelected,
  isBoss,
  onClick,
}: {
  monster: Monster;
  isSelected: boolean;
  isBoss: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 text-left ${
        isSelected
          ? isBoss
            ? 'border-rose-500/60 bg-rose-500/20'
            : 'border-red-700/60 bg-red-900/20'
          : isBoss
            ? 'border-rose-500/20 bg-rose-950/15 hover:border-rose-500/40 hover:bg-rose-500/10'
            : 'border-game-border/40 bg-game-bg/40 hover:border-red-800/40 hover:bg-red-900/10'
      }`}
    >
      <div
        style={{ width: `${UI_DIMENSIONS.codexIconSize}px`, height: `${UI_DIMENSIONS.codexIconSize}px` }}
        className={`rounded-md flex items-center justify-center text-lg flex-shrink-0 ${isBoss ? 'bg-rose-500/20' : 'bg-game-card/40'}`}
      >
        {monster.icons.map((ic: string, i: number) => (
          <span key={i}>{ic}</span>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-medium truncate ${isBoss ? 'text-rose-200' : 'text-gray-200'}`}>
          {monster.name}
        </div>
        <div className="text-[9px] text-gray-500 flex items-center gap-1.5">
          <span className="text-red-400/80">Lv.{monster.level}</span>
          <span className="text-red-400/70">{monster.maxHp}</span>
          <span className="text-orange-400/70">{monster.attack}</span>
          <span className="text-blue-400/70">{monster.defense}</span>
        </div>
      </div>
      {isBoss && <Crown size={11} className="text-yellow-400/60 flex-shrink-0" />}
    </motion.button>
  );
}

function MonsterDetailPanel({ monster, t }: { monster: Monster; t: CodexTranslator }) {
  const isBoss = monster.monsterType === 'boss';
  const strategyHints = getStrategyHints(monster, t);
  const strategyTags = getStrategyTags(monster);
  const threatTypes = monster.threatTypes ?? [];

  return (
    <motion.div
      key={monster.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      <div className={`relative rounded-xl border p-3 flex-1 ${isBoss ? 'border-rose-500/30 bg-gradient-to-br from-rose-950/25 to-rose-900/10' : 'border-game-border/60 bg-game-bg/50'}`}>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-900/20 rounded-full blur-2xl" />
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl ${isBoss ? 'bg-gradient-to-br from-rose-600/30 to-red-600/20 shadow-lg shadow-rose-500/15' : 'bg-game-card/60 shadow'}`}
            >
              {monster.icons.map((ic: string, i: number) => (<span key={i}>{ic}</span>))}
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-display font-bold truncate ${isBoss ? 'text-rose-200 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'text-gray-100'}`}>
                {monster.name}
              </h3>
              <div className="text-[10px] text-red-400/80 font-mono mt-0.5">Lv.{monster.level}</div>
              {isBoss && (
                <div className="flex items-center gap-1 mt-0.5">
                    <Crown size={10} className="text-yellow-400" />
                    <span className="text-[9px] text-yellow-400/70">{t('codex.bossLevelLabel')}</span>
                  </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-black/25 rounded-lg p-2 border border-white/5"
            >
              <div className="flex items-center gap-1 mb-1">
                <Heart size={10} className="text-red-400" />
                <span className="text-[8px] text-gray-400 uppercase">{t('codex.stat.hp')}</span>
              </div>
              <div className="text-lg font-bold text-red-300">{monster.maxHp}</div>
              <div className="w-full h-1 bg-red-500/20 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${Math.min(100, (monster.maxHp / 500) * 100)}%` }} />
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-black/25 rounded-lg p-2 border border-white/5"
            >
                <div className="flex items-center gap-1 mb-1">
                <Swords size={10} className="text-orange-400" />
                <span className="text-[8px] text-gray-400 uppercase">{t('codex.stat.attack')}</span>
              </div>
              <div className="text-lg font-bold text-orange-300">{monster.attack}</div>
              <div className="w-full h-1 bg-orange-500/20 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${Math.min(100, (monster.attack / 50) * 100)}%` }} />
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-black/25 rounded-lg p-2 border border-white/5"
            >
                <div className="flex items-center gap-1 mb-1">
                <Shield size={10} className="text-blue-400" />
                <span className="text-[8px] text-gray-400 uppercase">{t('codex.stat.defense')}</span>
              </div>
              <div className="text-lg font-bold text-blue-300">{monster.defense}</div>
                <div className="w-full h-1 bg-blue-500/20 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${Math.min(100, (monster.defense / 30) * 100)}%` }} />
              </div>
            </motion.div>
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Info size={10} className="text-fuchsia-300" />
              <span className="text-[9px] text-gray-400 uppercase">{t('codex.threatTypes')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {threatTypes.map((threat) => (
                <span
                  key={threat}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${threatStyleMap[threat]}`}
                >
                  {t(`codex.threat.${threat}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-2 rounded-lg border border-indigo-400/20 bg-indigo-500/5 p-2">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen size={10} className="text-indigo-300" />
              <span className="text-[9px] text-indigo-200 uppercase">{t('codex.background')}</span>
            </div>
            <p className="text-[9px] text-indigo-100/80 leading-relaxed">
              {monster.background ?? t('codex.backgroundFallback')}
            </p>
          </div>

          {isBoss && monster.counterGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-auto rounded-lg border border-amber-400/25 bg-amber-500/8 p-2"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={11} className="text-amber-400" />
                <span className="text-[10px] font-medium text-amber-200">{t('codex.counterGoal')}</span>
              </div>
              <div className="text-[9px] text-amber-100/70">
                {monster.counterGoal.title}
              </div>
              <div className="text-[8px] text-amber-400/50 mt-0.5">
                {t(`stat.${monster.counterGoal.stat}`, { defaultValue: monster.counterGoal.stat })} ≥ {monster.counterGoal.threshold}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Info size={11} className="text-cyan-300" />
              <span className="text-[10px] font-medium text-cyan-200">{t('codex.tacticsTitle')}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1.5">
                {strategyTags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${strategyTagStyleMap[tag]}`}
                >
                  {t(`codex.strategy.${tag}`, { defaultValue: tag })}
                </span>
              ))}
            </div>
            <ul className="space-y-1">
              {strategyHints.map((hint) => (
                <li key={hint} className="text-[9px] text-cyan-100/80 leading-relaxed">
                  · {hint}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function MonsterCodexTabInner() {
  const { t } = useTranslation();
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(NORMAL_MONSTERS[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'normal' | 'boss'>('normal');

  const allMonsters = [...NORMAL_MONSTERS, ...BOSS_MONSTERS];
  const selectedMonster = allMonsters.find(m => m.id === selectedMonsterId);

  const currentList = activeTab === 'normal' ? NORMAL_MONSTERS : BOSS_MONSTERS;

  return (
    <motion.div
      key="codex"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-full max-h-full flex flex-col gap-3 overflow-hidden"
    >
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="border border-game-border/50 rounded-xl bg-gradient-to-br from-game-card/80 to-game-card/40 p-3 relative overflow-hidden flex-shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-red-900/10" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-1.5 rounded-lg bg-cyan-500/20"
              >
                <BookOpen size={14} className="text-cyan-300" />
              </motion.div>
              <span className="font-display text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-red-500">{t('codex.title')}</span>
            </div>
            
            <div className="flex gap-1 bg-game-bg/50 p-0.5 rounded-lg border border-game-border/30">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab('normal');
                  const first = NORMAL_MONSTERS[0];
                  if (first) setSelectedMonsterId(first.id);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'normal' ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Skull size={10} className="inline mr-1" />
                {t('codex.tab.normal')} ({NORMAL_MONSTERS.length})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab('boss');
                  const first = BOSS_MONSTERS[0];
                  if (first) setSelectedMonsterId(first.id);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'boss' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/30' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Crown size={10} className="inline mr-1" />
                {t('codex.tab.boss')} ({BOSS_MONSTERS.length})
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-2 min-h-0 overflow-hidden items-stretch">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-game-border/50 rounded-xl bg-game-bg/40 p-2 overflow-hidden flex flex-col h-full min-h-0 lg:col-span-3"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
            <Info size={12} />
            <span>{t('codex.listTitle')}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin min-h-0">
            {currentList.map((monster, index) => (
              <motion.div
                key={monster.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <MonsterListItem
                  monster={monster}
                  isSelected={selectedMonsterId === monster.id}
                  isBoss={activeTab === 'boss'}
                  onClick={() => setSelectedMonsterId(monster.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="border border-game-border/50 rounded-xl bg-game-bg/30 p-2 overflow-hidden flex flex-col h-full min-h-0 lg:col-span-7"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
            <Heart size={12} className="text-red-400" />
            <span>{t('codex.detailTitle')}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin min-h-0">
            <AnimatePresence mode="wait">
              {selectedMonster ? (
                <MonsterDetailPanel monster={selectedMonster} t={t} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                      <Info size={24} className="mx-auto mb-1 opacity-30" />
                      <p className="text-[10px]">{t('codex.selectMonster')}</p>
                    </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

export const MonsterCodexTab = memo(MonsterCodexTabInner);
