export type Theme = {
  name: string;

  PRIMARY: string;
  DARK: string;
  LIGHT: string;
};

const themes: Record<string, Theme> = {
  blue: {
    name: "blue",
    PRIMARY: "#006B97",
    DARK: "#08506D",
    LIGHT: "#DCF5FF",
  },
  red: {
    name: "red",
    PRIMARY: "#E34432",
    DARK: "#D87367",
    LIGHT: "#FDD5D1",
  },
  green: {
    name: "green",
    PRIMARY: "#04AC6B",
    DARK: "#02623D",
    LIGHT: "#D2F5E8",
  },
  purple: {
    name: "purple",
    PRIMARY: "#A259FF",
    DARK: "#420096",
    LIGHT: "#F1E5FF",
  },
};

export function getTheme(theme: string): Theme {
  return themes[theme] || themes.green;
}

export function getRandomTheme(): Theme {
  const themeNames = Object.keys(themes);
  return getTheme(themeNames[Math.floor(Math.random() * themeNames.length)]);
}
