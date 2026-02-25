import { ThemeProvider } from './config/themes/ThemeContext';
import { AppShell } from './app/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
