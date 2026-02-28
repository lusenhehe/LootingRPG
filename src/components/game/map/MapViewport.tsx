import MapNode from './MapNode';
import { motion } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mountain} from 'lucide-react';
import type { MapChapterDef, MapNodeDef } from '../../../config/map/ChapterData';
import type { MapProgressState } from '../../../shared/types/game';
import type { ChapterTheme } from '../../../config/map/mapNode';
import { isNodeCleared, isNodeUnlocked,} from '../../../domains/map/services/progress';
import { clampMapOffset, getZigzagNodePosition, chapterThemeStyles, getCanvasWidth, NODE_MARGIN_X, NODE_SPACING_X } from './MapConfig';
import { themeHeaderColors} from '../../../config/map/mapNode';
import { getMapBackgroundLayers } from './mapBackgroundFactory';

// ─── 环境粒子配置 ─────────────────────────────────────────────────────────────
// [x%, y%, size_px, animDelay_s, animDur_s]
type ParticleDef = [number, number, number, number, number];

const THEME_PARTICLES: Record<string, ParticleDef[]> = {
  '林地': [
    [10, 74, 3,   0,   9 ], [26, 58, 2,   2.5, 11], [43, 80, 3,   1,   8 ],
    [59, 65, 2,   4,   13], [74, 72, 3,   0.8, 10], [88, 57, 2,   3.2, 12],
    [34, 42, 2,   5,   9 ], [67, 40, 3,   1.5, 14],
  ],
  '地牢': [
    [14, 52, 2,   0,   14], [32, 35, 1.5, 3,   10], [50, 66, 2,   1.5, 12],
    [68, 40, 1.5, 5,   16], [84, 60, 2,   2.2, 11], [46, 28, 1.5, 7,   15],
  ],
  '火山': [
    // 余烬上浮：少量、沉重、随机 delay，突出「闷燃」感
    [12, 76, 2.5, 0,   8.0], [38, 82, 2,   2.8, 9.5],
    [62, 74, 3,   1.2, 7.5], [80, 80, 2,   4.5, 10 ],
    [90, 70, 2.5, 3.0, 8.5],
  ],
  '亡灵': [
    [12, 44, 4,   0,   16], [30, 62, 3,   4,   20], [48, 36, 4,   2,   14],
    [64, 58, 3,   6,   18], [80, 43, 4,   1.5, 15], [22, 28, 3,   8,   19],
  ],
};

const PARTICLE_COLORS: Record<string, string> = {
  '林地': 'rgba(138, 210, 88,  0.82)',
  '地牢': 'rgba(168, 188, 228, 0.76)',
  '火山': 'rgba(210, 62,  8,   0.72)',  // 暗红余烬，不用亮橙
  '亡灵': 'rgba(158, 218, 198, 0.80)',
};

// 亡灵：横向漂移 | 火山：余烬缓升 | 其余：通用上浮
const particleAnimation = (theme: string) => {
  if (theme === '亡灵') return 'map-wisp-drift';
  if (theme === '火山') return 'map-lava-ember';
  return 'map-particle-float';
};

// ─── 主题地标装饰（在 Canvas SVG 内渲染，随地图平移） ─────────────────────────
function renderGapDecoration(
  theme: ChapterTheme,
  gapIndex: number,
  nodeCount: number,
): React.ReactNode {
  // 每个节点间隙的中点 X（像素），交替出现在路径上下方
  const midX = NODE_MARGIN_X + (gapIndex + 0.5) * NODE_SPACING_X;
  const isTop = gapIndex % 2 === 0;
  const yPos  = isTop ? '10%' : '60%';
  const key   = `dec-${gapIndex}`;

  // 每个章节最多渲染 (nodeCount-1) 个装饰，超出节点数的间隙跳过
  if (gapIndex >= nodeCount - 1) return null;

  switch (theme) {
    case '林地': {
      // 枯树轮廓（双层树冠 + 树干）
      const canopyFill = isTop ? 'rgba(42,78,30,0.46)' : 'rgba(52,90,36,0.42)';
      return (
        <svg key={key} x={midX - 18} y={yPos} width="36" height="42" overflow="visible">
          <rect x="14" y="24" width="6" height="18" rx="1.5" fill="rgba(62,44,20,0.50)"/>
          <polygon points="17,0 2,20 32,20"  fill={canopyFill}/>
          <polygon points="17,12 4,28 30,28" fill={canopyFill} opacity="0.72"/>
          {/* 树旁小蘑菇 */}
          <ellipse cx={isTop ? 28 : 6} cy="40" rx="5" ry="3" fill="rgba(100,70,35,0.32)"/>
          <ellipse cx={isTop ? 28 : 6} cy="38" rx="4" ry="4" fill="rgba(90,62,30,0.28)"/>
        </svg>
      );
    }
    case '地牢': {
      // 壁挂火炬
      return (
        <svg key={key} x={midX - 10} y={yPos} width="20" height="40" overflow="visible">
          {/* 炬柄 */}
          <rect x="8" y="20" width="4" height="18" rx="1.5" fill="rgba(95,82,60,0.52)"/>
          {/* 外焰光晕 */}
          <ellipse cx="10" cy="11" rx="8" ry="10" fill="rgba(200,140,38,0.18)"/>
          {/* 中焰 */}
          <ellipse cx="10" cy="13" rx="5"  ry="8"  fill="rgba(230,160,48,0.50)"/>
          {/* 焰芯 */}
          <ellipse cx="10" cy="15" rx="2.5" ry="5" fill="rgba(255,200,100,0.60)"/>
          {/* 壁面支架横杆 */}
          <rect x="2" y="18" width="16" height="2.5" rx="1" fill="rgba(120,108,88,0.40)"/>
        </svg>
      );
    }
    case '火山': {
      // 焦岩裂隙（不对称裂缝 + 锯齿边缘 + 深处熔岩光）
      return (
        <svg key={key} x={midX - 26} y={yPos} width="52" height="36" overflow="visible">
          {/* 深层熔岩底部光晕（最底层，模拟裂隙深处） */}
          <ellipse cx="26" cy="30" rx="18" ry="5" fill="rgba(107,20,0,0.38)"/>
          {/* 外层焦黑岩石轮廓（不对称） */}
          <polygon
            points="4,28 10,22 14,26 18,18 22,24 26,14 30,22 34,16 38,24 42,20 48,28"
            fill="rgba(20,4,1,0.72)" stroke="rgba(50,8,1,0.60)" strokeWidth="1"
          />
          {/* 主裂缝（锯齿状，中央最亮） */}
          <path
            d="M10,26 L14,20 L18,24 L22,16 L26,10 L30,18 L34,14 L38,22 L44,24"
            fill="none" stroke="#6b1400" strokeWidth="3.5" strokeLinecap="round"
          />
          <path
            d="M10,26 L14,20 L18,24 L22,16 L26,10 L30,18 L34,14 L38,22 L44,24"
            fill="none" stroke="#ff4a00" strokeWidth="2" strokeLinecap="round" opacity="0.75"
          />
          <path
            d="M10,26 L14,20 L18,24 L22,16 L26,10 L30,18 L34,14 L38,22 L44,24"
            fill="none" stroke="#ff8a2b" strokeWidth="0.8" strokeLinecap="round" opacity="0.90"
          />
          {/* 裂缝分叉 */}
          <path d="M22,16 L18,10 L20,6" fill="none" stroke="#ff4a00" strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
          {/* 裂隙底部熔岩渗出 */}
          <ellipse cx="26" cy="25" rx="5" ry="2" fill="rgba(255,138,43,0.36)"/>
          <ellipse cx="20" cy="27" rx="3" ry="1.5" fill="rgba(255,74,0,0.28)"/>
        </svg>
      );
    }
    case '亡灵': {
      // 墓碑
      return (
        <svg key={key} x={midX - 12} y={yPos} width="24" height="36" overflow="visible">
          {/* 墓碑石 */}
          <rect x="4" y="8" width="16" height="22" rx="8" fill="rgba(85,72,108,0.45)"/>
          {/* 墓碑顶部高光 */}
          <rect x="5" y="9" width="14" height="4" rx="7" fill="rgba(140,125,170,0.22)"/>
          {/* 十字纹 */}
          <line x1="12" y1="13" x2="12" y2="27" stroke="rgba(158,140,195,0.55)" strokeWidth="2"/>
          <line x1="7"  y1="17" x2="17" y2="17" stroke="rgba(158,140,195,0.55)" strokeWidth="2"/>
          {/* 底部土堆 */}
          <ellipse cx="12" cy="32" rx="12" ry="4" fill="rgba(55,45,70,0.42)"/>
          {/* 旁边小骨头 */}
          <circle cx={isTop ? 22 : 2} cy="34" r="2" fill="rgba(165,155,185,0.30)"/>
        </svg>
      );
    }
    default: return null;
  }
}

// ─── 路径样式 ─────────────────────────────────────────────────────────────────
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

interface PathStyle {
  type: 'dirt' | 'stone' | 'lava' | 'blood';
  strokeColor: string;
  strokeWidth: number;
  clearedColor: string;
  dashed: boolean;
  texture: string;
}

const getPathStyles = (theme: string): PathStyle => {
  const themeStyles = chapterThemeStyles[theme as keyof typeof chapterThemeStyles];
  const styles = themeStyles?.pathStyle;
  if (styles) {
    return {
      type: styles.type as 'dirt' | 'stone' | 'lava' | 'blood',
      strokeColor: styles.strokeColor,
      strokeWidth: styles.strokeWidth,
      clearedColor: styles.clearedColor,
      dashed: styles.dashed,
      texture: styles.texture
    };
  }
  
  return {
    type: 'dirt',
    strokeColor: 'rgb(60, 45, 30)',
    strokeWidth: 3,
    clearedColor: 'rgb(80, 60, 40)',
    dashed: false,
    texture: 'rough'
  };
};

const getPathFilter = (type: string, isCleared: boolean): string => {
  if (type === 'blood') {
    return isCleared ? 'url(#bloodPathGlow)' : 'none';
  }
  if (type === 'lava') {
    return isCleared ? 'url(#lavaPathGlow)' : 'none';
  }
  return 'none';
};

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
  // ── 流畅拖拽：绕过 React 渲染，直接操作 DOM ─────────────────────────
  const offsetRef    = useRef({ x: 0, y: 0 });
  const canvasDivRef = useRef<HTMLDivElement | null>(null);
  const patternDivRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef     = useRef<number | null>(null);
  const themeColors = themeHeaderColors[selectedChapter.theme];
  const pathStyles = getPathStyles(selectedChapter.theme);

  // 把 offset state 变化（focus 跳转等）同步到 DOM
  useEffect(() => {
    offsetRef.current = offset;
    if (canvasDivRef.current)  canvasDivRef.current.style.transform  = `translateX(${offset.x}px)`;
    if (patternDivRef.current) patternDivRef.current.style.backgroundPosition = `${offset.x}px 55px`;
  }, [offset]);
  
  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => {
      el.removeEventListener('wheel', handler);
    };
  }, []); // 只注册一次，避免每帧重绑

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-map-node="1"]')) return;
    // 阻止浏览器原生 drag-and-drop（否则会触发禁止光标 + pointercancel）
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { dragging: true, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // buttons===0 说明按键已松开但 dragging 未重置（edge case），立即归位
    if (!dragRef.current.dragging || event.buttons === 0) {
      dragRef.current.dragging = false;
      return;
    }
    const dx = event.clientX - dragRef.current.x;
    dragRef.current.x = event.clientX;
    const viewport = mapViewportRef.current?.getBoundingClientRect() ?? null;
    const next = clampMapOffset({ x: offsetRef.current.x + dx, y: 0 }, viewport, selectedChapter.nodes.length);
    offsetRef.current = next;
    // RAF：单帧只提交一次 DOM 写入，避免重渲染卡顿
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (canvasDivRef.current)  canvasDivRef.current.style.transform  = `translateX(${offsetRef.current.x}px)`;
      if (patternDivRef.current) patternDivRef.current.style.backgroundPosition = `${offsetRef.current.x}px 55px`;
      rafIdRef.current = null;
    });
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    // 松手后同步 state（触发一次 React 渲染让 SVG 路径等子树对齐）
    setOffset(offsetRef.current);
  };

  const onPointerUp     = stopDrag;
  const onPointerCancel = stopDrag; // native drag / 系统中断时也能正确归位
  useEffect(() => {
    if (!focusNodeId) return;
    const idx = selectedChapter.nodes.findIndex((n) => n.id === focusNodeId);
    if (idx >= 0 && mapViewportRef.current) {
      const viewport = mapViewportRef.current.getBoundingClientRect();
      const pos = getZigzagNodePosition(idx);
      // pos.x 现在是局地像素値，直接用于计算中心对齐偏移
      const centerX = viewport.width / 2;
      const desired = { x: centerX - pos.x, y: 0 };
      setOffset(() => clampMapOffset(desired, viewport, selectedChapter.nodes.length));
    }
    onClearFocus?.();
  }, [focusNodeId, selectedChapter, onClearFocus]);

  const bgLayers = getMapBackgroundLayers(selectedChapter.theme);
  const canvasWidth = getCanvasWidth(selectedChapter.nodes.length);

  return (
    <section 
      className="flex-1 min-h-0 border rounded-xl bg-stone-950 p-3 flex flex-col overflow-hidden relative"
      style={{ borderColor: themeColors.border.replace('/30', ''), background: '#0a0a0a' }}
    >
      <header className="mb-3 pb-3 relative z-10 flex items-center justify-between" style={{ borderBottom: `1px solid ${themeColors.border.replace('/30', '')}` }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded flex items-center justify-center border"
            style={{ 
              background: `linear-gradient(135deg, ${themeColors.primary}-900/40 0%, ${themeColors.primary}-950/60 100%)`,
              borderColor: `${themeColors.primary}-700/50`,
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

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border" style={{ backgroundColor: `${themeColors.primary}-950/30`, borderColor: `${themeColors.primary}-800/30` }}>
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
            className="w-10 h-10 rounded flex items-center justify-center border"
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
          background: bgLayers.base,
          borderColor: themeColors.border.replace('/30', ''),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* pattern 层：SVG 瓦片纹理（砖缝/根脉/熔岩裂缝/骨裂），screen 混合，backgroundPosition 由 ref 驱动跟随滚动 */}
        <div
          ref={patternDivRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: bgLayers.pattern,
            backgroundRepeat: 'repeat',
            backgroundPosition: '0px 55px',
            opacity: 0.85,
            mixBlendMode: 'screen',
          }}
        />
        {/* detail 层：纹理条纹，screen 混合在深色底上才可见（soft-light 在暗底 = 无效）*/}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: bgLayers.detail,
            opacity: 0.9,
            mixBlendMode: 'screen',
          }}
        />
        {/* haze 层：大面积色雾，略低透明度 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: bgLayers.haze,
            opacity: 0.75,
            mixBlendMode: 'screen',
          }}
        />

        {/* ── 火山专属：脉动熔岩池（深度对比，呼吸感）────────────────── */}
        {selectedChapter.theme === '火山' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* 熔岩池 1 — 左下主池（最大，核心热源） */}
            <div style={{
              position: 'absolute',
              left: '6%', top: '65%',
              width: '24%', height: '20%',
              background: 'radial-gradient(ellipse at 42% 52%, rgba(255,138,43,0.58) 0%, rgba(255,74,0,0.40) 40%, rgba(107,20,0,0.22) 72%, transparent 100%)',
              borderRadius: '58% 42% 64% 36% / 48% 55% 45% 52%',
              animationName: 'map-lava-pool-pulse',
              animationDuration: '3.2s',
              animationDelay: '0s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }} />
            {/* 熔岩池 2 — 右侧中部（中等，独立热区） */}
            <div style={{
              position: 'absolute',
              left: '68%', top: '32%',
              width: '19%', height: '15%',
              background: 'radial-gradient(ellipse at 38% 46%, rgba(255,118,28,0.52) 0%, rgba(255,74,0,0.34) 44%, rgba(107,20,0,0.18) 76%, transparent 100%)',
              borderRadius: '44% 56% 38% 62% / 55% 42% 58% 45%',
              animationName: 'map-lava-pool-pulse',
              animationDuration: '3.8s',
              animationDelay: '1.4s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }} />
            {/* 熔岩池 3 — 中上偏左小池（最小，作强调） */}
            <div style={{
              position: 'absolute',
              left: '38%', top: '10%',
              width: '13%', height: '10%',
              background: 'radial-gradient(ellipse at 50% 45%, rgba(245,98,18,0.46) 0%, rgba(210,58,0,0.30) 50%, rgba(107,20,0,0.14) 80%, transparent 100%)',
              borderRadius: '62% 38% 54% 46% / 44% 58% 42% 56%',
              animationName: 'map-lava-pool-pulse',
              animationDuration: '2.7s',
              animationDelay: '0.8s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }} />
          </div>
        )}

        {/* vignette 层：主题色调边缘压暗（取代固定黑色渐变） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: bgLayers.vignette }}
        />

        {/* ── 环境粒子层（固定，不随地图平移）─────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {(THEME_PARTICLES[selectedChapter.theme] ?? []).map(([px, py, size, delay, dur], i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${px}%`,
                top:  `${py}%`,
                width:  size,
                height: size,
                background: `radial-gradient(circle, ${PARTICLE_COLORS[selectedChapter.theme] ?? 'rgba(200,200,200,0.7)'} 0%, transparent 70%)`,
                animationName: particleAnimation(selectedChapter.theme),
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out',
                animationFillMode: 'both',
              }}
            />
          ))}
        </div>

        {/* ── 滚动边缘提示（左右渐隐，暗示可拖动）───────────────────── */}
        <div
          className="absolute top-0 left-0 bottom-0 w-14 pointer-events-none z-10"
          style={{ background: `linear-gradient(to right, ${bgLayers.vignette.match(/rgba\([^)]+\)/)?.[0] ?? 'rgba(0,0,0,0.5)'} 0%, transparent 100%)` }}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-14 pointer-events-none z-10"
          style={{ background: `linear-gradient(to left, ${bgLayers.vignette.match(/rgba\([^)]+\)/)?.[0] ?? 'rgba(0,0,0,0.5)'} 0%, transparent 100%)` }}
        />

        {/* ── 可滚动画布内容（宽度 = 所有节点所需像素宽度）─────────── */}
        <div
          ref={canvasDivRef}
          className="absolute top-0 left-0 h-full z-content"
          style={{ width: `${canvasWidth}px` }}
        >
          {/* 路径 + 地标装饰 SVG */}
          <svg
            className="absolute top-0 left-0 h-full pointer-events-none overflow-visible"
            style={{ width: `${canvasWidth}px` }}
          >
            <defs>
              <filter id="dirtPath">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
              </filter>
              <filter id="stonePath">
                <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
              </filter>
              <filter id="bloodPathGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feFlood floodColor="#4a0a0a" floodOpacity="0.6" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="lavaPathGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor="#8b2500" floodOpacity="0.5" />
                <feComposite in2="blur" operator="in" />

                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── 节点间地标装饰 ── */}
            {selectedChapter.nodes.slice(0, -1).map((_, gapIdx) =>
              renderGapDecoration(selectedChapter.theme, gapIdx, selectedChapter.nodes.length)
            )}

            {/* ── 连接路径 ── */}
            {selectedChapter.nodes.slice(0, -1).map((node, index) => {
              const nextNode = selectedChapter.nodes[index + 1];
              const currentPos = getZigzagNodePosition(index);
              const nextPos = getZigzagNodePosition(index + 1);
              const currentCleared = isNodeCleared(normalizedProgress, node.id);
              const nextUnlocked = isNodeUnlocked(normalizedProgress, nextNode.id);
              
              const isCleared = currentCleared;
              const isReady = nextUnlocked;
              
              const baseColor = isCleared ? pathStyles.clearedColor : pathStyles.strokeColor;
              const width = pathStyles.strokeWidth;
              const dashArray = pathStyles.dashed && !isCleared ? "6 8" : "none";
              
              const filter = getPathFilter(pathStyles.type, isCleared);
              const filterForDirt = pathStyles.type === 'dirt' ? 'url(#dirtPath)' : pathStyles.type === 'stone' ? 'url(#stonePath)' : 'none';

              return (
                <g key={`${node.id}-${nextNode.id}`}>
                  <motion.line
                    x1={currentPos.x}
                    y1={`${currentPos.y}%`}
                    x2={nextPos.x}
                    y2={`${nextPos.y}%`}
                    stroke={baseColor}
                    strokeWidth={width}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={filterForDirt}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  />
                  {(isCleared || isReady) && (
                    <motion.line
                      x1={currentPos.x}
                      y1={`${currentPos.y}%`}
                      x2={nextPos.x}
                      y2={`${nextPos.y}%`}
                      stroke={isCleared ? "rgba(60,50,40,0.6)" : "rgba(60,50,40,0.3)"}
                      strokeWidth={width * 0.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={filter}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                    />
                  )}
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
