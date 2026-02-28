import React from 'react';
import type { WaveStat } from '../types';
interface WaveSummaryRowProps {
  stat: WaveStat;
  /** 是否是最后一波（决定是否显示"通关" label） */
  isFinal: boolean;
}
const getStatusConfig = (survivalRate: number) => {
  if (survivalRate >= 90) return { color: 'text-emerald-400', bar: 'bg-emerald-500', badge: '🟢 安全', badgeCls: 'bg-emerald-900/60 text-emerald-400' };
  if (survivalRate >= 70) return { color: 'text-yellow-400', bar: 'bg-yellow-500', badge: '🟡 危险', badgeCls: 'bg-yellow-900/60 text-yellow-400' };
  if (survivalRate >= 40) return { color: 'text-orange-400', bar: 'bg-orange-500', badge: '🟠 高危', badgeCls: 'bg-orange-900/60 text-orange-400' };
  return { color: 'text-red-400', bar: 'bg-red-500', badge: '🔴 致命', badgeCls: 'bg-red-900/60 text-red-400' };
};

export function WaveSummaryRow({ stat, isFinal }: WaveSummaryRowProps) {
  const cfg = getStatusConfig(stat.survivalRate);
  const hpBarWidth = Math.round(stat.avgHpPct);
  const hpBarColor =
    stat.avgHpPct >= 60
      ? 'bg-emerald-500'
      : stat.avgHpPct >= 30
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-500 transition-colors">
      {/* 波次标题行 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 font-mono shrink-0">
            W{stat.waveIndex + 1}
          </span>
          <span className="text-sm font-medium text-gray-200 truncate">
            {stat.waveLabel}
          </span>
          {isFinal && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 shrink-0">
              终战
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${cfg.badgeCls}`}>
          {cfg.badge}
        </span>
      </div>

      {/* 数据网格 */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="flex flex-col items-center p-1.5 rounded bg-gray-900/60">
          <span className="text-gray-500 mb-0.5">存活率</span>
          <span className={`text-base font-bold ${cfg.color}`}>
            {stat.survivalRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded bg-gray-900/60">
          <span className="text-gray-500 mb-0.5">均值 HP%</span>
          <span className="text-base font-bold text-blue-300">{stat.avgHpPct.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded bg-gray-900/60">
          <span className="text-gray-500 mb-0.5">最低 HP%</span>
          <span className="text-base font-bold text-red-300">{stat.minHpPct.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded bg-gray-900/60">
          <span className="text-gray-500 mb-0.5">最高 HP%</span>
          <span className="text-base font-bold text-emerald-300">{stat.maxHpPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* HP 进度条 */}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-gray-500 w-16 shrink-0">平均余血</span>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden relative">
          {/* 范围背景 */}
          <div
            className="absolute top-0 left-0 h-full bg-gray-600/50 rounded-full"
            style={{ width: `${stat.maxHpPct}%` }}
          />
          {/* 平均值 */}
          <div
            className={`absolute top-0 left-0 h-full ${hpBarColor} rounded-full transition-all`}
            style={{ width: `${hpBarWidth}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-10 text-right shrink-0">
          {stat.avgHpRaw}
        </span>
      </div>
    </div>
  );
}
