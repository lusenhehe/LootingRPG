import React, { useState, useMemo, useEffect } from 'react';
import type { PlayerPreset, MapScaleConfig, BaselineOverride } from '../types';
import type { SimulationContext } from '../../../domains/simulator/model/simulationContext';
import type { SimulationDraftState } from '../../../domains/simulator/model/simulationDraftState';
import { buildSimulationContext } from '../../../domains/simulator/model/buildSimulationContext';
import { calcPlayerBaseStats, calcDisplayStats } from '../../../domains/player/model/playerGrowth';
import { DEFAULT_MAP_SCALE } from '../../../domains/simulator/model/types';
import { BASELINE_STATS } from '../../../config/game/monsterSchema';
import { MAP_CHAPTERS } from '../../../domains/map/model/chapters';
import presetsData from '@data/config/simulator/player_presets.json';

const STORAGE_KEY = 'sim_setup_v1';

interface SavedSetup {
  chapterId: string;
  nodeId: string;
  presetId: string;
  useManual: boolean;
  manualLevel: number;
  manualHp: number;
  manualAtk: number;
  manualDef: number;
  manualCrit: number;
  manualLifesteal: number;
  manualThorns: number;
  manualElemental: number;
  manualSpeed: number;
  iterations: number;
  mapScale: MapScaleConfig;
  useBaselineOverride?: boolean;
  baselineOverride?: BaselineOverride;
}

const loadSaved = (): Partial<SavedSetup> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedSetup>) : {};
  } catch {
    return {};
  }
};

const ITERATIONS_OPTIONS = [10, 50, 100, 200, 500] as const;

interface SetupPanelProps {
  onStart: (context: SimulationContext) => void;
  isRunning: boolean;
}

const INITIAL_LEVEL = 10;
const INITIAL_HP    = 480;
const INITIAL_ATK   = 95;
const INITIAL_DEF   = 23;
const INITIAL_CRIT  = 5;

export function SetupPanel({ onStart, isRunning }: SetupPanelProps) {
  const presets: PlayerPreset[] = (presetsData as { presets: PlayerPreset[] }).presets;

  // ── 从 localStorage 恢复上次配置 ────────────────────────────────────────────
  const saved = useMemo(loadSaved, []);

  // ── 选关 ────────────────────────────────────────────────────────────────────
  const [selectedChapterId, setSelectedChapterId] = useState(saved.chapterId ?? MAP_CHAPTERS[0]?.id ?? '');
  const selectedChapter = MAP_CHAPTERS.find((c) => c.id === selectedChapterId);
  const nodes = selectedChapter?.nodes ?? [];
  const [selectedNodeId, setSelectedNodeId] = useState(saved.nodeId ?? nodes[0]?.id ?? '');

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const chapter = MAP_CHAPTERS.find((c) => c.id === chapterId);
    setSelectedNodeId(chapter?.nodes[0]?.id ?? '');
  };

  // ── 预设 ────────────────────────────────────────────────────────────────────
  const [selectedPresetId, setSelectedPresetId] = useState(saved.presetId ?? presets[3]?.id ?? '');
  const [useManual, setUseManual] = useState(saved.useManual ?? false);

  // 手动属性
  const [manualLevel, setManualLevel] = useState(saved.manualLevel ?? INITIAL_LEVEL);
  const [manualHp, setManualHp] = useState(saved.manualHp ?? INITIAL_HP);
  const [manualAtk, setManualAtk] = useState(saved.manualAtk ?? INITIAL_ATK);
  const [manualDef, setManualDef] = useState(saved.manualDef ?? INITIAL_DEF);
  const [manualCrit, setManualCrit] = useState(saved.manualCrit ?? INITIAL_CRIT);
  const [manualLifesteal, setManualLifesteal] = useState(saved.manualLifesteal ?? 0);
  const [manualThorns, setManualThorns] = useState(saved.manualThorns ?? 0);
  const [manualElemental, setManualElemental] = useState(saved.manualElemental ?? 0);
  const [manualSpeed, setManualSpeed] = useState(saved.manualSpeed ?? 0);

  // ── 地图倍率 ─────────────────────────────────────────────────────────────────
  const [hpMult, setHpMult] = useState(saved.mapScale?.hpMult ?? DEFAULT_MAP_SCALE.hpMult);
  const [attackMult, setAttackMult] = useState(saved.mapScale?.attackMult ?? DEFAULT_MAP_SCALE.attackMult);
  const [defenseMult, setDefenseMult] = useState(saved.mapScale?.defenseMult ?? DEFAULT_MAP_SCALE.defenseMult);

  // ── 基线覆盖（可选）────────────────────────────────────────────────────────
  const [useBaselineOverride, setUseBaselineOverride] = useState<boolean>(() => !!saved?.useBaselineOverride);
  const [baselineOverride, setBaselineOverride] = useState<BaselineOverride | undefined>(() => saved?.baselineOverride);

  // ── 迭代次数 ────────────────────────────────────────────────────────────────
  const [iterations, setIterations] = useState<number>(saved.iterations ?? 100);

  // ── 持久化至 localStorage ─────────────────────────────────────────────────────
  useEffect(() => {
    const data: SavedSetup = {
      chapterId: selectedChapterId,
      nodeId: selectedNodeId,
      presetId: selectedPresetId,
      useManual,
      manualLevel, manualHp, manualAtk, manualDef, manualCrit,
      manualLifesteal, manualThorns, manualElemental, manualSpeed,
      iterations,
      mapScale: { hpMult, attackMult, defenseMult },
      useBaselineOverride,
      baselineOverride,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [
    selectedChapterId, selectedNodeId, selectedPresetId, useManual,
    manualLevel, manualHp, manualAtk, manualDef, manualCrit,
    manualLifesteal, manualThorns, manualElemental, manualSpeed,
    iterations, hpMult, attackMult, defenseMult,
    useBaselineOverride, baselineOverride,
  ]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      const base = calcPlayerBaseStats(preset.level);
      const ov = preset.statsOverride ?? {};
      setManualLevel(preset.level);
      setManualHp(ov.hp ?? base.hp);
      setManualAtk(ov.attack ?? base.attack);
      setManualDef(ov.defense ?? base.defense);
      setManualCrit(ov.critRate ?? base.critRate);
      setManualLifesteal(ov.lifesteal ?? base.lifesteal);
      setManualThorns(ov.thorns ?? base.thorns);
      setManualElemental(ov.elemental ?? base.elemental);
      setManualSpeed(ov.attackSpeed ?? base.attackSpeed);
    }
  };


  // ── 当前关卡波次预览 ─────────────────────────────────────────────────────────
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const buildPreset = (): PlayerPreset => {
    if (useManual) {
      return {
        id: 'manual',
        name: '手动配置',
        level: manualLevel,
        statsOverride: {
          hp: manualHp,
          attack: manualAtk,
          defense: manualDef,
          critRate: manualCrit,
          lifesteal: manualLifesteal,
          thorns: manualThorns,
          elemental: manualElemental,
          attackSpeed: manualSpeed,
        },
      };
    }
    return presets.find((p) => p.id === selectedPresetId) ?? presets[0];
  };

  const handleStart = () => {
    if (!selectedChapterId || !selectedNodeId) return;
    const preset = buildPreset();

    const draft = {
      chapterId: selectedChapterId,
      nodeId: selectedNodeId,
      level: preset.level,
      statsOverride: preset.statsOverride,
      hpMult,
      attackMult,
      defenseMult,
      useBaselineOverride,
      baselineOverride: useBaselineOverride ? baselineOverride : undefined,
      iterations,
    } as const;

    const context = buildSimulationContext(draft as SimulationDraftState);
    onStart(context);
  };

  const handleSave = () => {
    const data: SavedSetup = {
      chapterId: selectedChapterId,
      nodeId: selectedNodeId,
      presetId: selectedPresetId,
      useManual,
      manualLevel, manualHp, manualAtk, manualDef, manualCrit,
      manualLifesteal, manualThorns, manualElemental, manualSpeed,
      iterations,
      mapScale: { hpMult, attackMult, defenseMult },
      useBaselineOverride,
      baselineOverride,
    };
    try {
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim_setup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // 忽略保存错误（浏览器安全限制）
    }
  };

  const isScaleDefault =
    hpMult === DEFAULT_MAP_SCALE.hpMult &&
    attackMult === DEFAULT_MAP_SCALE.attackMult &&
    defenseMult === DEFAULT_MAP_SCALE.defenseMult;

  const resetScale = () => {
    setHpMult(DEFAULT_MAP_SCALE.hpMult);
    setAttackMult(DEFAULT_MAP_SCALE.attackMult);
    setDefenseMult(DEFAULT_MAP_SCALE.defenseMult);
  };

  const labelCls = 'block text-xs text-gray-400 mb-1';
  const selectCls =
    'w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500';
  const inputCls =
    'w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white text-right focus:outline-none focus:border-blue-500';

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* 选关卡 */}
      <section>
        <h3 className="text-sm font-semibold text-blue-400 mb-2 border-b border-gray-700 pb-1">
          📍 关卡选择
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>章节</label>
            <select
              className={selectCls}
              value={selectedChapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
            >
              {MAP_CHAPTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.levelRange}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>节点</label>
            <select
              className={selectCls}
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}（Lv.{n.recommendedLevel}）
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedNode && (
          <div className="mt-2 p-2 rounded bg-gray-800/60 border border-gray-700 text-xs text-gray-400">
            <span className="text-gray-300 font-medium">{selectedNode.name}</span>
            {'  '}
            <span className="text-yellow-500">{selectedNode.encounterType.toUpperCase()}</span>
            {'  推荐 Lv.'}
            {selectedNode.recommendedLevel}
            {'  共 '}
            <span className="text-blue-300">{selectedNode.waves?.length ?? 0} 波</span>
            {selectedNode.waves?.map((w, i) => (
              <div key={w.id} className="mt-0.5">
                {i + 1}. {w.label ?? w.id}：{w.monsters.map((m) => m.monsterId).join(' / ')}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 玩家配置 */}
      <section>
        <h3 className="text-sm font-semibold text-green-400 mb-2 border-b border-gray-700 pb-1">
          🧙 玩家属性
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-400">预设</label>
          <select
            className={`${selectCls} flex-1`}
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={useManual}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={useManual}
              onChange={(e) => setUseManual(e.target.checked)}
              className="accent-blue-500"
            />
            手动
          </label>
        </div>

        <div
          className={`grid grid-cols-3 gap-2 transition-opacity ${!useManual ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {[
            { label: '等级', value: manualLevel, setter: setManualLevel, min: 1, max: 30 },
            { label: 'HP', value: manualHp, setter: setManualHp, min: 1, max: 99999 },
            { label: '攻击', value: manualAtk, setter: setManualAtk, min: 1, max: 99999 },
            { label: '防御', value: manualDef, setter: setManualDef, min: 0, max: 9999 },
            { label: '暴击%', value: manualCrit, setter: setManualCrit, min: 0, max: 75 },
            { label: '吸血%', value: manualLifesteal, setter: setManualLifesteal, min: 0, max: 45 },
            { label: '反伤%', value: manualThorns, setter: setManualThorns, min: 0, max: 35 },
            { label: '元素', value: manualElemental, setter: setManualElemental, min: 0, max: 500 },
            { label: '速度', value: manualSpeed, setter: setManualSpeed, min: 0, max: 200 },
          ].map(({ label, value, setter, min, max }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                className={inputCls}
                value={value}
                min={min}
                max={max}
                onChange={(e) => setter(Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        {!useManual && (() => {
          const preset = presets.find((p) => p.id === selectedPresetId);
          const lv = preset?.level ?? 1;
          const displayStats = calcDisplayStats(lv, preset?.statsOverride);
          return (
            <div className="mt-2 grid grid-cols-4 gap-1 text-xs text-gray-400">
              <div>等级：<span className="text-white">{lv}</span></div>
              <div>HP：<span className="text-white">{displayStats.hp}</span></div>
              <div>攻击：<span className="text-white">{displayStats.attack}</span></div>
              <div>防御：<span className="text-white">{displayStats.defense}</span></div>
              {displayStats.critRate > 5 ? <div>暴击：<span className="text-white">{displayStats.critRate}%</span></div> : null}
              {displayStats.lifesteal > 0 ? <div>吸血：<span className="text-white">{displayStats.lifesteal}%</span></div> : null}
              {displayStats.thorns > 0 ? <div>反伤：<span className="text-white">{displayStats.thorns}%</span></div> : null}
            </div>
          );
        })()}
      </section>

      {/* 模拟参数 */}
      <section>
        <h3 className="text-sm font-semibold text-yellow-400 mb-2 border-b border-gray-700 pb-1">
          ⚙️ 模拟参数
        </h3>
        <div>
          <label className={labelCls}>
            迭代次数（更多 = 结果更稳定，但速度更慢）
          </label>
          <div className="flex gap-2">
            {ITERATIONS_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setIterations(n)}
                className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                  iterations === n
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 地图倍率 */}
      <section>
        <h3 className="text-sm font-semibold text-orange-400 mb-2 border-b border-gray-700 pb-1 flex items-center justify-between">
          <span>⚗️ 地图基础数值倍率</span>
          {!isScaleDefault && (
            <button
              onClick={resetScale}
              className="text-xs font-normal text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
            >
              重置
            </button>
          )}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { label: '怪物 HP', value: hpMult, setter: setHpMult, warn: hpMult > 1.5 || hpMult < 0.5 },
            { label: '怪物攻击', value: attackMult, setter: setAttackMult, warn: attackMult > 1.5 || attackMult < 0.5 },
            { label: '怪物防御', value: defenseMult, setter: setDefenseMult, warn: defenseMult > 1.5 || defenseMult < 0.5 },
          ] as { label: string; value: number; setter: (v: number) => void; warn: boolean }[]).map(({ label, value, setter, warn }) => (
            <div key={label}>
              <label className={`block text-xs mb-1 ${warn ? 'text-orange-400' : 'text-gray-400'}`}>
                {label}
                {value !== 1.0 && (
                  <span className={`ml-1 font-bold ${value > 1 ? 'text-red-400' : 'text-green-400'}`}>
                    {value > 1 ? `+${((value - 1) * 100).toFixed(0)}%` : `-${((1 - value) * 100).toFixed(0)}%`}
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                className={`w-full px-2 py-1.5 bg-gray-800 border rounded text-sm text-white text-right focus:outline-none focus:border-orange-500 ${
                  warn ? 'border-orange-600' : 'border-gray-600'
                }`}
                value={value}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) setter(Math.round(v * 100) / 100);
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">1.00 = 原始值，修改后仅影响本次模拟，不改动数据文件</p>
      </section>

      {/* 基线覆盖（可选） */}
      <section>
        <h3 className="text-sm font-semibold text-pink-400 mb-2 border-b border-gray-700 pb-1 flex items-center justify-between">
          <span>🧾 基线覆盖（临时调整怪物成长）</span>
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useBaselineOverride}
              onChange={(e) => {
                const v = e.target.checked;
                setUseBaselineOverride(v);
                if (v && !baselineOverride) {
                  setBaselineOverride({
                    hp: { baseline: BASELINE_STATS.hp.baseline, levelAdder: BASELINE_STATS.hp.levelAdder },
                    attack: { baseline: BASELINE_STATS.attack.baseline, levelAdder: BASELINE_STATS.attack.levelAdder },
                    defense: { baseline: BASELINE_STATS.defense.baseline, levelAdder: BASELINE_STATS.defense.levelAdder },
                  });
                }
              }}
              className="accent-pink-500"
            />
            启用基线覆盖
          </label>
        </div>
        {useBaselineOverride && baselineOverride && (
          <div className="grid grid-cols-3 gap-2">
            {(['hp','attack','defense'] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs text-gray-400 mb-1">基线：{k === 'hp' ? 'HP' : k === 'attack' ? '攻击' : '防御'}</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    className={inputCls}
                    value={baselineOverride[k].baseline}
                    onChange={(e) => {
                      const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      setBaselineOverride({
                        ...baselineOverride,
                        [k]: { ...baselineOverride[k], baseline: v },
                      });
                    }}
                  />
                  <input
                    type="number"
                    className={inputCls}
                    value={baselineOverride[k].levelAdder}
                    onChange={(e) => {
                      const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      setBaselineOverride({
                        ...baselineOverride,
                        [k]: { ...baselineOverride[k], levelAdder: v },
                      });
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">原始：{BASELINE_STATS[k].baseline} + n * {BASELINE_STATS[k].levelAdder}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 开始 / 保存 按钮 */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleSave}
          className="px-3 py-3 rounded-lg font-medium text-sm bg-gray-800 border border-gray-600 text-white hover:bg-gray-700"
          title="导出当前设置为 JSON（不会修改仓库内文件）"
        >
          💾 保存设置
        </button>
        <button
          className={`flex-1 py-3 rounded-lg font-bold text-base transition-all ${
            isRunning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
          }`}
          onClick={handleStart}
          disabled={isRunning || !selectedChapterId || !selectedNodeId}
        >
          {isRunning ? '⏳ 模拟中...' : '▶ 开始模拟'}
        </button>
      </div>
    </div>
  );
}
