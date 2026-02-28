import React, { useState } from 'react';
import type { SimulationReport, SimulatorConfig } from '../types';
import { DEFAULT_MAP_SCALE } from '../../../domains/simulator/model/types';
import { WaveSummaryRow } from './WaveSummaryRow';

interface ResultPanelProps {
  report: SimulationReport;
  config: SimulatorConfig;
  onReset: () => void;
}

const WinRateBadge = ({ rate }: { rate: number }) => {
  const color =
    rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-yellow-400' : rate >= 40 ? 'text-orange-400' : 'text-red-400';
  return <span className={`text-3xl font-black ${color}`}>{rate.toFixed(1)}%</span>;
};

export function ResultPanel({ report, config, onReset }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const scale = config.mapScale;
    const scaleNote =
      scale.hpMult !== 1 || scale.attackMult !== 1 || scale.defenseMult !== 1
        ? `\n地图倍率：HP×${scale.hpMult}  攻击×${scale.attackMult}  防御×${scale.defenseMult}`
        : '';
    const lines: string[] = [
      `=== 战斗模拟报告 ===`,
      `节点：${report.chapterName} / ${report.nodeName}`,
      `玩家：${config.preset.name}（Lv.${config.preset.level}）`,
      `迭代：${report.actualRuns} 次${scaleNote}`,
      `通关率：${report.overallWinRate.toFixed(1)}%`,
      `平均回合：${report.avgTurns}`,
      ``,
      `波次详情：`,
      ...report.waveStats.map(
        (s) =>
          `  ${s.waveLabel}：存活率 ${s.survivalRate.toFixed(1)}%  均HP ${s.avgHpPct.toFixed(1)}%  [${s.minHpPct.toFixed(1)}% ~ ${s.maxHpPct.toFixed(1)}%]`,
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const winRate = report.overallWinRate;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* 总览卡片 */}
      <section className="p-4 rounded-xl bg-gray-800/60 border border-gray-600">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">
              {report.chapterName} / {report.nodeName}
            </div>
            <div className="text-sm text-gray-300 mt-0.5">
              {config.preset.name}（Lv.{config.preset.level}）×{' '}
              <span className="text-blue-300">{report.actualRuns}</span> 次模拟
            </div>
            {/* 地图倍率标注 */}
            {(config.mapScale.hpMult !== DEFAULT_MAP_SCALE.hpMult ||
              config.mapScale.attackMult !== DEFAULT_MAP_SCALE.attackMult ||
              config.mapScale.defenseMult !== DEFAULT_MAP_SCALE.defenseMult) && (
              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                {config.mapScale.hpMult !== 1 && (
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    config.mapScale.hpMult > 1 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
                  }`}>
                    HP×{config.mapScale.hpMult}
                  </span>
                )}
                {config.mapScale.attackMult !== 1 && (
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    config.mapScale.attackMult > 1 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
                  }`}>
                    攻击×{config.mapScale.attackMult}
                  </span>
                )}
                {config.mapScale.defenseMult !== 1 && (
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    config.mapScale.defenseMult > 1 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
                  }`}>
                    防御×{config.mapScale.defenseMult}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-gray-500">通关率</div>
            <WinRateBadge rate={winRate} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-gray-900/60">
            <div className="text-gray-500 mb-1">总波次</div>
            <div className="text-white font-bold text-base">{report.waveStats.length}</div>
          </div>
          <div className="p-2 rounded bg-gray-900/60">
            <div className="text-gray-500 mb-1">平均回合</div>
            <div className="text-white font-bold text-base">{report.avgTurns}</div>
          </div>
          <div className="p-2 rounded bg-gray-900/60">
            <div className="text-gray-500 mb-1">有效运行</div>
            <div className="text-white font-bold text-base">{report.actualRuns}</div>
          </div>
        </div>

        {/* 通关率进度条 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500 w-14 shrink-0">通关率</span>
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                winRate >= 90
                  ? 'bg-emerald-500'
                  : winRate >= 70
                    ? 'bg-yellow-500'
                    : winRate >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-10 text-right">{winRate.toFixed(1)}%</span>
        </div>
      </section>

      {/* 难度趋势图（简化SVG折线） */}
      {report.waveStats.length >= 2 && (
        <section>
          <h3 className="text-sm font-semibold text-purple-400 mb-2 border-b border-gray-700 pb-1">
            📉 HP 趋势（波次平均余血%）
          </h3>
          <HpTrendChart waveStats={report.waveStats} />
        </section>
      )}

      {/* 波次列表 */}
      <section>
        <h3 className="text-sm font-semibold text-blue-400 mb-2 border-b border-gray-700 pb-1">
          ⚔️ 各波次详情
        </h3>
        <div className="flex flex-col gap-2">
          {report.waveStats.map((stat, i) => (
            <WaveSummaryRow
              key={stat.waveId}
              stat={stat}
              isFinal={i === report.waveStats.length - 1}
            />
          ))}
        </div>
      </section>

      {/* 操作按钮 */}
      <div className="flex gap-2 mt-auto pt-2">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white transition-colors text-sm"
        >
          ← 重新配置
        </button>
        <button
          onClick={handleCopy}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            copied
              ? 'bg-emerald-700 text-emerald-200'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {copied ? '✓ 已复制' : '📋 复制结果'}
        </button>
      </div>
    </div>
  );
}

// ─── 简单 SVG 折线趋势图 ────────────────────────────────────────────────────────
interface HpTrendChartProps {
  waveStats: SimulationReport['waveStats'];
}

function HpTrendChart({ waveStats }: HpTrendChartProps) {
  const W = 100;
  const H = 48;
  const PAD = 4;
  const n = waveStats.length;

  if (n < 2) return null;

  const points = waveStats.map((s, i) => ({
    x: PAD + (i / (n - 1)) * (W - PAD * 2),
    y: PAD + ((100 - s.avgHpPct) / 100) * (H - PAD * 2),
    survRate: s.survivalRate,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillPoints = `${points[0].x},${H} ${polyline} ${points[n - 1].x},${H}`;

  return (
    <div className="rounded-lg bg-gray-800/60 border border-gray-700 p-2 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        {/* 参考线 */}
        {[25, 50, 75].map((pct) => (
          <line
            key={pct}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + ((100 - pct) / 100) * (H - PAD * 2)}
            y2={PAD + ((100 - pct) / 100) * (H - PAD * 2)}
            stroke="#374151"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        {/* 面积填充 */}
        <polygon points={fillPoints} fill="rgba(59,130,246,0.15)" />
        {/* 折线 */}
        <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={p.survRate >= 70 ? '#10b981' : p.survRate >= 40 ? '#f59e0b' : '#ef4444'}
          />
        ))}
      </svg>
      <div className="flex justify-between px-1 text-xs text-gray-500 mt-0.5">
        {waveStats.map((s, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
