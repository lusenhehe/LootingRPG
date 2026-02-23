import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Crown, Skull, Heart, Swords, Shield, Flame, Zap, Info } from 'lucide-react';
import { BOSS_MONSTERS, NORMAL_MONSTERS } from '../../../constants/game';
import type { Monster, MonsterTrait, ThreatType } from '../../../types/game';

const traitLabelMap: Record<MonsterTrait, string> = {
  thorns: '反伤',
  lifesteal: '吸血',
  double_attack: '二连击',
  shield_on_start: '开场护盾',
  rage_on_low_hp: '残血狂怒',
};

const traitColorMap: Record<MonsterTrait, string> = {
  thorns: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  lifesteal: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  double_attack: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
  shield_on_start: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  rage_on_low_hp: 'border-red-400/30 bg-red-500/10 text-red-200',
};

const traitHintMap: Record<MonsterTrait, string[]> = {
  thorns: ['此敌人对爆发输出有反制能力，节奏过快容易被反噬。', '更稳妥的做法是提高生存与续航，拉长有效作战时间。'],
  lifesteal: ['此敌人擅长在缠斗中回稳，久拖会放大其优势。', '建议准备持续压制手段，减少其恢复窗口。'],
  double_attack: ['此敌人有连续打击倾向，容易形成瞬时压力。', '建议优先强化容错与减伤，避免被连段带走。'],
  shield_on_start: ['此敌人开局防线稳固，前段硬冲收益较低。', '先建立稳定节奏，再寻找破口更容易滚起优势。'],
  rage_on_low_hp: ['此敌人在残局阶段威胁更高，收尾处理很关键。', '建议保留后段资源，避免在终局被反推。'],
};

type StrategyTag = '偏进攻' | '偏防守' | '偏续航';

const strategyTagStyleMap: Record<StrategyTag, string> = {
  偏进攻: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  偏防守: 'border-blue-400/35 bg-blue-500/10 text-blue-200',
  偏续航: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
};

const threatLabelMap: Record<ThreatType, string> = {
  burst_punish: '爆发反制型',
  sustain_pressure: '持续压制型',
  tank_breaker: '破防压坦型',
  attrition: '消耗蚕食型',
};

const threatStyleMap: Record<ThreatType, string> = {
  burst_punish: 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-200',
  sustain_pressure: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  tank_breaker: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  attrition: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200',
};

const inferThreatTypes = (monster: Monster): ThreatType[] => {
  if (monster.threatTypes?.length) return monster.threatTypes;

  const result: ThreatType[] = [];
  const traits = monster.traits ?? [];

  if (traits.includes('thorns') || traits.includes('shield_on_start')) {
    result.push('burst_punish');
  }
  if (traits.includes('double_attack') || traits.includes('rage_on_low_hp')) {
    result.push('sustain_pressure');
  }
  if (traits.includes('shield_on_start') || monster.counterGoal?.stat === '攻击力') {
    result.push('tank_breaker');
  }
  if (traits.includes('lifesteal') || monster.counterGoal?.stat === '生命值' || monster.counterGoal?.stat === '吸血') {
    result.push('attrition');
  }

  if (monster.tier === 'boss' && result.length === 0) {
    result.push('sustain_pressure');
  }

  if (result.length === 0) {
    result.push('tank_breaker');
  }

  return result.slice(0, 2);
};

const getStrategyTags = (monster: Monster): StrategyTag[] => {
  const score: Record<StrategyTag, number> = {
    偏进攻: 0,
    偏防守: 0,
    偏续航: 0,
  };

  if (monster.tier === 'boss') {
    score.偏防守 += 1;
    score.偏续航 += 1;
  }

  (monster.traits ?? []).forEach((trait) => {
    if (trait === 'thorns') {
      score.偏防守 += 2;
      score.偏续航 += 1;
    }
    if (trait === 'lifesteal') {
      score.偏进攻 += 1;
      score.偏续航 += 2;
    }
    if (trait === 'double_attack') {
      score.偏防守 += 1;
      score.偏进攻 += 2;
    }
    if (trait === 'shield_on_start') {
      score.偏进攻 += 2;
      score.偏防守 += 1;
    }
    if (trait === 'rage_on_low_hp') {
      score.偏防守 += 2;
      score.偏续航 += 1;
    }
  });

  if (monster.counterGoal?.stat === '攻击力' || monster.counterGoal?.stat === '元素伤害' || monster.counterGoal?.stat === '攻击速度') {
    score.偏进攻 += 2;
  }
  if (monster.counterGoal?.stat === '防御力' || monster.counterGoal?.stat === '生命值') {
    score.偏防守 += 2;
  }
  if (monster.counterGoal?.stat === '吸血' || monster.counterGoal?.stat === '反伤') {
    score.偏续航 += 2;
  }

  return (Object.entries(score) as [StrategyTag, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, value], index) => value > 0 || index === 0)
    .slice(0, 2)
    .map(([tag]) => tag);
};

const getStrategyHints = (monster: Monster): string[] => {
  const hints: string[] = [];

  if (monster.tier === 'boss') {
    hints.push('这是首领战，建议围绕单一战术核心构筑，不要平均分配资源。');
  } else {
    hints.push('这是常规遭遇战，建议用稳定泛用构筑保持连续推进。');
  }

  (monster.traits ?? []).forEach((trait) => {
    const traitHints = traitHintMap[trait] ?? [];
    traitHints.forEach((text) => {
      if (!hints.includes(text)) hints.push(text);
    });
  });

  if (monster.counterGoal) {
    hints.push('该敌人存在明确对抗方向，建议围绕一种优势维度集中强化。');
  }

  if (!monster.traits?.length && !monster.counterGoal) {
    hints.push('该敌人机制简单，保持攻防平衡通常就能稳定处理。');
  }

  return hints.slice(0, 4);
};

function TraitTags({ traits }: { traits?: MonsterTrait[] }) {
  if (!traits?.length) {
    return <span className="text-[10px] text-gray-500">无特殊词条</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {traits.map((trait) => (
        <span
          key={trait}
          className={`text-[10px] px-2 py-0.5 rounded border ${traitColorMap[trait] || 'border-violet-400/30 bg-violet-500/10 text-violet-200'}`}
        >
          {traitLabelMap[trait]}
        </span>
      ))}
    </div>
  );
}

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
      className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 text-left ${
        isSelected
          ? isBoss
            ? 'border-rose-500/60 bg-rose-500/20'
            : 'border-violet-500/60 bg-violet-500/20'
          : isBoss
            ? 'border-rose-500/20 bg-rose-950/15 hover:border-rose-500/40 hover:bg-rose-500/10'
            : 'border-game-border/40 bg-game-bg/40 hover:border-violet-500/40 hover:bg-violet-500/10'
      }`}
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-lg flex-shrink-0 ${isBoss ? 'bg-rose-500/20' : 'bg-game-card/40'}`}>
        {monster.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-medium truncate ${isBoss ? 'text-rose-200' : 'text-gray-200'}`}>
          {monster.name}
        </div>
        <div className="text-[9px] text-gray-500 flex items-center gap-1.5">
          <span className="text-red-400/70">{monster.maxHp}</span>
          <span className="text-orange-400/70">{monster.attack}</span>
          <span className="text-blue-400/70">{monster.defense}</span>
        </div>
      </div>
      {isBoss && <Crown size={11} className="text-yellow-400/60 flex-shrink-0" />}
    </motion.button>
  );
}

function MonsterDetailPanel({ monster }: { monster: Monster }) {
  const isBoss = monster.tier === 'boss';
  const strategyHints = getStrategyHints(monster);
  const strategyTags = getStrategyTags(monster);
  const threatTypes = inferThreatTypes(monster);

  return (
    <motion.div
      key={monster.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      <div className={`relative rounded-xl border p-3 flex-1 ${isBoss ? 'border-rose-500/30 bg-gradient-to-br from-rose-950/25 to-rose-900/10' : 'border-game-border/60 bg-game-bg/50'}`}>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/8 rounded-full blur-2xl" />
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl ${isBoss ? 'bg-gradient-to-br from-rose-600/30 to-red-600/20 shadow-lg shadow-rose-500/15' : 'bg-game-card/60 shadow'}`}
            >
              {monster.icon}
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-display font-bold truncate ${isBoss ? 'text-rose-200 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'text-gray-100'}`}>
                {monster.name}
              </h3>
              {isBoss && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Crown size={10} className="text-yellow-400" />
                  <span className="text-[9px] text-yellow-400/70">首领级敌人</span>
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
                <span className="text-[8px] text-gray-400 uppercase">生命</span>
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
                <span className="text-[8px] text-gray-400 uppercase">攻击</span>
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
                <span className="text-[8px] text-gray-400 uppercase">防御</span>
              </div>
              <div className="text-lg font-bold text-blue-300">{monster.defense}</div>
                <div className="w-full h-1 bg-blue-500/20 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${Math.min(100, (monster.defense / 30) * 100)}%` }} />
              </div>
            </motion.div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Zap size={10} className="text-violet-400" />
              <span className="text-[9px] text-gray-400 uppercase">词条</span>
            </div>
            <TraitTags traits={monster.traits} />
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Info size={10} className="text-fuchsia-300" />
              <span className="text-[9px] text-gray-400 uppercase">威胁类型</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {threatTypes.map((threat) => (
                <span
                  key={threat}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${threatStyleMap[threat]}`}
                >
                  {threatLabelMap[threat]}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-2 rounded-lg border border-indigo-400/20 bg-indigo-500/5 p-2">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen size={10} className="text-indigo-300" />
              <span className="text-[9px] text-indigo-200 uppercase">背景传记</span>
            </div>
            <p className="text-[9px] text-indigo-100/80 leading-relaxed">
              {monster.background ?? '这名敌人的旧史已在风中残缺。'}
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
                <span className="text-[10px] font-medium text-amber-200">对抗目标</span>
              </div>
              <div className="text-[9px] text-amber-100/70">
                {monster.counterGoal.title}
              </div>
              <div className="text-[8px] text-amber-400/50 mt-0.5">
                {monster.counterGoal.stat} ≥ {monster.counterGoal.threshold}
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
              <span className="text-[10px] font-medium text-cyan-200">对策提示</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {strategyTags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${strategyTagStyleMap[tag]}`}
                >
                  {tag}
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

export function MonsterCodexTab() {
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
      className="h-[560px] flex flex-col gap-3 overflow-hidden"
    >
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="border border-game-border/50 rounded-xl bg-gradient-to-br from-game-card/80 to-game-card/40 p-3 relative overflow-hidden flex-shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
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
              <span className="font-display text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">怪物图鉴</span>
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
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'normal' ? 'bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Skull size={10} className="inline mr-1" />
                普通 ({NORMAL_MONSTERS.length})
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
                BOSS ({BOSS_MONSTERS.length})
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0 overflow-hidden items-stretch">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-game-border/50 rounded-xl bg-game-bg/40 p-2 overflow-hidden flex flex-col h-full min-h-0"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
            <Info size={12} />
            <span>怪物列表</span>
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
          className="border border-game-border/50 rounded-xl bg-game-bg/30 p-2 overflow-hidden flex flex-col h-full min-h-0"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider flex-shrink-0">
            <Heart size={12} className="text-red-400" />
            <span>详细信息</span>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            <AnimatePresence mode="wait">
              {selectedMonster ? (
                <MonsterDetailPanel monster={selectedMonster} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Info size={24} className="mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">选择怪物查看详情</p>
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
