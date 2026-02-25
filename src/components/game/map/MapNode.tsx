import {getNodeAttempts,isNodeCleared,isNodeUnlocked} from '../../../domains/map/services/progress';
import { Lock, Sparkles, Star, Zap, Skull, Crown, Trophy, Ghost } from 'lucide-react';
import { chapterThemeStyles, getNodeState, stateOverlayStyles, getZigzagNodePosition } from './mapConfig';
import type { MapNodeDef, MapChapterDef } from '../../../config/map/ChapterData';
import type { MapEncounterType } from '../../../config/map/mapNode';
import type { MapProgressState } from '../../../types/game';
import { UI_STYLES } from '../../../config/ui/tokens';
import { chapterNodeStyles, themeColors, defaultEncounterStyles } from '../../../config/map/mapNode';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

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

const EncounterIcon = ({ type, size = 22 }: { type: MapEncounterType; size?: number }) => {
  const style = defaultEncounterStyles[type];
  switch (type) {
    case 'boss':  return  <Crown size={size} className={style.iconColor} />;
    case 'elite': return  <Trophy size={size} className={style.iconColor} />;
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
  const waves = node.waves && node.waves.length > 0 ? node.waves : [];
  const waveCount = waves.length;
  const state = getNodeState(unlocked, cleared, playerLevel, node.recommendedLevel);
  const disabled     = loading || state === 'locked';
  const themeStyle   = chapterThemeStyles[selectedChapter.theme];
  const overlayStyle = stateOverlayStyles[state];
  const floatDelay   = nodeIndex * 0.3;
  const chapterEncounterStyles = chapterNodeStyles[selectedChapter.theme];
  const encounterStyle = chapterEncounterStyles[node.encounterType];
  const starCount = node.encounterType === 'boss' ? 3 : node.encounterType === 'elite' ? 2 : 1;
  const nodePosition = getZigzagNodePosition(nodeIndex);
  const isBoss = node.encounterType === 'boss';
  const themeColorConfig = themeColors[selectedChapter.theme];

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
                {waveCount} {t('map.encounter.wave')}
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
                bg-gradient-to-br ${encounterStyle.bgGradient}
                ring-2 ${encounterStyle.ringColor} shadow-lg flex items-center justify-center overflow-hidden
              `}
              animate={isBoss && !disabled ? { boxShadow: [`0 0 20px ${themeColorConfig.primary}80`, `0 0 40px ${themeColorConfig.primaryLight}aa`, `0 0 20px ${themeColorConfig.primary}80`] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${themeColorConfig.primaryLight}26 0%, transparent 40%, rgba(0,0,0,0.5) 100%)` }}
              />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 30%, ${themeColorConfig.primaryLight}1a, transparent 50%)` }} />

              {node.encounterType === 'elite' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-amber-600/15 to-transparent" />
                </div>
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
              className="mt-2"
              animate={disabled ? {} : { y: [0, -1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: floatDelay }}
            >
              <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: isBoss ? themeColorConfig.primaryLight : themeColorConfig.primary }}>
                {node.name}
              </span>
            </motion.div>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-medium opacity-70">{t(`map.encounter.${node.encounterType}`)}</span>
              <span className="text-[9px] font-mono" style={{ color: themeColorConfig.primaryLight }}>{t('map.level', { level: node.recommendedLevel })}</span>
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
