import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Theme, ThemeContextValue } from './types';
import DarkScareTheme from './DarkScare.json';
import ArcaneMysticTheme from './ArcaneMystic.json';

const themes: Theme[] = [DarkScareTheme, ArcaneMysticTheme];

const STORAGE_KEY = 'game-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark-scare';
  } catch {
    return 'dark-scare';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<string>(getStoredTheme);
  const [theme, setTheme] = useState<Theme>(() => {
    return themes.find(t => t.id === currentThemeId) || themes[0];
  });

  const setThemeById = useCallback((themeId: string) => {
    const found = themes.find(t => t.id === themeId);
    if (found) {
      setCurrentThemeId(themeId);
      setTheme(found);
        localStorage.setItem(STORAGE_KEY, themeId);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-game-bg', theme.colors.gameBg);
    root.style.setProperty('--color-game-card', theme.colors.gameCard);
    root.style.setProperty('--color-game-border', theme.colors.gameBorder);
    root.style.setProperty('--color-game-accent', theme.colors.gameAccent);
    root.style.setProperty('--color-game-cta', theme.colors.gameCta);
    root.style.setProperty('--color-quality-common', theme.colors.quality.common);
    root.style.setProperty('--color-quality-uncommon', theme.colors.quality.uncommon);
    root.style.setProperty('--color-quality-rare', theme.colors.quality.rare);
    root.style.setProperty('--color-quality-epic', theme.colors.quality.epic);
    root.style.setProperty('--color-quality-legendary', theme.colors.quality.legendary);
    root.style.setProperty('--color-quality-mythic', theme.colors.quality.mythic);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeById, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
