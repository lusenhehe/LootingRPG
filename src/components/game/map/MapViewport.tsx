import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mountain } from 'lucide-react';
import type { MapChapterDef } from '../../../config/mapChapters';
import type { MapProgressState } from '../../../types/game';
import {
  isNodeCleared,
  isNodeUnlocked,
} from '../../../logic/mapProgress';
import MapNode from './MapNode';
import {
  clampMapOffset,
  getZigzagNodePosition,
} from './mapConfig';

interface MapViewportProps {
  playerLevel: number;
  loading: boolean;
  normalizedProgress: MapProgressState;
  selectedChapter: MapChapterDef;
  selectedChapterProgress: { cleared: number; total: number; completed: boolean };
  onEnterNode: (node: any, chapter: MapChapterDef) => void;
}

export default function MapViewport({
  playerLevel,
  loading,
  normalizedProgress,
  selectedChapter,
  selectedChapterProgress,
  onEnterNode,
}: MapViewportProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; x: number; y: number }>({ dragging: false, x: 0, y: 0 });

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    // scroll horizontally using wheel delta
    const deltaX = event.deltaY || event.deltaX;
    setOffset((prev) => {
      const viewport = mapViewportRef.current?.getBoundingClientRect() ?? null;
      const next = { x: prev.x - deltaX, y: 0 };
      return clampMapOffset(next, viewport, selectedChapter.nodes.length);
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-map-node="1"]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { dragging: true, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = event.clientX - dragRef.current.x;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    const viewport = mapViewportRef.current?.getBoundingClientRect() ?? null;
    setOffset((prev) => clampMapOffset({ x: prev.x + dx, y: 0 }, viewport, selectedChapter.nodes.length));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.dragging = false;
  };

  const onPointerLeave = () => {
    dragRef.current.dragging = false;
  };

  return (
    <section className="flex-1 border border-game-border/50 rounded-xl bg-gradient-to-br from-game-card/60 via-game-bg/40 to-game-card/50 p-3 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)] pointer-events-none" />

      <header className="mb-3 flex items-center justify-between border-b border-game-border/50 pb-3 relative z-10">
        <div>
          <h3 className="text-sm font-display font-bold text-violet-200 flex items-center gap-2">
            <div className="p-1 rounded-md bg-violet-500/20 border border-violet-500/30">
              <Mountain size={12} className="text-violet-400" />
            </div>
            {t(selectedChapter.name)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
            <span>{t('map.recommended')} {selectedChapter.levelRange}</span>
            <span className="text-gray-600">·</span>
            <span className="text-cyan-400">{t('map.level', { level: playerLevel })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-300 border border-game-border/50 rounded-lg px-2.5 py-1.5 bg-black/30 backdrop-blur-sm flex items-center gap-2">
            <span className="text-gray-500">{t('map.progress')}</span>
            <span className="text-violet-300 font-semibold">{selectedChapterProgress.cleared}/{selectedChapterProgress.total}</span>
          </div>
        </div>
      </header>

      <div
        ref={mapViewportRef}
        className="flex-1 min-h-0 rounded-xl border border-white/10 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          background: `
              radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(34,211,238,0.1) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 60%, rgba(168,85,247,0.08) 0%, transparent 35%),
              linear-gradient(180deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)
            `,
        }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: '50% 50%',
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="pathGradientCleared" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.9" />
                <stop offset="50%" stopColor="rgb(34, 211, 238)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="pathGradientReady" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.7" />
                <stop offset="50%" stopColor="rgb(124, 58, 237)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0.7" />
              </linearGradient>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {selectedChapter.nodes.slice(0, -1).map((node, index) => {
              const nextNode = selectedChapter.nodes[index + 1];
              const currentPos = getZigzagNodePosition(index);
              const nextPos = getZigzagNodePosition(index + 1);
              const currentCleared = isNodeCleared(normalizedProgress, node.id);
              const nextUnlocked = isNodeUnlocked(normalizedProgress, nextNode.id);

              const pathColor = currentCleared
                ? 'url(#pathGradientCleared)'
                : nextUnlocked
                ? 'url(#pathGradientReady)'
                : 'rgba(100,116,139,0.3)';

              return (
                <>
                  <g key={`${node.id}-${nextNode.id}`}>
                    <motion.line
                      x1={`${currentPos.x}%`}
                      y1={`${currentPos.y}%`}
                      x2={`${nextPos.x}%`}
                      y2={`${nextPos.y}%`}
                      stroke={pathColor}
                      strokeWidth="3"
                      strokeDasharray={currentCleared ? "none" : "8 6"}
                      strokeLinecap="round"
                      filter={currentCleared || nextUnlocked ? "url(#pathGlow)" : undefined}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.15 }}
                    />
                    <motion.line
                      x1={`${currentPos.x}%`}
                      y1={`${currentPos.y}%`}
                      x2={`${nextPos.x}%`}
                      y2={`${nextPos.y}%`}
                      stroke={currentCleared ? "rgba(255,255,255,0.4)" : nextUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"}
                      strokeWidth="1"
                      strokeDasharray={currentCleared ? "none" : "8 6"}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.15 + 0.1 }}
                    />
                  </g>
                </>
              );
            })}
          </svg>

          {selectedChapter.nodes.map((node, nodeIndex) => (
            <MapNode
              key={node.id}
              node={node}
              nodeIndex={nodeIndex}
              selectedChapter={selectedChapter}
              normalizedProgress={normalizedProgress}
              playerLevel={playerLevel}
              loading={loading}
              onEnterNode={onEnterNode}
              onHoverStart={() => setHoveredNode(node.id)}
              onHoverEnd={() => setHoveredNode(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
