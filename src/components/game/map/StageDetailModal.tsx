import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Coins, Skull, Sparkles, Star, Swords, Zap } from 'lucide-react';
import battleUiJson from '@data/config/game/battleUi.json';
import type { MapChapterDef, MapNodeDef } from '../../../config/map/ChapterData';
import type { PlayerStats } from '../../../shared/types/game';
import { getMonsterById } from '../../../domains/monster/config';
import { getEquipmentTemplates } from '../../../config/game/equipment';
import { getDropTier, getPlayerPower, getPowerState, getRecommendedPower, getThreatStars, type DropTier, type PowerState} from '../../../domains/map/services/stageDetail';

const UI_CFG = battleUiJson as unknown as {
  mapNodeDetail?: {
    enterButton?: string;
    closeButton?: string;
    labels?: { waves?: string; monsters?: string; firstReward?: string };
  };
};

const ENCOUNTER_LABEL_MAP: Record<string, string> = {
  normal: '普通',
  elite: '精英',
  boss: '首领',
};

const THREAT_LABEL_MAP: Record<string, string> = {
  burst_punish: '爆发惩罚',
  sustain_pressure: '持续压制',
  tank_breaker: '破甲压制',
  attrition: '消耗战',
};

const ENCOUNTER_FLAVOR_TEXT_MAP: Record<string, string> = {
  normal: '被黑暗侵蚀的前线据点，低阶怪物正在聚集。',
  elite: '危险气息正在升温，精英单位已开始巡猎。',
  boss: '领主级威胁正在逼近，稍有不慎将全线崩溃。',
};

const POWER_STATE_META: Record<PowerState, { label: string; color: string }> = {
  advantage: { label: '战力评估：优势', color: '#86EFAC' },
  matched: { label: '战力评估：匹配', color: '#E7E5E4' },
  danger: { label: '战力评估：危险', color: '#FCA5A5' },
};

const DROP_TIER_META: Record<DropTier, { label: string; textColor: string; bgColor: string }> = {
  common: { label: '普通掉落', textColor: '#86EFAC', bgColor: 'rgba(34,197,94,0.14)' },
  rare: { label: '稀有掉落', textColor: '#C4B5FD', bgColor: 'rgba(139,92,246,0.14)' },
  low: { label: '低概率掉落', textColor: '#FCD34D', bgColor: 'rgba(245,158,11,0.16)' },
  unknown: { label: '未知掉落', textColor: '#A8A29E', bgColor: 'rgba(120,113,108,0.14)' },
};

const getMonsterRarityMeta = (monsterType?: string): { label: string; borderColor: string; tagColor: string } => {
  if (monsterType === 'boss') return { label: '首领', borderColor: '#B91C1C', tagColor: '#FECACA' };
  if (monsterType === 'elite') return { label: '精英', borderColor: '#B45309', tagColor: '#FDE68A' };
  return { label: '普通', borderColor: '#4B5563', tagColor: '#D1D5DB' };
};

const getEncounterPalette = (encounterType: MapNodeDef['encounterType']) => {
  if (encounterType === 'boss') {
    return {
      border: '#991B1B',
      glow: 'rgba(153,27,27,0.3)',
      accentText: '#FECACA',
      accentBar: 'linear-gradient(180deg, #EF4444, #991B1B)',
      accentButton: 'linear-gradient(180deg, #991B1B 0%, #7F1D1D 100%)',
      accentButtonBorder: '#B91C1C',
      accentButtonText: '#FECACA',
    };
  }
  if (encounterType === 'elite') {
    return {
      border: '#92400E',
      glow: 'rgba(146,64,14,0.25)',
      accentText: '#FDE68A',
      accentBar: 'linear-gradient(180deg, #F59E0B, #92400E)',
      accentButton: 'linear-gradient(180deg, #B45309 0%, #92400E 100%)',
      accentButtonBorder: '#D97706',
      accentButtonText: '#FEF3C7',
    };
  }
  return {
    border: '#374151',
    glow: 'rgba(0,0,0,0.5)',
    accentText: '#E5E7EB',
    accentBar: 'linear-gradient(180deg, #3B82F6, #1E40AF)',
    accentButton: 'linear-gradient(180deg, #1E3A5F 0%, #1E3A8A 100%)',
    accentButtonBorder: '#3B82F6',
    accentButtonText: '#DBEAFE',
  };
};

interface StageDetailModalProps {
  detailNode: MapNodeDef | null;
  selectedChapter: MapChapterDef;
  playerStats: PlayerStats;
  onClose: () => void;
  onEnter: (node: MapNodeDef, chapter: MapChapterDef) => void;
}

export default function StageDetailModal({
  detailNode,
  selectedChapter,
  playerStats,
  onClose,
  onEnter,
}: StageDetailModalProps) {
  const equipmentTemplateNameMap = useMemo(() => {
    const templates = getEquipmentTemplates();
    return new Map(templates.map((template) => [template.id, template.nameZh || template.nameEn || template.id]));
  }, []);
  const detailWaves = detailNode?.waves ?? [];
  const detailMonsters = detailWaves.flatMap((wave) => wave.monsters ?? []);

  const detailMonsterIntel = useMemo(() => {
    const grouped = new Map<string, { id: string; count: number; order: number }>();
    detailMonsters.forEach((monster, index) => {
      const cached = grouped.get(monster.monsterId);
      if (cached) {
        cached.count += 1;
        return;
      }
      grouped.set(monster.monsterId, {
        id: monster.monsterId,
        count: 1,
        order: index,
      });
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.order - b.order)
      .map((entry) => {
        const monster = getMonsterById(entry.id);
        const dropEntries = Object.entries(monster?.dropdict ?? {});
        const topDrop = dropEntries.sort((a, b) => b[1] - a[1])[0];
        const dropName = topDrop ? equipmentTemplateNameMap.get(topDrop[0]) ?? topDrop[0] : '未知掉落';
        const dropTier = getDropTier(topDrop?.[1]);
        const rarityMeta = getMonsterRarityMeta(monster?.monsterType);
        const threatTag = monster?.threatTypes?.[0]
          ? THREAT_LABEL_MAP[monster.threatTypes[0]] ?? monster.threatTypes[0]
          : monster?.monsterType === 'boss'
          ? '首领单位'
          : monster?.monsterType === 'elite'
          ? '精英单位'
          : '常规单位';

        return {
          id: entry.id,
          count: entry.count,
          icon: monster?.icons?.[0] ?? '👾',
          displayName: monster?.name ?? entry.id,
          monsterTypeLabel: rarityMeta.label,
          rarityBorderColor: rarityMeta.borderColor,
          rarityTagColor: rarityMeta.tagColor,
          threatTag,
          dropPreview: dropName,
          dropRate: topDrop ? Math.round(topDrop[1]) : null,
          dropTier,
        };
      });
  }, [detailMonsters, equipmentTemplateNameMap]);

  if (!detailNode) return null;

  const enemyLevelMin = detailNode.recommendedLevel;
  const enemyLevelMax = enemyLevelMin + (detailNode.encounterType === 'boss' ? 2 : 1);
  const recommendedPower = getRecommendedPower(detailNode, detailWaves.length, detailMonsters.length);
  const playerPower = getPlayerPower(playerStats);
  const powerState = getPowerState(playerPower, recommendedPower);
  const threatStars = getThreatStars(detailNode, detailWaves.length, detailMonsters.length);
  const estimatedDurationSeconds = Math.max(20, detailWaves.length * 12 + detailMonsters.length * 5);
  const detailStarCount = detailNode.encounterType === 'boss' ? 3 : detailNode.encounterType === 'elite' ? 2 : 1;
  const stageFlavorText = `${selectedChapter.name} · ${ENCOUNTER_FLAVOR_TEXT_MAP[detailNode.encounterType] ?? ENCOUNTER_FLAVOR_TEXT_MAP.normal}`;
  const palette = getEncounterPalette(detailNode.encounterType);

  return (
    <div data-map-ui="1" className="absolute inset-0 z-overlay flex items-center justify-center bg-black/78 backdrop-blur-[2px] pointer-events-auto map-stage-detail-overlay">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-[520px] max-w-[92vw] rounded-lg border bg-gradient-to-b from-stone-900 via-stone-950 to-black p-0 shadow-2xl map-stage-detail-panel"
        style={{
          borderColor: palette.border,
          boxShadow: `
            0 0 40px ${palette.glow}40,
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
        }}
      >
        <div className="relative">
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background:
                'linear-gradient(130deg, rgba(56,33,12,0.18) 0%, transparent 45%), radial-gradient(circle at 65% 20%, rgba(180,83,9,0.10), transparent 45%)',
              opacity: 0.75,
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full" style={{ background: palette.accentBar, boxShadow: `0 0 12px ${palette.glow}` }} />
                  <h2
                    className="text-xl font-semibold tracking-wide"
                    style={{
                      fontFamily: '"Cinzel", serif',
                      color: palette.accentText,
                      textShadow: `0 0 20px ${palette.glow}`,
                    }}
                  >
                    {detailNode.name}
                  </h2>
                </div>

                <p className="mt-2 text-[11px] text-amber-100/75 leading-relaxed">{stageFlavorText}</p>

                <div className="mt-3 text-[12px] space-y-1.5">
                  <div className="flex items-center gap-2 text-stone-300">
                    <span>{selectedChapter.name}</span>
                    <span className="text-stone-500">·</span>
                    <span className="font-medium" style={{ color: palette.accentText }}>
                      {ENCOUNTER_LABEL_MAP[detailNode.encounterType] ?? detailNode.encounterType}难度
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-[11px]">
                    <span className="text-amber-500 font-mono" style={{ textShadow: '0 0 8px rgba(245,158,11,0.3)' }}>
                      敌人等级 {enemyLevelMin}-{enemyLevelMax}
                    </span>
                    <span className="text-stone-300 font-mono">推荐战力 {recommendedPower}</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] font-medium" style={{ color: POWER_STATE_META[powerState].color }}>
                  {POWER_STATE_META[powerState].label}
                </div>

                <div className="mt-1 text-[11px] text-stone-300">
                  ⚔ 威胁等级：{'★'.repeat(threatStars)}{'☆'.repeat(Math.max(0, 3 - threatStars))}
                </div>

                <div
                  className="mt-4 rounded border px-3 py-3 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(245,158,11,0.30) 0%, rgba(180,83,9,0.18) 40%, rgba(20,10,0,0.62) 100%)',
                    borderColor: '#D97706',
                    boxShadow: 'inset 0 0 22px rgba(245,158,11,0.24), 0 0 26px rgba(245,158,11,0.20)',
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <span className="map-reward-spark" style={{ left: '12%', top: '28%', animationDelay: '0s' }} />
                    <span className="map-reward-spark" style={{ left: '36%', top: '62%', animationDelay: '0.9s' }} />
                    <span className="map-reward-spark" style={{ left: '74%', top: '34%', animationDelay: '1.6s' }} />
                    <span className="map-reward-spark" style={{ left: '88%', top: '68%', animationDelay: '2.2s' }} />
                  </div>
                  <div className="flex items-center justify-between relative z-[1]">
                    <div className="text-[10px] text-amber-100 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Star size={11} className="text-yellow-300" />
                      首次通关
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-200/30 bg-amber-100/10 text-amber-100/85">
                      奖励加成
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-amber-100/70 uppercase tracking-[0.14em]">{UI_CFG.mapNodeDetail?.labels?.firstReward ?? '首通奖励'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Coins size={18} className="text-yellow-300 map-reward-coin" />
                    <span className="text-[30px] leading-none font-mono font-bold text-yellow-300" style={{ textShadow: '0 0 16px rgba(251,191,36,0.65)' }}>
                      {detailNode.firstClearRewardGold}G
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-100/70 mt-1">首通仅一次，失败不扣除奖励资格</div>
                </div>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: detailStarCount }).map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    className={detailNode.encounterType === 'boss' ? 'text-yellow-500' : 'text-amber-400'}
                    fill="currentColor"
                    strokeWidth={2}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div
                className="rounded border p-3 text-center"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                  borderColor: '#374151',
                }}
              >
                <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                  <Zap size={10} className="inline mr-1 text-amber-500" />
                  {UI_CFG.mapNodeDetail?.labels?.waves ?? '波次'}
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: '#E5E7EB', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                  {detailWaves.length}
                </div>
              </div>
              <div
                className="rounded border p-3 text-center"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                  borderColor: '#374151',
                }}
              >
                <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                  <Skull size={10} className="inline mr-1 text-red-400" />
                  {UI_CFG.mapNodeDetail?.labels?.monsters ?? '怪物'}
                </div>
                <div className="text-lg font-mono font-semibold" style={{ color: '#E5E7EB', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                  {detailMonsters.length}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] text-stone-500 uppercase tracking-wider mb-2 px-1">敌人情报</div>
              <div className="max-h-40 overflow-auto space-y-1.5">
                {detailMonsterIntel.length > 0 ? (
                  detailMonsterIntel.map((monster) => (
                    <div
                      key={monster.id}
                      className="px-2.5 py-2 text-[11px] rounded border"
                      style={{
                        background: 'rgba(0,0,0,0.26)',
                        borderColor: monster.rarityBorderColor,
                        borderLeft: `2px solid ${monster.rarityBorderColor}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm leading-none">{monster.icon}</span>
                          <span className="text-stone-200 font-medium truncate">{monster.displayName}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full border"
                            style={{
                              color: monster.rarityTagColor,
                              borderColor: `${monster.rarityBorderColor}88`,
                              background: `${monster.rarityBorderColor}22`,
                            }}
                          >
                            {monster.monsterTypeLabel}
                          </span>
                        </div>
                        <span className="text-stone-500 font-mono">×{monster.count}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-fuchsia-300/80 px-1.5 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-400/30">{monster.threatTag}</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.5 rounded border"
                            style={{
                              color: DROP_TIER_META[monster.dropTier].textColor,
                              borderColor: `${DROP_TIER_META[monster.dropTier].textColor}66`,
                              background: DROP_TIER_META[monster.dropTier].bgColor,
                            }}
                          >
                            {DROP_TIER_META[monster.dropTier].label}
                          </span>
                          <span className="text-amber-200/80 truncate">
                            {monster.dropPreview}
                            {monster.dropRate !== null ? ` (${monster.dropRate}%)` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-stone-600 text-center py-4 text-[11px]">暂无情报</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-1 pt-4 border-t mt-4" style={{ borderColor: '#292524' }}>
              <div className="text-[10px] text-stone-500 leading-relaxed">预计耗时 {estimatedDurationSeconds} 秒 · 消耗体力 5</div>
              <button
                className="px-4 py-2 rounded text-[12px] font-medium transition-all duration-200 border cursor-pointer hover:scale-105"
                style={{
                  background: 'linear-gradient(180deg, rgba(28,25,23,0.9) 0%, rgba(10,9,8,0.9) 100%)',
                  borderColor: '#44403C',
                  color: '#A8A29E',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
                onClick={onClose}
              >
                {UI_CFG.mapNodeDetail?.closeButton ?? '取消'}
              </button>
              <button
                className="px-7 py-2.5 rounded text-[12px] font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.03] min-w-[208px] map-challenge-cta"
                style={{
                  background: palette.accentButton,
                  borderColor: palette.accentButtonBorder,
                  color: palette.accentButtonText,
                  boxShadow: `
                    0 0 20px ${palette.glow},
                    inset 0 1px 0 rgba(255,255,255,0.1)
                  `,
                }}
                onClick={() => onEnter(detailNode, selectedChapter)}
              >
                <div className="flex items-center justify-center gap-1.5 text-[13px] tracking-[0.08em]">
                  <Swords size={15} />
                  <span>{UI_CFG.mapNodeDetail?.enterButton ?? '进入挑战'}</span>
                </div>
                <div className="text-[9px] opacity-80 mt-0.5 flex items-center justify-center gap-1">
                  <Sparkles size={10} />
                  挑战 {detailWaves.length} 波敌人
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
