import type { ChangeEvent, RefObject } from 'react';
import type { ActiveTab, BattleRegion, BattleRisk, BattleState, GameState } from '../../types/game';
import { AppHeader } from './AppHeader';
import { GamePanel } from './GamePanel';
import { PlayerPanel } from './PlayerPanel';

interface GameScreenProps {
  gameState: GameState;
  battleState: BattleState;
  activeTab: ActiveTab;
  loading: boolean;
  playerName: string;
  autoBattleEnabled: boolean;
  battleRegion: BattleRegion;
  battleRisk: BattleRisk;
  spawnMultiplier: number;
  autoSellQualities: Record<string, boolean>;
  forgeSelectedId: string | null;
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onExportSave: () => void;
  onImportSave: () => void;
  onLogout: () => void;
  onReset: () => void;
  onSetTab: (tab: ActiveTab) => void;
  onChallengeMonster: () => void;
  onChallengeBoss: () => void;
  onChallengeWave: () => void;
  onToggleAutoBattle: () => void;
  onSetBattleRegion: (region: BattleRegion) => void;
  onSetBattleRisk: (risk: BattleRisk) => void;
  onSetSpawnMultiplier: (value: number) => void;
  onQuickSellByQualityRange: (minQuality: string, maxQuality: string) => void;
  onEquip: (id: string) => void;
  onSell: (id: string) => void;
  onForge: (id: string) => void;
  onToggleAutoSellQuality: (quality: string) => void;
  onReroll: (id: string) => void;
  onSelectForgeItem: (id: string) => void;
  onUnequip: (slot: string) => void;
}

export function GameScreen({
  gameState,
  battleState,
  activeTab,
  loading,
  playerName,
  autoBattleEnabled,
  battleRegion,
  battleRisk,
  spawnMultiplier,
  autoSellQualities,
  forgeSelectedId,
  importInputRef,
  onImportFileChange,
  onExportSave,
  onImportSave,
  onLogout,
  onReset,
  onSetTab,
  onChallengeMonster,
  onChallengeBoss,
  onChallengeWave,
  onToggleAutoBattle,
  onSetBattleRegion,
  onSetBattleRisk,
  onSetSpawnMultiplier,
  onQuickSellByQualityRange,
  onEquip,
  onSell,
  onForge,
  onToggleAutoSellQuality,
  onReroll,
  onSelectForgeItem,
  onUnequip,
}: GameScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-rose-500/15 blur-3xl rounded-full" />

      <div className="relative flex flex-col max-w-6xl mx-auto p-4 md:p-6 gap-6">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportFileChange}
        />

        <AppHeader
          gold={gameState.玩家状态.金币}
          playerName={playerName}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onLogout={onLogout}
          onReset={onReset}
        />

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
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
            autoBattleEnabled={autoBattleEnabled}
            onToggleAutoBattle={onToggleAutoBattle}
            battleRegion={battleRegion}
            battleRisk={battleRisk}
            spawnMultiplier={spawnMultiplier}
            onSetBattleRegion={onSetBattleRegion}
            onSetBattleRisk={onSetBattleRisk}
            onSetSpawnMultiplier={onSetSpawnMultiplier}
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
      </div>
    </div>
  );
}
