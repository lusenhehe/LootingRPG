import React from 'react';
import { motion } from 'motion/react';

// ─── Variant styles ──────────────────────────────────────────────────────────

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none';

const VARIANTS: Record<string, string> = {
  primary:  'bg-gradient-to-r from-amber-700 to-amber-600 border border-amber-500/50 text-amber-50 hover:from-amber-600 hover:to-amber-500',
  danger:   'bg-gradient-to-r from-red-800 to-red-700 border border-red-600/50 text-red-100 hover:from-red-700 hover:to-red-600',
  ghost:    'bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/50 text-stone-400 hover:text-stone-300',
  gold:     'bg-gradient-to-r from-yellow-700 to-yellow-600 border border-yellow-500/50 text-yellow-50 hover:from-yellow-600 hover:to-yellow-500',
  success:  'bg-gradient-to-r from-emerald-800 to-emerald-700 border border-emerald-600/50 text-emerald-100 hover:from-emerald-700 hover:to-emerald-600',
};

const SIZES: Record<string, string> = {
  xs:  'px-2 py-1 text-[10px] rounded-sm',
  sm:  'px-3 py-1.5 text-xs rounded-sm',
  md:  'px-4 py-2 text-sm rounded-sm',
  lg:  'px-5 py-2.5 text-base rounded-sm',
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  /** 使用 motion 动画（hover/tap scale），默认 true */
  animated?: boolean;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  animated = true,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = [BASE, VARIANTS[variant] ?? VARIANTS['primary'], SIZES[size] ?? SIZES['md'], className].join(' ');
  const isDisabled = disabled || loading;

  if (animated) {
    return (
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        disabled={isDisabled}
        className={cls}
        {...(rest as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? <span className="animate-spin text-xs">⏳</span> : null}
        {children}
      </motion.button>
    );
  }

  return (
    <button disabled={isDisabled} className={cls} {...rest}>
      {loading ? <span className="animate-spin text-xs">⏳</span> : null}
      {children}
    </button>
  );
}
