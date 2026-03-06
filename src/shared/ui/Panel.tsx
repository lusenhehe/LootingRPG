import React from 'react';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PanelProps {
  children: React.ReactNode;
  /** 额外 className */
  className?: string;
  /** 是否有内边距，默认 true */
  padded?: boolean;
  /** 是否有边框，默认 true */
  bordered?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * 基础半透明暗色容器，适用于各 Tab 面板、信息卡片等。
 */
export function Panel({ children, className = '', padded = true, bordered = true }: PanelProps) {
  return (
    <div
      className={[
        'rounded-sm bg-stone-900/30',
        bordered ? 'border border-stone-800/50' : '',
        padded ? 'p-3' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
