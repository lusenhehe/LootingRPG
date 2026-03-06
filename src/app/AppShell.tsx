import { useState } from 'react';
import { LoginScreen } from '../components/auth/LoginScreen';
import { GameScreen }  from '../components/game/GameScreen';
import { useAuthContext } from './context/auth';
import { BattleSimulatorPage } from '../tools/BattleSimulator/BattleSimulatorPage';

export function AppShell() {
  const [showSimulator, setShowSimulator] = useState(false);
  const {
    profiles,
    activeProfileId,
    isAuthenticated,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
  } = useAuthContext();

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

  return (
    <>
      <GameScreen onOpenSimulator={() => setShowSimulator(true)} />
      {showSimulator && (
        <BattleSimulatorPage onClose={() => setShowSimulator(false)} />
      )}
    </>
  );
}
