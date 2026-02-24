export interface ThemeColors {
  gameBg: string;
  gameCard: string;
  gameBorder: string;
  gameAccent: string;
  gameCta: string;
  quality: {
    common: string;
    uncommon: string;
    rare: string;
    epic: string;
    legendary: string;
    mythic: string;
  };
}

export interface ThemeGradients {
  body: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  gradients: ThemeGradients;
}

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}
