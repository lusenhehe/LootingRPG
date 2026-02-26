import { LoginScreen } from '../components/auth/LoginScreen';
import { GameScreen }  from '../components/game/GameScreen';
import { useGame }     from './GameContext';

export function AppShell() {
  const {
    profiles,
    activeProfileId,
    isAuthenticated,
    gameState,
    loading,
    activeTab,
    autoSellQualities,
    forgeSelectedId,
    mapProgress,
    focusMapNode,
    setActiveTab,
    setMapProgress,
    setFocusMapNode,
    setForgeSelectedId,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    handleLogoutAction,
    handleReset,
    handleEnterMapNode,
    handleBattleAttack,
    handleBattleRetreat,
    handleToggleAutoSellQuality,
    quickSellByQualityRange,
    handleEquip,
    handleSell,
    handleForge,
    handleReroll,
    handleUnequip,
    handleDebugAddItems,
  } = useGame();

  if (!isAuthenticated) {
    return (
      <LoginScreen
        profiles={profiles}
        onLogin={handleLogin}
        onCreate={handleCreateProfile}
        onDelete={handleDeleteProfile}
      />
    );
  }

  const currentProfile = profiles.find((profile: import('../shared/types/game').SaveProfile) => profile.id === activeProfileId);

  return (
    <GameScreen
      gameState={gameState}
      activeTab={activeTab}
      loading={loading}
      playerName={currentProfile?.name || 'Unknown Player'}
      autoSellQualities={autoSellQualities}
      forgeSelectedId={forgeSelectedId}
      battleSession={gameState.battle.activeSession}
      playerStats={gameState.playerStats}
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
      onLogout={handleLogoutAction}
      onReset={handleReset}
      mapProgress={mapProgress}
      onSelectMapChapter={(chapterId) => {
        setMapProgress((prev: import('../shared/types/game').MapProgressState) => ({ ...prev, selectedChapterId: chapterId }));
      }}
      focusMapNode={focusMapNode}
      onClearFocusMapNode={() => setFocusMapNode(null)}
      onSetTab={setActiveTab}
      onEnterMapNode={handleEnterMapNode}
      onBattleAttack={handleBattleAttack}
      onBattleRetreat={handleBattleRetreat}
      onQuickSellByQualityRange={quickSellByQualityRange}
      onEquip={handleEquip}
      onSell={handleSell}
      onForge={handleForge}
      onToggleAutoSellQuality={handleToggleAutoSellQuality}
      onReroll={handleReroll}
      onSelectForgeItem={setForgeSelectedId}
      onUnequip={handleUnequip}
      onDebugAddItems={handleDebugAddItems}
    />
  );
}
