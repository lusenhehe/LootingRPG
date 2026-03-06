import React from 'react';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SpinnerProps {
  /** 尺寸，默认 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** 颜色 className，默认 amber */
  colorClass?: string;
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', colorClass = 'border-amber-500', className = '' }: SpinnerProps) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES['md'];
  return (
    <div
      className={`${sizeClass} ${colorClass} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}
