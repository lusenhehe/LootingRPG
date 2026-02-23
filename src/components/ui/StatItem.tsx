import type { ReactNode } from 'react';

interface StatItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export function StatItem({ icon, label, value, color = "text-gray-400" }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 uppercase font-bold leading-none mb-1">{label}</span>
        <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );
}
