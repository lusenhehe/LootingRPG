import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Crown, Skull, Heart, Swords, Shield, Flame, Info, Package, Sword, Gem, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { BOSS_MONSTERS, NORMAL_MONSTERS } from '../../../domains/monster/services/monsterCatalog';
import { UI_DIMENSIONS } from '../../../config/ui/tokens';
import type { Monster } from '../../../shared/types/game';
import { getEquipmentTemplates, QUALITIES, SLOTS} from '../../../config/game/equipment';
import type { EquipmentTemplate } from '../../../config/game/equipment';
import { getQualityLabel, getSlotLabel, getStatLabel } from '../../../infra/i18n/labels';
import { SLOT_EMOJI_MAP, QUALITY_STYLE_MAP_BASE, THREAT_STYLE_MAP } from '../../../config/ui/icons';

// ─── 共享样式 ────────────────────────────────────────────────────────────────
const slotIconMap: Record<string, React.ReactNode> = {
  weapon:   <Sword  size={12} className="text-amber-400" />,
  helmet:   <Crown  size={12} className="text-gray-300"  />,
  armor:    <Shield size={12} className="text-gray-400"  />,
  ring:     <Star   size={12} className="text-red-400"   />,
  necklace: <Gem    size={12} className="text-blue-400"  />,
  boots:    <Package size={12} className="text-gray-300" />,
};

const slotEmojiMap = SLOT_EMOJI_MAP;
// ─── 装备模板详情（图鉴/掉落共用） ────────────────────────────────────────────
function EquipmentTemplateDetail({ tpl, lang, t, onClose }: {
  tpl: EquipmentTemplate;
  lang: 'zh' | 'en';
  t: TFunction;
  onClose?: () => void;
}) {
  const qs = QUALITY_STYLE_MAP_BASE[tpl.quality] ?? QUALITY_STYLE_MAP_BASE.common;
  const displayName = lang === 'zh' ? tpl.nameZh : tpl.nameEn;
  const description = lang === 'zh' ? tpl.descriptionZh : tpl.descriptionEn;

  return (
    <motion.div
      key={tpl.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className={`h-full flex flex-col rounded-lg border-2 ${qs.border} bg-stone-950 shadow-xl overflow-hidden`}
    >
      {/* 头部 */}
      <div className="px-3 pt-3 pb-2 flex items-start gap-2 shrink-0"
        style={{ background: `linear-gradient(135deg, ${qs.hex}22 0%, transparent 70%)` }}>
        <span className="text-3xl leading-none">
          {slotEmojiMap[tpl.slot] || '🧰'}-{tpl.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white truncate leading-tight">{displayName}</div>
          <div className="text-[10px] text-stone-400 flex flex-wrap items-center gap-1 mt-0.5">
            <span style={{ color: qs.hex }}>◆</span>
            <span>{getQualityLabel(tpl.quality)}</span>
            <span className="text-stone-600">•</span>
            <span>{getSlotLabel(tpl.slot)}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 text-xs shrink-0">✕</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
        {/* 基础属性 */}
        {Object.keys(tpl.attributes).length > 0 && (
          <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
            <div className="text-[9px] text-stone-500 uppercase mb-1.5">{t('codex.equip.description')}</div>
            <div className="space-y-1">
              {Object.entries(tpl.attributes).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 uppercase">{getStatLabel(key)}</span>
                  <span className={`font-mono text-xs font-bold ${qs.text}`}>+{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 词缀 */}
        {tpl.affixes.length > 0 && (
          <div className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5">
            <div className="text-[9px] text-cyan-400 uppercase mb-1">{t('tooltip.affixes')}</div>
            <div className="flex flex-col gap-0.5">
              {tpl.affixes.map((affix, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan-300">
                    {t(`stat.${affix.type}`, affix.type)}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-200">+{affix.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 描述文本 */}
        {description && (
          <div className="rounded border border-indigo-500/20 bg-indigo-500/5 px-2 py-1.5">
            <div className="text-[9px] text-indigo-400 uppercase mb-1">{t('codex.background')}</div>
            <p className="text-[10px] text-indigo-100/80 leading-relaxed italic">{description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
// ─── 怪物列表项 ──────────────────────────────────────────────────────────────
function MonsterListItem({
  monster, isSelected, isBoss, onClick,
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
          ? isBoss ? 'border-rose-500/60 bg-rose-500/20' : 'border-red-700/60 bg-red-900/20'
          : isBoss ? 'border-rose-500/20 bg-rose-950/15 hover:border-rose-500/40 hover:bg-rose-500/10'
                   : 'border-game-border/40 bg-game-bg/40 hover:border-red-800/40 hover:bg-red-900/10'
      }`}
    >
      <div
        style={{ width: `${UI_DIMENSIONS.codexIconSize}px`, height: `${UI_DIMENSIONS.codexIconSize}px` }}
        className={`rounded-md flex items-center justify-center text-lg flex-shrink-0 ${isBoss ? 'bg-rose-500/20' : 'bg-game-card/40'}`}
      >
        {monster.icons.map((ic: string, i: number) => <span key={i}>{ic}</span>)}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-medium truncate ${isBoss ? 'text-rose-200' : 'text-gray-200'}`}>{monster.name}</div>
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

// ─── 怪物详情面板（含掉落） ───────────────────────────────────────────────────
function MonsterDetailPanel({ monster, t, lang, templates, onSelectTemplate }: {
  monster: Monster;
  t: TFunction;
  lang: 'zh' | 'en';
  templates: EquipmentTemplate[];
  onSelectTemplate: (tpl: EquipmentTemplate) => void;
}) {
  const isBoss = monster.monsterType === 'boss';
  const threatTypes = monster.threatTypes ?? [];
  const templateMap = useMemo(() => {
    const map: Record<string, EquipmentTemplate> = {};
    for (const tpl of templates) map[tpl.id] = tpl;
    return map;
  }, [templates]);

  const dropEntries = Object.entries(monster.dropdict ?? {});
  const totalWeight = dropEntries.reduce((s, [, w]) => s + w, 0);

  return (
    <motion.div
      key={monster.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col gap-2 overflow-y-auto pr-0.5"
    >
      {/* 基础信息 */}
      <div className={`relative rounded-xl border p-3 shrink-0 ${isBoss ? 'border-rose-500/30 bg-gradient-to-br from-rose-950/25 to-rose-900/10' : 'border-game-border/60 bg-game-bg/50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <motion.div whileHover={{ scale: 1.05 }}
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl ${isBoss ? 'bg-gradient-to-br from-rose-600/30 to-red-600/20 shadow-lg shadow-rose-500/15' : 'bg-game-card/60 shadow'}`}
          >
            {monster.icons.map((ic: string, i: number) => <span key={i}>{ic}</span>)}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-display font-bold truncate ${isBoss ? 'text-rose-200 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'text-gray-100'}`}>{monster.name}</h3>
            <div className="text-[10px] text-red-400/80 font-mono mt-0.5">Lv.{monster.level}</div>
            {isBoss && (
              <div className="flex items-center gap-1 mt-0.5">
                <Crown size={10} className="text-yellow-400" />
                <span className="text-[9px] text-yellow-400/70">{t('codex.bossLevelLabel')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 属性三栏 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: <Heart size={10} className="text-red-400" />, label: t('codex.stat.hp'), value: monster.maxHp, bar: monster.maxHp / 500, color: 'from-red-500 to-red-400', bg: 'bg-red-500/20', text: 'text-red-300' },
            { icon: <Swords size={10} className="text-orange-400" />, label: t('codex.stat.attack'), value: monster.attack, bar: monster.attack / 50, color: 'from-orange-500 to-orange-400', bg: 'bg-orange-500/20', text: 'text-orange-300' },
            { icon: <Shield size={10} className="text-blue-400" />, label: t('codex.stat.defense'), value: monster.defense, bar: monster.defense / 30, color: 'from-blue-500 to-blue-400', bg: 'bg-blue-500/20', text: 'text-blue-300' },
          ].map(({ icon, label, value, bar, color, bg, text }) => (
            <div key={label} className="bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="flex items-center gap-1 mb-1">{icon}<span className="text-[8px] text-gray-400 uppercase">{label}</span></div>
              <div className={`text-lg font-bold ${text}`}>{value}</div>
              <div className={`w-full h-1 ${bg} rounded-full mt-1 overflow-hidden`}>
                <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${Math.min(100, bar * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* 威胁类型 */}
        {threatTypes.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Info size={10} className="text-fuchsia-300" />
              <span className="text-[9px] text-gray-400 uppercase">{t('codex.threatTypes')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {threatTypes.map((threat) => (
                <span key={threat} className={`text-[9px] px-1.5 py-0.5 rounded border ${THREAT_STYLE_MAP[threat]}`}>
                  {t(`codex.threat.${threat}`)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 背景 */}
        <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/5 p-2">
          <div className="flex items-center gap-1 mb-1">
            <BookOpen size={10} className="text-indigo-300" />
            <span className="text-[9px] text-indigo-200 uppercase">{t('codex.background')}</span>
          </div>
          <p className="text-[9px] text-indigo-100/80 leading-relaxed">
            {monster.background ?? t('codex.backgroundFallback')}
          </p>
        </div>

        {/* Boss 特供 */}
        {isBoss && monster.counterGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/8 p-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={11} className="text-amber-400" />
              <span className="text-[10px] font-medium text-amber-200">{t('codex.counterGoal')}</span>
            </div>
            <div className="text-[9px] text-amber-100/70">{monster.counterGoal.title}</div>
            <div className="text-[8px] text-amber-400/50 mt-0.5">
              {t(`stat.${monster.counterGoal.stat}`, { defaultValue: monster.counterGoal.stat })} ≥ {monster.counterGoal.threshold}
            </div>
          </motion.div>
        )}
      </div>

      {/* 掉落物品 */}
      <div className="rounded-xl border border-game-border/40 bg-game-bg/40 p-2 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Package size={10} className="text-amber-400" />
          <span className="text-[9px] text-gray-400 uppercase">{t('codex.drops')}</span>
        </div>
        {dropEntries.length === 0 ? (
          <p className="text-[9px] text-stone-600">{t('codex.noDrops')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {dropEntries.map(([id, weight]) => {
              const tpl = templateMap[id];
              if (!tpl) return null;
              const qs = QUALITY_STYLE_MAP_BASE[tpl.quality] ?? QUALITY_STYLE_MAP_BASE.common;
              const pct = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
              return (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onSelectTemplate(tpl)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border ${qs.border} ${qs.bg} cursor-pointer w-full text-left transition-all`}
                >
                  <span className="text-base leading-none shrink-0">
                    {slotEmojiMap[tpl.slot] || '🧰'}-{tpl.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-medium truncate ${qs.text}`}>
                      {lang === 'zh' ? tpl.nameZh : tpl.nameEn}
                    </div>
                    <div className="text-[9px] text-stone-500">{getSlotLabel(tpl.slot)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-12 h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: qs.hex }} />
                    </div>
                    <span className="text-[9px] text-stone-500 font-mono">{pct}%</span>
                    <ChevronRight size={9} className="text-stone-600" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 装备图鉴网格格子 ─────────────────────────────────────────────────────────
function EquipCellButton({ tpl, isSelected, lang, onClick }: {
  tpl: EquipmentTemplate;
  isSelected: boolean;
  lang: 'zh' | 'en';
  onClick: () => void;
}) {
  const qs = QUALITY_STYLE_MAP_BASE[tpl.quality] ?? QUALITY_STYLE_MAP_BASE.common;
  const displayName = lang === 'zh' ? tpl.nameZh : tpl.nameEn;
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={displayName}
      className={`relative aspect-square rounded border-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${qs.bg} ${qs.border}
        ${isSelected ? `ring-2 ring-offset-1 ring-offset-stone-950 ring-white/50 shadow-lg` : 'hover:ring-1 hover:ring-white/20'}`}
    >
      <span className="text-xl leading-none">
        {slotEmojiMap[tpl.slot] || '🧰'}-{tpl.icon}
      </span>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b opacity-80" style={{ backgroundColor: qs.hex }} />
    </motion.button>
  );
}

// ─── 装备图鉴子页 ─────────────────────────────────────────────────────────────
function EquipmentCodexSection({ t, lang }: { t: TFunction; lang: 'zh' | 'en' }) {
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTemplates = useMemo(() => getEquipmentTemplates(), []);

  const filtered = useMemo(() => {
    return allTemplates.filter(tpl => {
      if (slotFilter !== 'all' && tpl.slot !== slotFilter) return false;
      if (qualityFilter !== 'all' && tpl.quality !== qualityFilter) return false;
      return true;
    });
  }, [allTemplates, slotFilter, qualityFilter]);

  const selectedTpl = useMemo(() => filtered.find(t => t.id === selectedId) ?? null, [filtered, selectedId]);

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 过滤栏 */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {/* 槽位过滤 */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSlotFilter('all')}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${slotFilter === 'all' ? 'border-amber-500/60 bg-amber-500/20 text-amber-200' : 'border-stone-700/50 bg-stone-900/40 text-stone-400 hover:border-stone-600'}`}
          >
            {t('codex.equip.filterAll')}
          </button>
          {SLOTS.map(slot => (
            <button
              key={slot}
              onClick={() => setSlotFilter(slot)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 ${slotFilter === slot ? 'border-amber-500/60 bg-amber-500/20 text-amber-200' : 'border-stone-700/50 bg-stone-900/40 text-stone-400 hover:border-stone-600'}`}
            >
              {slotIconMap[slot]}
              {getSlotLabel(slot)}
            </button>
          ))}
        </div>
        {/* 品质过滤 */}
        <div className="flex gap-0.5 flex-wrap">
          <button
            onClick={() => setQualityFilter('all')}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${qualityFilter === 'all' ? 'border-stone-400/60 bg-stone-700/40 text-stone-200' : 'border-stone-700/50 bg-stone-900/40 text-stone-500 hover:border-stone-600'}`}
          >
            {t('codex.equip.filterAll')}
          </button>
          {QUALITIES.map(q => {
            const qs = QUALITY_STYLE_MAP_BASE[q];
            return (
              <button
                key={q}
                onClick={() => setQualityFilter(q)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${qualityFilter === q ? `${qs.border} ${qs.bg} ${qs.text}` : 'border-stone-700/50 bg-stone-900/40 text-stone-500 hover:border-stone-600'}`}
              >
                {getQualityLabel(q)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 min-h-0 flex gap-2">
        {/* 左侧装备网格 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-600">
              <Package size={32} className="mb-2 opacity-20" />
              <p className="text-xs">{t('codex.equip.selectItem')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
              {filtered.map(tpl => (
                <EquipCellButton
                  key={tpl.id}
                  tpl={tpl}
                  isSelected={selectedId === tpl.id}
                  lang={lang}
                  onClick={() => setSelectedId(selectedId === tpl.id ? null : tpl.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧详情 */}
        <AnimatePresence mode="wait">
          {selectedTpl && (
            <div key={selectedTpl.id} className="w-52 shrink-0 min-h-0">
              <EquipmentTemplateDetail
                tpl={selectedTpl}
                lang={lang}
                t={t}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── 怪物图鉴子页 ─────────────────────────────────────────────────────────────
function MonsterCodexSection({ t, lang, templates }: { t: TFunction; lang: 'zh' | 'en'; templates: EquipmentTemplate[] }) {
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(NORMAL_MONSTERS[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<'normal' | 'boss'>('normal');
  const [dropSelectedTpl, setDropSelectedTpl] = useState<EquipmentTemplate | null>(null);

  const allMonsters = useMemo(() => [...NORMAL_MONSTERS, ...BOSS_MONSTERS], []);
  const selectedMonster = allMonsters.find(m => m.id === selectedMonsterId) ?? null;
  const currentList = activeTab === 'normal' ? NORMAL_MONSTERS : BOSS_MONSTERS;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 普通/BOSS tab */}
      <div className="flex gap-1 bg-game-bg/50 p-0.5 rounded-lg border border-game-border/30 shrink-0 w-fit">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setActiveTab('normal'); const first = NORMAL_MONSTERS[0]; if (first) setSelectedMonsterId(first.id); }}
          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'normal' ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Skull size={10} className="inline mr-1" />{t('codex.tab.normal')} ({NORMAL_MONSTERS.length})
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setActiveTab('boss'); const first = BOSS_MONSTERS[0]; if (first) setSelectedMonsterId(first.id); }}
          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'boss' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/30' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Crown size={10} className="inline mr-1" />{t('codex.tab.boss')} ({BOSS_MONSTERS.length})
        </motion.button>
      </div>

      {/* 主内容 */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-10 gap-2 overflow-hidden">
        {/* 怪物列表 */}
        <div className="border border-game-border/50 rounded-xl bg-game-bg/40 p-2 flex flex-col h-full min-h-0 lg:col-span-3">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider shrink-0">
            <Info size={12} />
            <span>{t('codex.listTitle')}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-0">
            {currentList.map((monster, index) => (
              <motion.div key={monster.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
                <MonsterListItem
                  monster={monster}
                  isSelected={selectedMonsterId === monster.id}
                  isBoss={activeTab === 'boss'}
                  onClick={() => { setSelectedMonsterId(monster.id); setDropSelectedTpl(null); }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 怪物详情 */}
        <div className="border border-game-border/50 rounded-xl bg-game-bg/30 p-2 flex flex-col h-full min-h-0 lg:col-span-7 overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 uppercase tracking-wider shrink-0">
            <Heart size={12} className="text-red-400" />
            <span>{t('codex.detailTitle')}</span>
          </div>
          <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
              <AnimatePresence mode="wait">
                {selectedMonster ? (
                  <MonsterDetailPanel
                    key={selectedMonster.id}
                    monster={selectedMonster}
                    t={t}
                    lang={lang}
                    templates={templates}
                    onSelectTemplate={setDropSelectedTpl}
                  />
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
            {/* 掉落装备详情（点击掉落物品后弹出） */}
            <AnimatePresence mode="wait">
              {dropSelectedTpl && (
                <div key={dropSelectedTpl.id} className="w-44 shrink-0 min-h-0">
                  <EquipmentTemplateDetail
                    tpl={dropSelectedTpl}
                    lang={lang}
                    t={t}
                    onClose={() => setDropSelectedTpl(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 顶层 CodexTab ────────────────────────────────────────────────────────────
type MainTab = 'monster' | 'equipment';
function CodexTabInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const [mainTab, setMainTab] = useState<MainTab>('monster');
  const templates = useMemo(() => getEquipmentTemplates(), []);

  return (
    <motion.div
      key="codex"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-full max-h-full flex flex-col gap-2 overflow-hidden"
    >
      {/* 顶部banner + 主tab */}
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="border border-game-border/50 rounded-xl bg-gradient-to-br from-game-card/80 to-game-card/40 p-3 relative overflow-hidden shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-red-900/10" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="p-1.5 rounded-lg bg-cyan-500/20">
              <BookOpen size={14} className="text-cyan-300" />
            </motion.div>
            <span className="font-display text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-red-500">{t('codex.title')}</span>
          </div>
          <div className="flex gap-1 bg-game-bg/50 p-0.5 rounded-lg border border-game-border/30">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setMainTab('monster')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${mainTab === 'monster' ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Skull size={10} />{t('codex.mainTab.monster')}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setMainTab('equipment')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${mainTab === 'equipment' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Sword size={10} />{t('codex.mainTab.equipment')}
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* 子内容区 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {mainTab === 'monster' && (
            <motion.div
              key="monster"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MonsterCodexSection t={t} lang={lang as 'zh' | 'en'} templates={templates} />
            </motion.div>
          )}
          {mainTab === 'equipment' && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <EquipmentCodexSection t={t} lang={lang as 'zh' | 'en'} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export const MonsterCodexTab = memo(CodexTabInner);