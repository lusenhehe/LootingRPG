import BattleUnitCardBase from './BattleUnitCardBase';
import type { BattleEnemySnapshot } from '../../types/game';

const percent = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
};

interface EnemyCardProps {
  enemy: BattleEnemySnapshot;
  label?: string;
}
export function EnemyCard({ enemy, label }: EnemyCardProps) {
  return (
    <BattleUnitCardBase className="w-full p-0">
      <div className="relative w-full h-full">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
          {enemy.icon}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 rounded bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-rose-500"
            style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }}
          />
        </div>
      </div>
    </BattleUnitCardBase>
  );
}

export default EnemyCard;
