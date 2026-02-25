import React from 'react';

interface BaseCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function BaseCard({ title, subtitle, className = '', children, footer }: BaseCardProps) {
  return (
    <div className={`rounded-2xl border border-game-border/60 bg-black/20 p-4 flex flex-col ${className}`}>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <div className="text-sm font-semibold text-white">{title}</div>}
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-3 text-xs text-gray-400">{footer}</div>}
    </div>
  );
}

export default BaseCard;
