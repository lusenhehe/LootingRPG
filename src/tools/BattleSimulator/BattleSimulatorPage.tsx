import React, { useState, useCallback } from 'react';
import type { SimulatorConfig, SimulationReport } from './types';
import { SetupPanel } from './components/SetupPanel';
import { ResultPanel } from './components/ResultPanel';
import { runSimulationAsync } from '../../domains/simulator/services/runSimulation';

interface BattleSimulatorPageProps {
  onClose: () => void;
}

type PageState = 'setup' | 'running' | 'result';

export function BattleSimulatorPage({ onClose }: BattleSimulatorPageProps) {
  const [pageState, setPageState] = useState<PageState>('setup');
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [lastConfig, setLastConfig] = useState<SimulatorConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async (config: SimulatorConfig) => {
    setLastConfig(config);
    setError(null);
    setPageState('running');

    try {
      const result = await runSimulationAsync(config);
      setReport(result);
      setPageState('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPageState('setup');
    }
  }, []);

  const handleReset = useCallback(() => {
    setPageState('setup');
    setReport(null);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-950 text-white">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-blue-400">⚔️ 战斗模拟器</span>
          <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-400 font-medium">
            Dev Tool
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pageState === 'result' && report && (
            <span className="text-xs text-gray-400">
              {report.chapterName} / {report.nodeName} · {report.actualRuns} 次
            </span>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          >
            ✕ 关闭
          </button>
        </div>
      </header>

      {/* 步骤指示器 */}
      <div className="flex items-center px-4 py-2 bg-gray-900/50 border-b border-gray-800 gap-4 shrink-0">
        <StepIndicator step={1} label="配置" active={pageState === 'setup'} done={pageState !== 'setup'} />
        <div className="h-px flex-1 bg-gray-700" />
        <StepIndicator step={2} label="运行中" active={pageState === 'running'} done={pageState === 'result'} />
        <div className="h-px flex-1 bg-gray-700" />
        <StepIndicator step={3} label="结果" active={pageState === 'result'} done={false} />
      </div>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {pageState === 'setup' && (
          <div className="h-full max-w-2xl mx-auto p-4">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
                ⚠️ 模拟失败：{error}
              </div>
            )}
            <SetupPanel onStart={handleStart} isRunning={false} />
          </div>
        )}

        {pageState === 'running' && lastConfig && (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-blue-800 border-t-blue-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">⚔️</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-lg">模拟战斗中...</p>
              <p className="text-gray-400 text-sm mt-1">
                {lastConfig.chapterId} / {lastConfig.nodeId} · {lastConfig.iterations} 次迭代
              </p>
              <p className="text-gray-500 text-xs mt-1">正在运行 BattleEngine，请稍候</p>
            </div>
          </div>
        )}

        {pageState === 'result' && report && lastConfig && (
          <div className="h-full max-w-2xl mx-auto p-4">
            <ResultPanel report={report} config={lastConfig} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* 底部说明 */}
      <footer className="px-4 py-2 bg-gray-900/30 border-t border-gray-800 shrink-0">
        <p className="text-xs text-gray-600 text-center">
          模拟器使用真实 BattleEngine 计算，数值来自 ChapterData.json / monsters.json · 结果仅供数值调控参考
        </p>
      </footer>
    </div>
  );
}

// ─── 步骤指示器 ────────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  done: boolean;
}

function StepIndicator({ step, label, active, done }: StepIndicatorProps) {
  const circleClass = done
    ? 'bg-emerald-600 text-white'
    : active
      ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
      : 'bg-gray-800 text-gray-500';
  const labelClass = active ? 'text-white' : done ? 'text-emerald-400' : 'text-gray-500';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${circleClass}`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-xs font-medium ${labelClass}`}>{label}</span>
    </div>
  );
}
