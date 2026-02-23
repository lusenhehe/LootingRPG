import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {getNodeAttempts,isNodeCleared,isNodeUnlocked} from '../../../logic/mapProgress';
import { Lock, Sparkles, Star, Zap, Skull, Crown, Trophy, Swords, Ghost } from 'lucide-react';
import { chapterThemeStyles, encounterBadge, getNodeState, stateOverlayStyles, getZigzagNodePosition } from './mapConfig';
import { UI_DIMENSIONS, UI_STYLES } from '../../../constants/settings';
import type { MapProgressState } from '../../../types/game';
import type { MapNodeDef, MapChapterDef, MapEncounterType } from '../../../config/mapChapters';

interface MapNodeProps {
  node: MapNodeDef;
  nodeIndex: number;
  selectedChapter: MapChapterDef;
  normalizedProgress: MapProgressState;
  playerLevel: number;
  loading: boolean;
  onEnterNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const encounterStyles: Record<MapEncounterType, { 
  shape: string;  size: string;  iconColor: string; 
  ringColor: string;  glowColor: string;  particleColor: string;
}> = {
  normal: { shape: 'rounded-full', size: 'w-14 h-14', iconColor: 'text-slate-200', 
    ringColor: 'ring-slate-400/30', glowColor: 'rgba(148, 163, 184, 0.3)', particleColor: 'bg-slate-300',
  },
  elite: {
    shape: 'rounded-lg rotate-45', size: 'w-14 h-14', iconColor: 'text-amber-300',
    ringColor: 'ring-amber-400/50', glowColor: 'rgba(251, 191, 36, 0.4)', particleColor: 'bg-amber-400',
  },
  boss: {
    shape: 'rounded-xl', size: 'w-18 h-18', iconColor: 'text-rose-300',
    ringColor: 'ring-rose-500/60', glowColor: 'rgba(244, 63, 94, 0.5)', particleColor: 'bg-rose-400',
  },
  wave: {
    shape: 'rounded-2xl', size: 'w-16 h-14', iconColor: 'text-emerald-300',
    ringColor: 'ring-emerald-400/50', glowColor: 'rgba(16, 185, 129, 0.4)', particleColor: 'bg-emerald-400',
  },
};

const EncounterIcon = ({ type, size = 22 }: { type: MapEncounterType; size?: number }) => {
  const style = encounterStyles[type];
  switch (type) {
    case 'boss':  return  <Crown size={size} className={style.iconColor} />;
    case 'elite': return  <Trophy size={size} className={style.iconColor} />;
    case 'wave':  return  <Swords size={size} className={style.iconColor} />;
    default:      return  <Ghost size={size} className={style.iconColor} />;
  }
};

export default function MapNode({
  node, nodeIndex, selectedChapter,
  normalizedProgress, playerLevel, loading,
  onEnterNode, onHoverStart, onHoverEnd,
}: MapNodeProps) {
  const { t } = useTranslation();
  const unlocked = isNodeUnlocked(normalizedProgress, node.id);
  const cleared = isNodeCleared(normalizedProgress, node.id);
  const attempts = getNodeAttempts(normalizedProgress, node.id);
  const waves =
    node.waves && node.waves.length > 0
      ? node.waves
      : node.waveSize
      ? Array.from({ length: node.waveSize }).map((_,i)=>({ id: `${node.id}-auto-${i}`, monsters: [] }))
      : [];
  const waveCount = waves.length;
  const state = getNodeState(unlocked, cleared, playerLevel, node.recommendedLevel);
  const disabled = loading || state === 'locked';
  const themeStyle = chapterThemeStyles[selectedChapter.theme as any];
  const overlayStyle = stateOverlayStyles[state];
  const floatDelay = nodeIndex * 0.3;
  const encounterStyle = encounterStyles[node.encounterType];
  const starCount = node.encounterType === 'boss' ? 3 : node.encounterType === 'elite' ? 2 : node.encounterType === 'wave' ? 2 : 1;
  const nodePosition = getZigzagNodePosition(nodeIndex);
  const isBoss = node.encounterType === 'boss';

  return (
    <div
      key={node.id} className="absolute"
      style={{ left: `${nodePosition.x}%`, top: `${nodePosition.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.button
        data-map-node="1"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: nodeIndex * 0.08, duration: 0.35, type: 'spring', stiffness: 280 }}
        whileHover={disabled ? {} : { y: -8, scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onHoverStart={() => onHoverStart?.()}
        onHoverEnd={() => onHoverEnd?.()}
        onClick={() => !disabled && onEnterNode(node, selectedChapter)}
        className={`relative cursor-pointer ${overlayStyle.overlay}`}
        style={{ filter: overlayStyle.glowFilter }}
      >
        <motion.div
          className="relative"
          animate={disabled ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 2.5 + floatDelay, repeat: Infinity, ease: 'easeInOut', delay: floatDelay}}
        >
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full h-4">
            <motion.div
              className="absolute inset-0 rounded-[50%] blur-lg"
              style={{ backgroundColor: themeStyle.shadowColor }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: floatDelay }}
            />
          </div>

          <div className="relative flex flex-col items-center">
            {waveCount > 1 && (
              <div className={UI_STYLES.nodeWaveLabel}>
                {waveCount} 波
              </div>)}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
              {Array.from({ length: starCount }).map((_, i) => (
                <motion.div
                  key={i} animate={disabled ? {} : { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  <Star size={10} className="text-yellow-400" fill="currentColor" strokeWidth={1.5} />
                </motion.div>
              ))}
            </div>

            {isBoss && !disabled && !cleared && (
              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{ background: `radial-gradient(circle, ${encounterStyle.glowColor} 0%, transparent 70%)` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <motion.div
              className={`
                relative ${encounterStyle.size} ${encounterStyle.shape}
                bg-gradient-to-br ${themeStyle.terrainTop}
                ring-2 ${encounterStyle.ringColor}
                shadow-lg
                flex items-center justify-center
                overflow-hidden
              `}
              animate={isBoss && !disabled ? { boxShadow: ['0 0 20px rgba(244,63,94,0.3)', '0 0 35px rgba(244,63,94,0.6)', '0 0 20px rgba(244,63,94,0.3)'] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }}
              />

              {node.encounterType === 'elite' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent" />
                </div>
              )}

              {node.encounterType === 'wave' && !disabled && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              )}

              <div className={`relative z-10 ${node.encounterType === 'elite' ? '-rotate-45' : ''}`}>
                <EncounterIcon type={node.encounterType} size={isBoss ? 26 : 22} />
              </div>

              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${encounterStyle.particleColor} w-1 h-1 rounded-full`}
                  style={{
                    left: `${15 + i * 22}%`,
                    top: `${15 + (i % 3) * 25}%`,
                  }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>

            <motion.div
              className={`
                mt-2 px-2 py-0.5 rounded 
                ${isBoss ? 'bg-rose-950/80 border-rose-500/30' : 'bg-black/75 border-white/10'} 
                backdrop-blur-sm border
              `}
              animate={disabled ? {} : { y: [0, -1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: floatDelay }}
            >
              <span className={`text-[9px] font-semibold ${isBoss ? 'text-rose-200' : 'text-white/90'} whitespace-nowrap`}>
                {node.name}
              </span>
            </motion.div>

            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[7px] px-1.5 py-0.5 rounded border ${encounterBadge[node.encounterType]}`}>
                {t(`map.encounter.${node.encounterType}`)}
              </span>
              <span className="text-[7px] text-gray-400 font-mono">{t('map.level', { level: node.recommendedLevel })}</span>
            </div>

            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[7px] text-amber-400/80 flex items-center gap-0.5">
                <span className="text-amber-500">+</span>
                {node.firstClearRewardGold}G
              </span>
              {state === 'cleared' && (
                <span className="text-[7px] text-cyan-400 flex items-center gap-0.5">
                  <Star size={8} fill="currentColor" />
                  {t('map.state.cleared')}
                </span>
              )}
              {state === 'warning' && (
                <span className="text-[7px] text-amber-400 flex items-center gap-0.5">
                  <Zap size={8} />
                  {t('map.state.warning')}
                </span>
              )}
              {state === 'ready' && (
                <span className="text-[7px] text-emerald-400 flex items-center gap-0.5">
                  <Sparkles size={8} />
                  {t('map.state.ready')}
                </span>
              )}
              {state === 'locked' && (
                <span className="text-[7px] text-slate-500 flex items-center gap-0.5">
                  <Lock size={8} />
                  {t('map.state.locked')}
                </span>
              )}
            </div>

            {attempts > 0 && (
              <div className="text-[6px] text-rose-400/70 flex items-center gap-0.5 mt-0.5">
                <Skull size={7} />
                {t('map.failures', { count: attempts })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
}
