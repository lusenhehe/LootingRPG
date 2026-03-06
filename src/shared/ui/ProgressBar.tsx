import React from 'react';

// ─── 颜色方案 ───────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<string, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  blue:   'bg-indigo-500',
  purple: 'bg-violet-500',
};

const HEIGHT_CLASSES: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
};

// ─── HP 阈值自动配色 ─────────────────────────────────────────────────────────

/**
 * 根据 value/max 的比值自动返回健康颜色：
 * - > 60%  → green
 * - > 30%  → yellow
 * - ≤ 30%  → red
 */
export function hpColor(value: number, max: number): 'green' | 'yellow' | 'red' {
  const pct = max > 0 ? value / max : 0;
  if (pct > 0.6) return 'green';
  if (pct > 0.3) return 'yellow';
  return 'red';
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  /** 当前值 */
  value: number;
  /** 最大值 */
  max: number;
  /**
   * 颜色方案。传 `'auto'` 时根据 value/max 比值自动选择 green/yellow/red。
   * 默认 `'green'`。
   */
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'auto';
  /** 自定义 Tailwind 背景色 class，优先级高于 color */
  customColor?: string;
  /** 高度档位，默认 `'sm'`（h-1.5） */
  height?: 'xs' | 'sm' | 'md';
  /** 是否使用 motion/react 动画（需要父项已安装 motion/react），默认 false */
  animated?: boolean;
  /** 外层容器额外 className */
  className?: string;
}

export function ProgressBar({
  value,
  max,
  color = 'green',
  customColor,
  height = 'sm',
  className = '',
}: ProgressBarProps) {
  const clampedMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(100, (value / clampedMax) * 100));

  const resolvedColor = color === 'auto' ? hpColor(value, max) : color;
  const fillClass = customColor ?? COLOR_CLASSES[resolvedColor] ?? COLOR_CLASSES['green'];
  const heightClass = HEIGHT_CLASSES[height] ?? HEIGHT_CLASSES['sm'];

  return (
    <div className={`${heightClass} rounded-sm bg-gray-900/80 overflow-hidden shrink-0 ${className}`}>
      <div
        className={`h-full ${fillClass} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
