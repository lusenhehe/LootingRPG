import React, { useEffect, useState, memo } from 'react';
import { getEquipmentTemplates } from '../../config/game/equipment';
import type { Equipment } from '../../types/game';
import { createCustomEquipmentByTemplateId } from '../../domains/inventory/services/equipment';
interface DebugPanelProps {
  onAddItems: (items: Equipment[]) => void;
  onOpenSimulator?: () => void;
}
function DebugPanelInner({ onAddItems, onOpenSimulator }: DebugPanelProps) {
  const templates = getEquipmentTemplates();
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [count, setCount] = useState(1);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      if (e.repeat) return;
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) return null;

  const selectedTemplate = templates.find((template) => template.id === templateId) ?? null;

  const handleAdd = () => {
    const n = Math.floor(count);
    if (!templateId) return;
    const items: Equipment[] = [];
    for (let i = 0; i < n; i++) {
      items.push(createCustomEquipmentByTemplateId(templateId, Math.floor(level)));
    }
    onAddItems(items);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-sticky flex flex-col items-end gap-2">
      {onOpenSimulator && (
        <button
          className="px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg shadow-md text-sm transition-colors"
          onClick={onOpenSimulator}
          title="打开战斗模拟器"
        >
          ⚔️ 模拟器
        </button>
      )}
      <button
        className="px-3 py-2 bg-red-800 text-white rounded-lg shadow-md"
        onClick={() => setOpen((v) => !v)}
      >
        Debug
      </button>

      {open && (
        <div className="mt-2 w-64 p-3 bg-game-bg border border-game-border rounded-lg shadow-xl">
          <div className="mb-2 text-sm font-bold">Debug - 添加装备 (显示/隐藏)</div>

          <label className="block text-xs text-gray-400">装备ID</label>
          <select className="w-full mb-2 p-1 bg-transparent border rounded" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.id}</option>
            ))}
          </select>

          {selectedTemplate && (
            <div className="mb-2 text-[11px] text-stone-300 border border-stone-700/50 rounded p-2 bg-black/20">
              <div>名称：{selectedTemplate.nameZh}</div>
              <div>品质：{selectedTemplate.quality}</div>
              <div>部位：{selectedTemplate.slot}</div>
            </div>
          )}

          <label className="block text-xs text-gray-400">数量</label>
          <input className="w-full mb-2 p-1 bg-transparent border rounded" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />

          <label className="block text-xs text-gray-400">等级</label>
          <input className="w-full mb-3 p-1 bg-transparent border rounded" type="number" min={1} max={999} value={level} onChange={(e) => setLevel(Number(e.target.value))} />

          <div className="flex gap-2">
            <button className="flex-1 py-1 bg-green-600 text-white rounded" onClick={handleAdd}>添加</button>
            <button className="flex-1 py-1 bg-gray-600 text-white rounded" onClick={() => setOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

export const DebugPanel = memo(DebugPanelInner);

export default DebugPanel;
