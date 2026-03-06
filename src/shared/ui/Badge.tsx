import React from 'react';

// ─── Quality color map ───────────────────────────────────────────────────────

const QUALITY_STYLES: Record<string, string> = {
  common:    'bg-stone-700/60 text-stone-300 border border-stone-600/40',
  uncommon:  'bg-green-900/50 text-green-300 border border-green-700/40',
  rare:      'bg-blue-900/50 text-blue-300 border border-blue-700/40',
  epic:      'bg-purple-900/50 text-purple-300 border border-purple-700/40',
  legendary: 'bg-amber-900/50 text-amber-300 border border-amber-600/50 shadow-sm shadow-amber-700/30',
  mythic:    'bg-red-900/50 text-red-300 border border-red-700/40 shadow-sm shadow-red-700/30',
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BadgeProps {
  label: string;
  /** 品质键名，决定配色 */
  quality?: string;
  /** 自定义额外 className（优先级低于 quality）*/
  className?: string;
  /** 是否显示发光效果 */
  glow?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({ label, quality, className = '', glow = false }: BadgeProps) {
  const qualityClass = quality ? (QUALITY_STYLES[quality] ?? QUALITY_STYLES['common']) : '';
  const glowClass = glow && quality === 'legendary' ? 'shadow-md shadow-amber-500/30' : '';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium leading-none ${qualityClass} ${glowClass} ${className}`}
    >
      {label}
    </span>
  );
}
