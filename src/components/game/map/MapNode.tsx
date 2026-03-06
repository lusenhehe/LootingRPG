import {getNodeAttempts,isNodeCleared,isNodeUnlocked} from '../../../domains/map/services/progress';
import { Lock, Star, Skull, Crown, Ghost, Flame, Shield, Swords, Zap } from 'lucide-react';
import { getNodeState, stateOverlayStyles, getZigzagNodePosition } from './MapConfig';
import type { MapNodeDef, MapChapterDef } from '../../../config/map/ChapterData';
import type { MapEncounterType } from '../../../config/map/mapNode';
import type { MapProgressState } from '../../../shared/types/game';
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
    case 'elite': return  <Swords size={size} className={style.iconColor} />;
    default:      return  <Shield size={size} className={style.iconColor} />;
  }
};

const getNodeRarityColor = (type: MapEncounterType, state: string) => {
  if (state === 'locked') return { glow: '#1a1a1a', border: '#2a2a2a', text: '#4a4a4a' };
  switch (type) {
    case 'boss': return { glow: '#991B1B', border: '#DC2626', text: '#FECACA' };
    case 'elite': return { glow: '#7C2D12', border: '#F59E0B', text: '#FDE68A' };
    default: return { glow: '#1E3A5F', border: '#3B82F6', text: '#BFDBFE' };
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
  const rarityColors = getNodeRarityColor(node.encounterType, state);

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
        whileTap={disabled ? {} : { scale: 0.97 }}
        onHoverStart={() => onHoverStart?.()}
        onHoverEnd={() => onHoverEnd?.()}
        onClick={() => !disabled && onEnterNode(node, selectedChapter)}
        className="relative cursor-pointer"
        style={{ 
          filter: disabled ? 'grayscale(0.8)' : `drop-shadow(0 0 12px ${rarityColors.glow}40)`,
        }}
      >
        <div className="relative flex flex-col items-center">
          {waveCount > 1 && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-amber-600/80 font-mono tracking-wider uppercase" style={{ textShadow: '0 0 4px rgba(180,83,9,0.5)' }}>
              <Zap size={8} className="inline mr-1 text-amber-500" />
              {waveCount} {t('map.encounter.wave')}
            </div>
          )}

          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: starCount }).map((_, i) => (
              <div key={i} className="relative">
                <Star 
                  size={10} 
                  className={isBoss ? "text-yellow-600" : isElite ? "text-amber-500" : "text-stone-500"} 
                  fill={isBoss || isElite ? "currentColor" : "none"}
                  strokeWidth={2.5} 
                />
                {isBoss && (
                  <Flame size={4} className="absolute -top-1 -right-1 text-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <motion.div
            className={`
              relative
              ${encounterStyle.size}
              flex items-center justify-center
            `}
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${rarityColors.glow}60 0%, #0a0908 70%)`,
              border: `2px solid ${rarityColors.border}`,
              borderRadius: isBoss ? '4px' : isElite ? '50% 50% 50% 50% / 30% 30% 70% 70%' : '50%',
              boxShadow: `
                inset 0 2px 4px rgba(255,255,255,0.1),
                inset 0 -2px 4px rgba(0,0,0,0.4),
                0 0 20px ${rarityColors.glow}30,
                0 4px 12px rgba(0,0,0,0.6)
              `,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-inherit pointer-events-none" />
            
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-amber-700/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-amber-700/60" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-amber-700/60" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-amber-700/60" />
            
            {state === 'ready' && !disabled && (
              <div className="absolute inset-0 rounded-inherit animate-pulse" style={{
                background: `radial-gradient(ellipse at center, ${rarityColors.glow}20 0%, transparent 60%)`,
              }} />
            )}
            
            <div className="relative z-10">
              <EncounterIcon type={node.encounterType} size={isBoss ? 26 : 22} />
            </div>
            
            {disabled && (
              <div className="absolute inset-0 bg-black/50 rounded-inherit flex items-center justify-center">
                <Lock size={20} className="text-stone-600" />
              </div>
            )}
          </motion.div>

          <div className="mt-3 relative">
            <div className="absolute -inset-2 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent w-24" />
            <span className="relative text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap px-3" 
              style={{ 
                color: rarityColors.text,
                textShadow: `0 0 8px ${rarityColors.glow}60, 0 2px 4px rgba(0,0,0,0.8)`,
                fontFamily: '"Cinzel", serif',
              }}>
              {node.name}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-[9px]">
            <span className="text-stone-500 uppercase tracking-wider font-medium">{t(`map.encounter.${node.encounterType}`)}</span>
            <span className="text-amber-600 font-mono" style={{ textShadow: '0 0 4px rgba(180,83,9,0.4)' }}>
              Lv.{node.recommendedLevel}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-[10px]">
            <span className="text-amber-600/80 flex items-center gap-1" style={{ textShadow: '0 0 4px rgba(180,83,9,0.3)' }}>
              <span className="text-amber-700 text-[8px]">◆</span>
              {node.firstClearRewardGold}G
            </span>
            {state === 'cleared' && (
              <span className="text-emerald-500 flex items-center gap-1" style={{ textShadow: '0 0 6px rgba(34,197,94,0.4)' }}>
                <Star size={8} fill="currentColor" />
                <span className="uppercase tracking-wider font-medium">{t('map.state.cleared')}</span>
              </span>
            )}
            {state === 'warning' && (
              <span className="text-amber-500 flex items-center gap-1" style={{ textShadow: '0 0 6px rgba(245,158,11,0.4)' }}>
                <Skull size={8} />
                <span className="uppercase tracking-wider">{t('map.state.warning')}</span>
              </span>
            )}
            {state === 'ready' && !disabled && (
              <span className="text-emerald-400 flex items-center gap-1" style={{ textShadow: '0 0 6px rgba(52,211,153,0.4)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
                <span className="uppercase tracking-wider font-medium">{t('map.state.ready')}</span>
              </span>
            )}
            {state === 'locked' && (
              <span className="text-stone-600 flex items-center gap-1">
                <Lock size={8} />
                <span className="uppercase tracking-wider">{t('map.state.locked')}</span>
              </span>
            )}
          </div>

          {attempts > 0 && (
            <div className="text-[9px] text-red-500/70 flex items-center gap-1 mt-1" style={{ textShadow: '0 0 6px rgba(239,68,68,0.4)' }}>
              <Skull size={8} />
              <span className="font-medium">{t('map.failures', { count: attempts })}</span>
            </div>
          )}
        </div>

        {isBoss && !disabled && (
          <>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-red-600 to-transparent opacity-60" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-gradient-to-t from-red-600 to-transparent opacity-60" />
          </>
        )}
      </motion.button>
    </div>
  );
}
