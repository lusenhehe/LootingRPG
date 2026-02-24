import type { ActiveTab, BattleState, GameState } from '../../types/game';
import type { MapProgressState } from '../../types/game';
import type { MapChapterDef, MapNodeDef } from '../../config/map/mapTypes';
import { AppHeader } from './AppHeader';
import { GamePanel } from './GamePanel';
import { PlayerPanel } from './PlayerPanel';
import DebugPanel from './DebugPanel';

interface GameScreenProps {
  gameState: GameState;
  battleState: BattleState;
  activeTab: ActiveTab;
  loading: boolean;
  playerName: string;
  /** current player stats summary used by header */
  playerStats: import('../../types/game').PlayerStats;
  autoBattleEnabled: boolean;
  autoSellQualities: Record<string, boolean>;
  forgeSelectedId: string | null;
  mapProgress: MapProgressState;
  onExportSave: () => void;
  onImportSave: () => void;
  onLogout: () => void;
  onReset: () => void;
  onSetTab: (tab: ActiveTab) => void;
  onChallengeMonster: () => void;
  onChallengeBoss: () => void;
  onChallengeWave: () => void;
  onEnterMapNode: (node: MapNodeDef, chapter: MapChapterDef) => void;
  onSelectMapChapter: (chapterId: string) => void;
  onToggleAutoBattle: () => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string) => void;
  onSelectForgeItem: (id: string) => void;
  onUnequip: (slot: string) => void;
  onDebugAddItems?: (quality: string, slot: string, count: number, level?: number) => void;
}

export function GameScreen({
  gameState,
  battleState,
  activeTab,
  loading,
  playerName,
  autoBattleEnabled,
  autoSellQualities,
  forgeSelectedId,
  mapProgress,
  onExportSave,
  onImportSave,
  onLogout,
  onReset,
  onSetTab,
  onChallengeMonster,
  onChallengeBoss,
  onChallengeWave,
  onEnterMapNode,
  onSelectMapChapter,
  onToggleAutoBattle,
  onQuickSellByQualityRange,
  onEquip,
  onSell,
  onForge,
  onToggleAutoSellQuality,
  onReroll,
  onSelectForgeItem,
  onUnequip,
  onDebugAddItems,
}: GameScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-rose-500/15 blur-3xl rounded-full" />

      <div className="relative flex flex-col max-w-6xl mx-auto p-4 md:p-6 gap-6">

        <AppHeader
          gold={gameState.playerStats.gold}
          playerName={playerName}
          playerStats={gameState.playerStats}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onLogout={onLogout}
          onReset={onReset}
        />

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <PlayerPanel gameState={gameState} onUnequip={onUnequip} />
          <GamePanel
            gameState={gameState}
            battleState={battleState}
            activeTab={activeTab}
            loading={loading}
            onSetTab={onSetTab}
            onChallengeMonster={onChallengeMonster}
            onChallengeBoss={onChallengeBoss}
            onChallengeWave={onChallengeWave}
            onEnterMapNode={onEnterMapNode}
            mapProgress={mapProgress}
            onSelectMapChapter={onSelectMapChapter}
            autoBattleEnabled={autoBattleEnabled}
            onToggleAutoBattle={onToggleAutoBattle}
            onQuickSellByQualityRange={onQuickSellByQualityRange}
            onEquip={onEquip}
            onSell={onSell}
            onForge={onForge}
            autoSellQualities={autoSellQualities}
            onToggleAutoSellQuality={onToggleAutoSellQuality}
            onReroll={onReroll}
            forgeSelectedId={forgeSelectedId}
            onSelectForgeItem={onSelectForgeItem}
          />
        </main>
        <DebugPanel onAddItems={(items) => {
          // forward to parent via optional callback (preserve item level)
          if (onDebugAddItems) {
            items.forEach((it) => onDebugAddItems(it.quality, it.slot, 1, it.level));
          }
        }} />
      </div>
    </div>
  );
}
