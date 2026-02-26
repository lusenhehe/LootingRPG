import { ThemeProvider } from './config/themes/ThemeContext';
import { AppShell } from './app/AppShell';
import { GameProvider } from './app/GameContext';

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </ThemeProvider>
  );
}
