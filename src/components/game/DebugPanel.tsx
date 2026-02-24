import React, { useEffect, useState } from 'react';
import { QUALITIES, SLOTS } from '../../config/game/equipment';
import type { Equipment } from '../../types/game';
import { createCustomEquipment } from '../../logic/equipment';

interface DebugPanelProps {
  onAddItems: (items: Equipment[]) => void;
}

export function DebugPanel({ onAddItems }: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [quality, setQuality] = useState(QUALITIES[0] || 'common');
  const [slot, setSlot] = useState(SLOTS[0] || 'weapon');
  const [count, setCount] = useState(1);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAdd = () => {
    const n = Math.max(1, Math.min(100, Math.floor(count)));
    const items: Equipment[] = [];
    for (let i = 0; i < n; i++) {
      items.push(createCustomEquipment(quality, slot, Math.max(1, Math.floor(level)), false));
    }
    onAddItems(items);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="px-3 py-2 bg-red-800 text-white rounded-lg shadow-md"
        onClick={() => setOpen((v) => !v)}
      >
        Debug
      </button>

      {open && (
        <div className="mt-2 w-64 p-3 bg-game-bg border border-game-border rounded-lg shadow-xl">
          <div className="mb-2 text-sm font-bold">Debug - 添加装备 (Ctrl+D)</div>

          <label className="block text-xs text-gray-400">品质</label>
          <select className="w-full mb-2 p-1 bg-transparent border rounded" value={quality} onChange={(e) => setQuality(e.target.value)}>
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <label className="block text-xs text-gray-400">部位</label>
          <select className="w-full mb-2 p-1 bg-transparent border rounded" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

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

export default DebugPanel;
