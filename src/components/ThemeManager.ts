export interface Theme {
  id: string;
  name: string;
  background: string;
  backgroundMuted: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  error: string;
  errorMuted: string;
  ghostCaret: string;
  glassBackground: string;
  glassBorder: string;
}

export const THEMES: Theme[] = [
  {
    id: "creamy-obsidian",
    name: "Creamy Obsidian",
    background: "#151515",
    backgroundMuted: "#1f1f1f",
    text: "#e1dcd3",
    textMuted: "#646669",
    accent: "#e2b714",
    accentMuted: "#a0810d",
    error: "#ca4754",
    errorMuted: "#7e2e37",
    ghostCaret: "#a855f7", // purple ghost caret
    glassBackground: "rgba(31, 31, 31, 0.45)",
    glassBorder: "rgba(226, 183, 20, 0.08)"
  },
  {
    id: "nord-frost",
    name: "Nord Frost",
    background: "#2e3440",
    backgroundMuted: "#3b4252",
    text: "#d8dee9",
    textMuted: "#4c566a",
    accent: "#88c0d0",
    accentMuted: "#5e81ac",
    error: "#bf616a",
    errorMuted: "#8c4a5c",
    ghostCaret: "#b48ead", // frost pink ghost
    glassBackground: "rgba(59, 66, 82, 0.45)",
    glassBorder: "rgba(136, 192, 208, 0.08)"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    background: "#08020f",
    backgroundMuted: "#17082c",
    text: "#00f0ff",
    textMuted: "#6b0080",
    accent: "#fcee0a",
    accentMuted: "#ff007f",
    error: "#ff003c",
    errorMuted: "#80001f",
    ghostCaret: "#00ff66", // green ghost
    glassBackground: "rgba(23, 8, 44, 0.45)",
    glassBorder: "rgba(252, 238, 10, 0.08)"
  },
  {
    id: "retro-typewriter",
    name: "Retro Typewriter",
    background: "#f4ede8",
    backgroundMuted: "#e8ded6",
    text: "#353535",
    textMuted: "#a09890",
    accent: "#a92b2b",
    accentMuted: "#7a1e1e",
    error: "#b24c4c",
    errorMuted: "#8b3535",
    ghostCaret: "#4a7a8c", // blue-grey ghost
    glassBackground: "rgba(232, 222, 214, 0.45)",
    glassBorder: "rgba(169, 43, 43, 0.08)"
  },
  {
    id: "matrix-terminal",
    name: "Matrix Terminal",
    background: "#040804",
    backgroundMuted: "#0d1a0d",
    text: "#4af626",
    textMuted: "#164e0f",
    accent: "#00ff00",
    accentMuted: "#008800",
    error: "#ff3333",
    errorMuted: "#aa0000",
    ghostCaret: "#00ffff", // cyan ghost
    glassBackground: "rgba(13, 26, 13, 0.45)",
    glassBorder: "rgba(0, 255, 0, 0.08)"
  },
  {
    id: "sunset-violet",
    name: "Sunset Violet",
    background: "#18122b",
    backgroundMuted: "#2d1b4e",
    text: "#e4d0d0",
    textMuted: "#635985",
    accent: "#ff007f",
    accentMuted: "#b30059",
    error: "#ff5757",
    errorMuted: "#a12b2b",
    ghostCaret: "#fcee0a", // yellow ghost
    glassBackground: "rgba(45, 27, 78, 0.45)",
    glassBorder: "rgba(255, 0, 127, 0.08)"
  }
];

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.background);
  root.style.setProperty("--bg-muted", theme.backgroundMuted);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-muted", theme.accentMuted);
  root.style.setProperty("--error", theme.error);
  root.style.setProperty("--error-muted", theme.errorMuted);
  root.style.setProperty("--ghost-caret", theme.ghostCaret);
  root.style.setProperty("--glass-bg", theme.glassBackground);
  root.style.setProperty("--glass-border", theme.glassBorder);
};
export { };
