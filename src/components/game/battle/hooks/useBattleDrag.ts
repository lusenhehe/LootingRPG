import { useState, useEffect, useRef, useCallback } from 'react';

export type AttackDrag = { type: 'attack'; x: number; y: number; hoveredEnemyId: string | null };
export type SkillDrag = { type: 'skill'; skillId: string; x: number; y: number; hoveredEnemyId: string | null };
export type DragState = AttackDrag | SkillDrag;

interface UseBattleDragOptions {
  onAttack: (targetId?: string) => void;
  onSkill: ((skillId: string, targetId?: string) => void) | undefined;
  onNoTarget: () => void;
  skillsMeta: Record<string, { targetScope?: string }>;
}

export function useBattleDrag({ onAttack, onSkill, onNoTarget, skillsMeta }: UseBattleDragOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const onSkillRef = useRef(onSkill);
  useEffect(() => { onSkillRef.current = onSkill; }, [onSkill]);

  // 拖拽移动时检测悬停目标
  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: PointerEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const enemyEl = elements.find(
        (el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.enemyId,
      );
      const hovered = enemyEl ? (enemyEl.dataset.enemyId ?? null) : null;
      setDragState((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY, hoveredEnemyId: hovered } : null,
      );
    };

    const onUp = () => {
      setDragState((prev) => {
        if (!prev) return null;
        if (prev.type === 'attack') {
          if (prev.hoveredEnemyId) {
            onAttack(prev.hoveredEnemyId);
          } else {
            onNoTarget();
          }
        } else {
          const meta = skillsMeta[prev.skillId] ?? {};
          const scope = meta.targetScope ?? 'enemy';
          if (scope === 'self') {
            onSkillRef.current?.(prev.skillId, undefined);
          } else if (prev.hoveredEnemyId) {
            onSkillRef.current?.(prev.skillId, prev.hoveredEnemyId);
          } else {
            onNoTarget();
          }
        }
        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, onAttack, onNoTarget, skillsMeta]);

  const startAttackDrag = useCallback((x: number, y: number) => {
    setDragState({ type: 'attack', x, y, hoveredEnemyId: null });
  }, []);

  const startSkillDrag = useCallback((skillId: string, x: number, y: number) => {
    setDragState({ type: 'skill', skillId, x, y, hoveredEnemyId: null });
  }, []);

  return { dragState, setDragState, startAttackDrag, startSkillDrag };
}
