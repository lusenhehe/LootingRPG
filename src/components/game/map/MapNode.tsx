import {getNodeAttempts,isNodeCleared,isNodeUnlocked} from '../../../domains/map/services/progress';
import { Lock, Star, Skull, Crown, Ghost } from 'lucide-react';
import { getNodeState, stateOverlayStyles, getZigzagNodePosition } from './MapConfig';
import type { MapNodeDef, MapChapterDef } from '../../../config/map/ChapterData';
import type { MapEncounterType } from '../../../config/map/mapNode';
import type { MapProgressState } from '../../../types/game';
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

const EncounterIcon = ({ type, size = 20 }: { type: MapEncounterType; size?: number }) => {
  const style = defaultEncounterStyles[type];
  switch (type) {
    case 'boss':  return  <Crown size={size} className={style.iconColor} />;
    case 'elite': return  <Crown size={size} className={style.iconColor} />;
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
  const overlayStyle = stateOverlayStyles[state];
  const chapterEncounterStyles = chapterNodeStyles[selectedChapter.theme];
  const encounterStyle = chapterEncounterStyles[node.encounterType];
  const starCount = node.encounterType === 'boss' ? 3 : node.encounterType === 'elite' ? 2 : 1;
  const nodePosition = getZigzagNodePosition(nodeIndex);
  const isBoss = node.encounterType === 'boss';
  const isElite = node.encounterType === 'elite';
  const themeColorConfig = themeColors[selectedChapter.theme];

  return (
    <div
      key={node.id} className="absolute"
      style={{ left: `${nodePosition.x}px`, top: `${nodePosition.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.button
        data-map-node="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: nodeIndex * 0.05, duration: 0.3 }}
        whileHover={disabled ? {} : { scale: 1.05, y: -4 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onHoverStart={() => onHoverStart?.()}
        onHoverEnd={() => onHoverEnd?.()}
        onClick={() => !disabled && onEnterNode(node, selectedChapter)}
        className={`relative cursor-pointer ${overlayStyle.overlay}`}
        style={{ filter: overlayStyle.glowFilter }}
      >
        <div className="relative flex flex-col items-center">
          {waveCount > 1 && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-stone-400 font-mono">
              {waveCount} {t('map.encounter.wave')}
            </div>
          )}

          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: starCount }).map((_, i) => (
              <Star 
                key={i} 
                size={8} 
                className={isBoss ? "text-yellow-500" : isElite ? "text-amber-400" : "text-stone-500"} 
                fill={isBoss || isElite ? "currentColor" : "none"}
                strokeWidth={2} 
              />
            ))}
          </div>

          <motion.div
            className={`
              ${encounterStyle.size} 
              bg-gradient-to-b ${encounterStyle.bgGradient}
              ${encounterStyle.ringColor} ring-2
              flex items-center justify-center
              ${encounterStyle.shape}
            `}
            style={{ borderStyle: 'solid' }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className={`relative z-10`}>
              <EncounterIcon type={node.encounterType} size={isBoss ? 24 : 20} />
            </div>
          </motion.div>

          <div className="mt-2">
            <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: themeColorConfig.primary }}>
              {node.name}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[9px] font-medium text-stone-500">{t(`map.encounter.${node.encounterType}`)}</span>
            <span className="text-[9px] font-mono" style={{ color: themeColorConfig.primaryLight }}>Lv.{node.recommendedLevel}</span>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[8px] text-amber-600/80 flex items-center gap-0.5">
              <span className="text-amber-700">+</span>
              {node.firstClearRewardGold}G
            </span>
            {state === 'cleared' && (
              <span className="text-[8px] text-emerald-500 flex items-center gap-0.5">
                <Star size={7} fill="currentColor" />
                {t('map.state.cleared')}
              </span>
            )}
            {state === 'warning' && (
              <span className="text-[8px] text-amber-500 flex items-center gap-0.5">
                !
                {t('map.state.warning')}
              </span>
            )}
            {state === 'ready' && (
              <span className="text-[8px] text-emerald-500 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('map.state.ready')}
              </span>
            )}
            {state === 'locked' && (
              <span className="text-[8px] text-stone-600 flex items-center gap-0.5">
                <Lock size={7} />
                {t('map.state.locked')}
              </span>
            )}
          </div>

          {attempts > 0 && (
            <div className="text-[7px] text-red-500/70 flex items-center gap-0.5 mt-0.5">
              <Skull size={6} />
              {t('map.failures', { count: attempts })}
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
