import MapNode from './MapNode';
import { motion } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mountain} from 'lucide-react';
import type { MapChapterDef, MapNodeDef } from '../../../config/map/ChapterData';
import type { MapProgressState } from '../../../shared/types/game';
import { isNodeCleared, isNodeUnlocked,} from '../../../domains/map/services/progress';
import { clampMapOffset, getZigzagNodePosition, chapterThemeStyles,} from './mapConfig';
import { themeHeaderColors} from '../../../config/map/mapNode';

interface MapViewportProps {
  playerLevel: number;
  loading: boolean;
  normalizedProgress: MapProgressState;
  selectedChapter: MapChapterDef;
  selectedChapterProgress: { cleared: number; total: number; completed: boolean };
  onEnterNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  focusNodeId?: string | null;
  onClearFocus?: () => void;
}

export default function MapViewport({
  playerLevel,
  loading,
  normalizedProgress,
  selectedChapter,
  selectedChapterProgress,
  onEnterNode,
  focusNodeId,
  onClearFocus,
}: MapViewportProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [, setHoveredNode] = useState<string | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; x: number; y: number }>({ dragging: false, x: 0, y: 0 });
  const themeColors = themeHeaderColors[selectedChapter.theme];

  const onWheel = (event: React.WheelEvent) => {
    // logic lives in the effect listener; kept here for typing but not attached directly
    const deltaX = event.deltaY || event.deltaX;
    setOffset((prev) => {
      const viewport = mapViewportRef.current?.getBoundingClientRect() ?? null;
      const next = { x: prev.x - deltaX, y: 0 };
      return clampMapOffset(next, viewport, selectedChapter.nodes.length);
    });
  };

  // React attaches wheel as a passive listener by default which prevents us from
  // calling preventDefault.  Patch the element directly with a non-passive
  // handler so we can cancel scrolling when over the map.
  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      onWheel(e as unknown as React.WheelEvent);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => {
      el.removeEventListener('wheel', handler);
    };
  }, [onWheel]);

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

  // center viewport when requested
  useEffect(() => {
    if (!focusNodeId) return;
    const idx = selectedChapter.nodes.findIndex((n) => n.id === focusNodeId);
    if (idx >= 0 && mapViewportRef.current) {
      const viewport = mapViewportRef.current.getBoundingClientRect();
      const pos = getZigzagNodePosition(idx);
      // target coordinates in px
      const targetX = (pos.x / 100) * viewport.width;
      const centerX = viewport.width / 2;
      const desired = { x: centerX - targetX, y: 0 };
      setOffset(() => clampMapOffset(desired, viewport, selectedChapter.nodes.length));
    }
    onClearFocus?.();
  }, [focusNodeId, selectedChapter, onClearFocus]);

  return (
    <section 
      className="flex-1 border rounded-xl bg-gradient-to-br from-stone-950/60 to-stone-950/50 p-3 flex flex-col overflow-hidden relative"
      style={{ borderColor: themeColors.border.replace('/30', ''), background: `linear-gradient(180deg, rgba(30,30,30,0.3) 0%, rgba(50,20,20,0.1) 50%, rgba(20,20,20,0.3) 100%)` }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${themeColors.glow}, transparent 50%), radial-gradient(ellipse at bottom right, rgba(100,20,20,0.08), transparent 50%)` }}
      />

      <header className="mb-3 pb-3 relative z-10 flex items-center justify-between" style={{ borderBottom: `1px solid ${themeColors.border.replace('/30', '')}` }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ 
              background: `linear-gradient(135deg, ${themeColors.primary}-900/40 0%, ${themeColors.primary}-950/60 100%)`,
              borderColor: `${themeColors.primary}-700/50`,
              boxShadow: `0 0 12px ${themeColors.primary}-900/30`
            }}
          >
            <Mountain size={18} className={`text-${themeColors.primary}-300`} />
          </div>
          <div>
            <h3 className="text-base font-display font-bold" style={{ color: themeColors.text === 'stone' ? '#e7e5e4' : `var(--color-${themeColors.primary}-200)` }}>
              {t(`map.${selectedChapter.id}`)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: `${themeColors.primary}-950/30`, borderColor: `${themeColors.primary}-800/30` }}>
          <span className="text-[11px]" style={{ color: themeColors.text === 'stone' ? '#a8a29e' : `var(--color-${themeColors.primary}-300)` }}>
            {selectedChapter.levelRange}
          </span>
          <span style={{ color: themeColors.text === 'stone' ? '#57534e' : `var(--color-${themeColors.primary}-700)` }}>·</span>
          <span className="text-[11px] font-medium" style={{ color: themeColors.text === 'stone' ? '#d6d3d1' : `var(--color-${themeColors.primary}-200)` }}>
            {t('map.level', { level: playerLevel })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium" style={{ color: themeColors.text === 'stone' ? '#a8a29e' : `var(--color-${themeColors.primary}-300)` }}>
              {t('map.progress')} {selectedChapterProgress.cleared}/{selectedChapterProgress.total}
            </span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.primary}-950/50` }}>
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: themeColors.primary === 'stone' ? '#a8a29e' : `var(--color-${themeColors.primary}-500)` }}
                initial={{ width: 0 }}
                animate={{ width: `${(selectedChapterProgress.cleared / selectedChapterProgress.total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center border"
            style={{ 
              background: `linear-gradient(135deg, ${themeColors.primary}-900/30 0%, ${themeColors.primary}-950/50 100%)`,
              borderColor: `${themeColors.primary}-700/40`,
            }}
          >
            <span className="text-sm font-bold" style={{ color: themeColors.text === 'stone' ? '#d6d3d1' : `var(--color-${themeColors.primary}-200)` }}>
              {Math.round((selectedChapterProgress.cleared / selectedChapterProgress.total) * 100)}%
            </span>
          </div>
        </div>
      </header>

      <div
        ref={mapViewportRef}
        className="flex-1 min-h-0 rounded-xl border relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          background: chapterThemeStyles[selectedChapter.theme]?.background,
          borderColor: themeColors.border.replace('/30', ''),
        }}
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
                <stop offset="0%" stopColor={chapterThemeStyles[selectedChapter.theme]?.pathColor} stopOpacity="0.9" />
                <stop offset="50%" stopColor="rgba(255, 80, 80, 0.85)" />
                <stop offset="100%" stopColor={chapterThemeStyles[selectedChapter.theme]?.pathColor} stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="pathGradientReady" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={chapterThemeStyles[selectedChapter.theme]?.pathColor} stopOpacity="0.7" />
                <stop offset="50%" stopColor="rgba(200, 60, 60, 0.6)" />
                <stop offset="100%" stopColor={chapterThemeStyles[selectedChapter.theme]?.pathColor} stopOpacity="0.7" />
              </linearGradient>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="bloodGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feFlood floodColor="#8b0000" floodOpacity="0.8"/>
                <feComposite in2="coloredBlur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
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
              const themePathColor = chapterThemeStyles[selectedChapter.theme]?.pathColor || 'rgb(100, 50, 50)';
              const pathColor = currentCleared ? 'url(#pathGradientCleared)' : nextUnlocked ? 'url(#pathGradientReady)' : themePathColor + '40';
              return (
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
