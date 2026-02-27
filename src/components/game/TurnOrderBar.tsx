/**
 * TurnOrderBar — 回合行动顺序可视化条
 *
 * 展示当前回合内各单位的行动顺序：
 *   玩家先手 → 当前波次存活敌人
 *
 * isActive 规则：
 *   phase === 'player_input' | 'resolving' → 玩家高亮
 *   phase === 'enemy_turn'                 → 敌方高亮
 *   phase === 'finished'                   → 无高亮
 */
import { memo } from 'react';
import { User } from 'lucide-react';
import type { BattleSession } from '../../shared/types/game';
import type { BattleUnitInstance } from '../../types/battle/BattleUnit';

interface TurnOrderBarProps {
  session: BattleSession;
}

const getWaveId = (unit: BattleUnitInstance, index: number): string => {
  const value = unit.meta?.waveId;
  return typeof value === 'string' ? value : `wave-${index + 1}`;
};

function TurnOrderBarInner({ session }: TurnOrderBarProps) {
  const { phase, status } = session;

  const isPlayerActive = phase === 'player_input' || phase === 'resolving';
  const isEnemyActive = phase === 'enemy_turn';

  // 当前波次存活敌人
  const currentWaveId = session.waveOrder[session.currentWaveIndex];
  const waveEnemies = session.enemies.filter(
    (enemy, idx) => getWaveId(enemy, idx) === currentWaveId && enemy.currentHp > 0,
  );

  const phaseLabel =
    status === 'victory'
      ? '⚔️ 胜利'
      : status === 'defeat'
      ? '💀 败北'
      : isPlayerActive
      ? '▶ 玩家行动'
      : isEnemyActive
      ? '⚡ 敌方行动'
      : '—';

  const phaseLabelColor =
    status === 'victory'
      ? 'text-yellow-400'
      : status === 'defeat'
      ? 'text-red-500'
      : isPlayerActive
      ? 'text-indigo-300'
      : isEnemyActive
      ? 'text-red-300'
      : 'text-gray-500';

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-game-border/40 bg-black/30 overflow-x-auto">
      {/* 阶段标签 */}
      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${phaseLabelColor} min-w-[72px]`}>
        {phaseLabel}
      </span>

      <div className="shrink-0 w-px h-6 bg-game-border/30" />

      {/* 玩家节点 */}
      <TurnUnit
        key="player"
        icon={<User className="w-3.5 h-3.5 text-indigo-300" />}
        name={session.player.name || 'Player'}
        hp={session.player.currentHp}
        maxHp={session.player.baseStats.hp}
        isActive={isPlayerActive && status === 'fighting'}
        faction="player"
      />

      {/* 分隔箭头 */}
      {waveEnemies.length > 0 && (
        <span className="shrink-0 text-gray-600 text-xs">→</span>
      )}

      {/* 当前波次敌人节点 */}
      {waveEnemies.map((enemy) => {
        const icon = typeof enemy.meta?.icon === 'string' ? enemy.meta.icon : '👾';
        return (
          <TurnUnit
            key={enemy.id}
            icon={<span className="text-[0.7rem] leading-none">{icon}</span>}
            name={enemy.name}
            hp={enemy.currentHp}
            maxHp={enemy.baseStats.hp}
            isActive={isEnemyActive && status === 'fighting'}
            faction="monster"
          />
        );
      })}

      {/* 波次进度提示 */}
      {session.waveOrder.length > 1 && (
        <span className="ml-auto shrink-0 text-[9px] text-gray-500 whitespace-nowrap">
          Wave {Math.min(session.currentWaveIndex + 1, session.waveOrder.length)}/{session.waveOrder.length}
        </span>
      )}
    </div>
  );
}

// ——— 子组件：单个行动节点 ———
interface TurnUnitProps {
  icon: React.ReactNode;
  name: string;
  hp: number;
  maxHp: number;
  isActive: boolean;
  faction: 'player' | 'monster';
}

function TurnUnit({ icon, name, hp, maxHp, isActive, faction }: TurnUnitProps) {
  const hpRatio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const hpBarColor = faction === 'player' ? 'bg-indigo-500' : 'bg-red-500';
  const ringColor = faction === 'player' ? 'ring-indigo-400' : 'ring-red-400';

  return (
    <div
      className={`flex flex-col items-center gap-0.5 shrink-0 transition-all duration-300 ${
        isActive ? 'scale-110' : 'opacity-60 scale-100'
      }`}
    >
      {/* 单位图标 */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center bg-black/40 border border-game-border/50 transition-all duration-300 ${
          isActive ? `ring-2 ${ringColor} shadow-lg` : ''
        }`}
      >
        {icon}
      </div>

      {/* 名称 */}
      <span
        className="max-w-[44px] truncate text-center text-[8px] leading-none text-gray-400"
        title={name}
      >
        {name}
      </span>

      {/* HP 条 */}
      <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${hpBarColor} transition-all duration-300`}
          style={{ width: `${hpRatio * 100}%` }}
        />
      </div>
    </div>
  );
}

export const TurnOrderBar = memo(TurnOrderBarInner);
export default TurnOrderBar;
