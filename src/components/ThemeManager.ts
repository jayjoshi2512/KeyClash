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
    background: "#111111",
    backgroundMuted: "#1a1a1a",
    text: "#d1c7bd", // warm bone white
    textMuted: "#555555", // readable mid-grey (3.8:1 contrast ratio)
    accent: "#e2b714", // warm gold
    accentMuted: "#9a7d0e",
    error: "#e06c75", // soft desaturated rose-red
    errorMuted: "#95444b",
    ghostCaret: "#a78bfa", // lavender ghost
    glassBackground: "rgba(26, 26, 26, 0.45)",
    glassBorder: "rgba(226, 183, 20, 0.08)"
  },
  {
    id: "nord-frost",
    name: "Nord Frost",
    background: "#2e3440",
    backgroundMuted: "#3b4252",
    text: "#eceff4", // frost white
    textMuted: "#727d91", // slate grey
    accent: "#88c0d0", // soft arctic ice blue
    accentMuted: "#5e81ac",
    error: "#bf616a",
    errorMuted: "#8c4a5c",
    ghostCaret: "#b48ead", // arctic pink
    glassBackground: "rgba(59, 66, 82, 0.45)",
    glassBorder: "rgba(136, 192, 208, 0.08)"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    background: "#120e1c", // soft purple-black
    backgroundMuted: "#1f1930",
    text: "#a5f3fc", // warm pastel cyan
    textMuted: "#635380", // readable medium violet-grey
    accent: "#fde047", // soft warm pastel yellow
    accentMuted: "#db2777",
    error: "#f43f5e", // desaturated rose
    errorMuted: "#9d174d",
    ghostCaret: "#34d399", // mint green ghost
    glassBackground: "rgba(31, 25, 48, 0.45)",
    glassBorder: "rgba(253, 224, 71, 0.08)"
  },
  {
    id: "retro-typewriter",
    name: "Retro Typewriter",
    background: "#f4eae1", // vintage warm ivory
    backgroundMuted: "#e8dad0",
    text: "#2b2621", // soft coal black
    textMuted: "#9e8e81", // readable vintage paper brown
    accent: "#9a3412", // terracotta rust
    accentMuted: "#7c2d12",
    error: "#c2410c",
    errorMuted: "#9a3412",
    ghostCaret: "#0369a1", // blue-grey ghost
    glassBackground: "rgba(232, 218, 208, 0.45)",
    glassBorder: "rgba(154, 52, 18, 0.08)"
  },
  {
    id: "matrix-terminal",
    name: "Matrix Terminal",
    background: "#0c100c", // dark forest-black
    backgroundMuted: "#182018",
    text: "#a7f3d0", // soft mint green
    textMuted: "#526c52", // readable pine green
    accent: "#34d399", // gentle emerald green
    accentMuted: "#059669",
    error: "#f87171",
    errorMuted: "#b91c1c",
    ghostCaret: "#38bdf8", // cyber cyan ghost
    glassBackground: "rgba(24, 32, 24, 0.45)",
    glassBorder: "rgba(52, 211, 153, 0.08)"
  },
  {
    id: "sunset-violet",
    name: "Sunset Violet",
    background: "#181326", // calm violet
    backgroundMuted: "#28203f",
    text: "#f5f3ff", // bright lavender silver
    textMuted: "#7c729b", // violet grey
    accent: "#f472b6", // soft pink sunset
    accentMuted: "#be185d",
    error: "#fda4af",
    errorMuted: "#e11d48",
    ghostCaret: "#fb7185", // soft rose ghost
    glassBackground: "rgba(40, 32, 63, 0.45)",
    glassBorder: "rgba(244, 114, 182, 0.08)"
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
