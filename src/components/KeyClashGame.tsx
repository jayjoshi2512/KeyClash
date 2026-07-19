"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./KeyClashGame.module.css";
import { soundManager, SwitchType } from "./SoundManager";
import { PASSAGES, getRandomPassage, Passage } from "./WordList";
import { THEMES, Theme, applyTheme } from "./ThemeManager";

interface Keystroke {
  key: string;
  dt: number;
}

export default function KeyClashGame() {
  // Config States
  const [themeId, setThemeId] = useState<string>("creamy-obsidian");
  const [switchType, setSwitchType] = useState<SwitchType>("creamy");
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<string>("general");

  // Game States
  const [passage, setPassage] = useState<Passage>(PASSAGES[0]);
  const [typedText, setTypedText] = useState<string>("");
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Time metrics
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);

  // Ghost States
  const [ghostActive, setGhostActive] = useState<boolean>(false);
  const [ghostKeystrokes, setGhostKeystrokes] = useState<Keystroke[]>([]);
  const [ghostTypedText, setGhostTypedText] = useState<string>("");
  const [ghostWpm, setGhostWpm] = useState<number>(0);
  const [ghostAccuracy, setGhostAccuracy] = useState<number>(100);
  const [ghostCompleted, setGhostCompleted] = useState<boolean>(false);

  // History for charts
  const [playerWpmHistory, setPlayerWpmHistory] = useState<{ second: number; wpm: number }[]>([]);
  const [ghostWpmHistory, setGhostWpmHistory] = useState<{ second: number; wpm: number }[]>([]);

  // Caret Styles
  const [caretStyle, setCaretStyle] = useState<React.CSSProperties>({ left: 0, top: 0, height: 24, opacity: 0 });
  const [ghostCaretStyle, setGhostCaretStyle] = useState<React.CSSProperties>({ left: 0, top: 0, height: 24, opacity: 0 });

  // Modal States
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>("");

  // Sharing Feedback
  const [copyFeedback, setCopyFeedback] = useState<string>("Copy Duel Link");

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ghostIndexRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs for interval calculations
  const typedTextRef = useRef(typedText);
  const ghostTypedTextRef = useRef(ghostTypedText);
  useEffect(() => { typedTextRef.current = typedText; }, [typedText]);
  useEffect(() => { ghostTypedTextRef.current = ghostTypedText; }, [ghostTypedText]);

  // Serialization Helper
  const serializeKeystrokes = (strokes: Keystroke[]): string => {
    return strokes
      .map(k => `${encodeURIComponent(k.key)},${k.dt}`)
      .join(";");
  };

  const deserializeKeystrokes = (str: string): Keystroke[] => {
    if (!str) return [];
    return str.split(";").map(part => {
      const [keyEscaped, dtStr] = part.split(",");
      return {
        key: decodeURIComponent(keyEscaped || ""),
        dt: parseInt(dtStr || "0", 10)
      };
    });
  };

  // Base64 helper for custom passages
  const encodeBase64 = (str: string): string => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch {
      return "";
    }
  };

  const decodeBase64 = (str: string): string => {
    try {
      return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch {
      return "";
    }
  };

  const calculateCorrectChars = (typed: string, target: string): number => {
    let correct = 0;
    const limit = Math.min(typed.length, target.length);
    for (let i = 0; i < limit; i++) {
      if (typed[i] === target[i]) {
        correct++;
      }
    }
    return correct;
  };

  // Update Caret Positions
  const updateCarets = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update Player Caret
    const playerActiveSpan = container.querySelector(`[data-index="${typedText.length}"]`) as HTMLElement;
    if (playerActiveSpan) {
      setCaretStyle({
        transform: `translate3d(${playerActiveSpan.offsetLeft}px, ${playerActiveSpan.offsetTop + 4}px, 0)`,
        height: playerActiveSpan.offsetHeight - 8,
        opacity: isCompleted ? 0 : 1
      });
    } else {
      const lastSpan = container.querySelector(`[data-index="${passage.text.length - 1}"]`) as HTMLElement;
      if (lastSpan) {
        setCaretStyle({
          transform: `translate3d(${lastSpan.offsetLeft + lastSpan.offsetWidth}px, ${lastSpan.offsetTop + 4}px, 0)`,
          height: lastSpan.offsetHeight - 8,
          opacity: isCompleted ? 0 : 1
        });
      }
    }

    // Update Ghost Caret
    if (ghostActive) {
      const ghostActiveSpan = container.querySelector(`[data-index="${ghostTypedText.length}"]`) as HTMLElement;
      if (ghostActiveSpan) {
        setGhostCaretStyle({
          transform: `translate3d(${ghostActiveSpan.offsetLeft}px, ${ghostActiveSpan.offsetTop + 4}px, 0)`,
          height: ghostActiveSpan.offsetHeight - 8,
          opacity: ghostCompleted ? 0 : 0.8
        });
      } else {
        const lastSpan = container.querySelector(`[data-index="${passage.text.length - 1}"]`) as HTMLElement;
        if (lastSpan) {
          setGhostCaretStyle({
            transform: `translate3d(${lastSpan.offsetLeft + lastSpan.offsetWidth}px, ${lastSpan.offsetTop + 4}px, 0)`,
            height: lastSpan.offsetHeight - 8,
            opacity: ghostCompleted ? 0 : 0.8
          });
        }
      }
    }
  }, [typedText, ghostTypedText, passage, ghostActive, isCompleted, ghostCompleted]);

  // Trigger Caret Position calculations
  useEffect(() => {
    updateCarets();
    window.addEventListener("resize", updateCarets);
    return () => window.removeEventListener("resize", updateCarets);
  }, [updateCarets]);

  // Apply visual theme settings
  useEffect(() => {
    soundManager.setSwitchType(switchType);
  }, [switchType]);

  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  // Recursive Ghost Replayer
  const startGhostReplay = useCallback(() => {
    if (!ghostActive || ghostKeystrokes.length === 0) return;

    if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
    ghostIndexRef.current = 0;
    setGhostTypedText("");
    setGhostCompleted(false);

    const runNext = () => {
      const idx = ghostIndexRef.current;
      if (idx >= ghostKeystrokes.length) {
        setGhostCompleted(true);
        return;
      }

      const stroke = ghostKeystrokes[idx];
      ghostTimeoutRef.current = setTimeout(() => {
        setGhostTypedText(prev => {
          if (stroke.key === "Backspace") {
            return prev.slice(0, -1);
          } else {
            return prev + stroke.key;
          }
        });

        ghostIndexRef.current = idx + 1;
        runNext();
      }, stroke.dt);
    };

    runNext();
  }, [ghostActive, ghostKeystrokes]);

  // Main game reset
  const resetGame = useCallback((newPassage = false, categorySelected?: string) => {
    if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);

    setTypedText("");
    setGhostTypedText("");
    setIsStarted(false);
    setIsCompleted(false);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setSecondsElapsed(0);
    setPlayerWpmHistory([]);
    setGhostWpmHistory([]);
    setGhostCompleted(false);
    setCopyFeedback("Copy Duel Link");

    if (newPassage) {
      // Clear url search params (enter solo mode)
      window.history.pushState({}, "", window.location.pathname);
      setGhostActive(false);
      setGhostKeystrokes([]);
      setGhostWpm(0);
      setGhostAccuracy(0);

      const nextPassage = getRandomPassage(categorySelected || currentCategory);
      setPassage(nextPassage);
    } else {
      // Restarting the same duel/solo passage
      if (ghostActive) {
        // Reset ghost text representation, ready to run when player starts
      }
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        setIsFocused(true);
      }
    }, 50);
  }, [ghostActive, currentCategory]);

  // Run URL search params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const pParam = searchParams.get("p");
    const cParam = searchParams.get("c");
    const gParam = searchParams.get("g");
    const wParam = searchParams.get("w");
    const aParam = searchParams.get("a");

    let selectedPassage = PASSAGES[0];
    let isGhost = false;
    let ghostStrokes: Keystroke[] = [];
    let ghostWpmVal = 0;
    let ghostAccVal = 100;

    if (cParam) {
      const decodedText = decodeBase64(cParam);
      if (decodedText) {
        selectedPassage = {
          id: -1,
          text: decodedText,
          source: "Custom Challenge",
          category: "general"
        };
      }
    } else if (pParam) {
      const pIdx = parseInt(pParam, 10);
      if (!isNaN(pIdx) && pIdx >= 0 && pIdx < PASSAGES.length) {
        selectedPassage = PASSAGES[pIdx];
      }
    } else {
      selectedPassage = getRandomPassage("general");
    }

    if (gParam) {
      const strokes = deserializeKeystrokes(gParam);
      if (strokes.length > 0) {
        isGhost = true;
        ghostStrokes = strokes;
        ghostWpmVal = wParam ? parseInt(wParam, 10) : 0;
        ghostAccVal = aParam ? parseFloat(aParam) : 100;
      }
    }

    setPassage(selectedPassage);
    setGhostActive(isGhost);
    setGhostKeystrokes(ghostStrokes);
    setGhostWpm(ghostWpmVal);
    setGhostAccuracy(ghostAccVal);

    // Theme and sound presets
    const savedTheme = localStorage.getItem("keyclash-theme") || "creamy-obsidian";
    setThemeId(savedTheme);
    const th = THEMES.find(t => t.id === savedTheme) || THEMES[0];
    applyTheme(th);

    const savedSwitch = localStorage.getItem("keyclash-switch") || "creamy";
    setSwitchType(savedSwitch as SwitchType);

    const savedVol = localStorage.getItem("keyclash-volume");
    if (savedVol !== null) setVolume(parseFloat(savedVol));

    const savedMuted = localStorage.getItem("keyclash-muted");
    if (savedMuted !== null) setIsMuted(savedMuted === "true");

    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 150);
  }, []);

  // Timer interval for updating chart history
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStarted && !isCompleted) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => {
          const nextSec = prev + 1;
          const elapsedMinutes = nextSec / 60;

          // Player WPM
          const playerTyped = typedTextRef.current;
          const playerCorrect = calculateCorrectChars(playerTyped, passage.text);
          const pWpm = elapsedMinutes > 0 ? Math.round((playerCorrect / 5) / elapsedMinutes) : 0;

          // Ghost WPM
          let gWpm = 0;
          if (ghostActive) {
            const ghostTyped = ghostTypedTextRef.current;
            const ghostCorrect = calculateCorrectChars(ghostTyped, passage.text);
            gWpm = elapsedMinutes > 0 ? Math.round((ghostCorrect / 5) / elapsedMinutes) : 0;
          }

          setPlayerWpmHistory(prevHist => [...prevHist, { second: nextSec, wpm: pWpm }]);
          if (ghostActive) {
            setGhostWpmHistory(prevHist => [...prevHist, { second: nextSec, wpm: gWpm }]);
          }

          return nextSec;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, isCompleted, passage, ghostActive]);

  // Tab reset shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        resetGame(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [resetGame]);

  // Handle key typing changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCompleted) return;

    const value = e.target.value;
    if (value.length > passage.text.length) return;

    // Handle isTyping state
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    const isBackspace = value.length < typedText.length;
    let keyName = "";
    if (isBackspace) {
      keyName = "Backspace";
    } else {
      keyName = value[value.length - 1] || "";
    }

    const now = Date.now();

    if (!isStarted && value.length > 0) {
      setIsStarted(true);
      setStartTime(now);
      setLastKeyTime(now);
      setSecondsElapsed(0);
      setKeystrokes([{ key: keyName, dt: 0 }]);

      if (ghostActive && ghostKeystrokes.length > 0) {
        startGhostReplay();
      }
    } else if (isStarted) {
      const dt = now - lastKeyTime;
      setLastKeyTime(now);
      setKeystrokes(prev => [...prev, { key: keyName, dt }]);
    }

    setTypedText(value);

    // Finish test when text completed
    if (value.length === passage.text.length) {
      setIsCompleted(true);
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setEndTime(now);

      // Append final fractional data point to charts
      const finalSec = (now - (startTime || now)) / 1000;
      const finalMinutes = finalSec / 60;

      const playerCorrect = calculateCorrectChars(value, passage.text);
      const finalPlayerWpm = finalMinutes > 0 ? Math.round((playerCorrect / 5) / finalMinutes) : 0;

      setPlayerWpmHistory(prev => [...prev, { second: finalSec, wpm: finalPlayerWpm }]);

      if (ghostActive) {
        const ghostCorrect = calculateCorrectChars(ghostTypedTextRef.current, passage.text);
        const finalGhostWpm = finalMinutes > 0 ? Math.round((ghostCorrect / 5) / finalMinutes) : 0;
        setGhostWpmHistory(prev => [...prev, { second: finalSec, wpm: finalGhostWpm }]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.repeat) return;
    if (e.key === "Tab") return;
    soundManager.playKey(e.key, false);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") return;
    soundManager.playKey(e.key, true);
  };

  // Category change wrapper
  const handleCategoryChange = (cat: string) => {
    if (cat === "custom") {
      setShowCustomModal(true);
    } else {
      setCurrentCategory(cat);
      resetGame(true, cat);
    }
  };

  // Custom text submission
  const handleCustomTextSubmit = () => {
    if (!customText.trim()) return;
    const cleanText = customText.replace(/\s+/g, " ").trim();
    const customPassage: Passage = {
      id: -1,
      text: cleanText,
      source: "Custom Passage",
      category: "general"
    };
    setPassage(customPassage);
    setShowCustomModal(false);
    setCustomText("");
    setGhostActive(false);
    setGhostKeystrokes([]);
    setGhostWpm(0);
    setGhostAccuracy(0);
    resetGame(false);
  };

  // Performance calculations
  const totalKeysPressed = keystrokes.filter(k => k.key !== "Backspace").length;
  const correctCharactersCount = calculateCorrectChars(typedText, passage.text);
  const accuracy = totalKeysPressed > 0 ? Math.round((correctCharactersCount / totalKeysPressed) * 100) : 100;

  const totalTimeMs = endTime && startTime ? endTime - startTime : 0;
  const minutesElapsed = totalTimeMs / 60000;
  const wpm = minutesElapsed > 0 ? Math.round((correctCharactersCount / 5) / minutesElapsed) : 0;
  const rawWpm = minutesElapsed > 0 ? Math.round((totalKeysPressed / 5) / minutesElapsed) : 0;

  // Race progress percentages
  const playerProgress = (correctCharactersCount / passage.text.length) * 100;
  const ghostCorrectCharactersCount = calculateCorrectChars(ghostTypedText, passage.text);
  const ghostProgress = (ghostCorrectCharactersCount / passage.text.length) * 100;

  // Theme changer wrapper
  const handleThemeChange = (id: string) => {
    setThemeId(id);
    const th = THEMES.find(t => t.id === id);
    if (th) {
      applyTheme(th);
      localStorage.setItem("keyclash-theme", id);
    }
  };

  // Sound switch change wrapper
  const handleSwitchChange = (type: SwitchType) => {
    setSwitchType(type);
    localStorage.setItem("keyclash-switch", type);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    localStorage.setItem("keyclash-volume", vol.toString());
  };

  const handleMutedChange = (mute: boolean) => {
    setIsMuted(mute);
    localStorage.setItem("keyclash-muted", mute.toString());
  };

  // Generate and copy duel link
  const copyChallengeLink = () => {
    if (typeof window === "undefined") return;

    const base = window.location.origin + window.location.pathname;
    const ghostData = serializeKeystrokes(keystrokes);

    let link = "";
    if (passage.id === -1) {
      link = `${base}?c=${encodeBase64(passage.text)}&g=${ghostData}&w=${wpm}&a=${accuracy}`;
    } else {
      link = `${base}?p=${passage.id}&g=${ghostData}&w=${wpm}&a=${accuracy}`;
    }

    navigator.clipboard.writeText(link).then(() => {
      setCopyFeedback("Copied Link! ⚡");
      setTimeout(() => setCopyFeedback("Copy Duel Link"), 2000);
    }).catch(() => {
      setCopyFeedback("Failed to copy");
    });
  };

  // Word list splits
  const words = passage.text.split(" ");
  let globalCharIndex = 0;
  const formattedWords = words.map((word, wIdx) => {
    const letters = word.split("").map(char => {
      const idx = globalCharIndex;
      globalCharIndex++;
      return { char, index: idx };
    });

    let spaceIndex = -1;
    if (wIdx < words.length - 1) {
      spaceIndex = globalCharIndex;
      globalCharIndex++;
    }

    return { letters, spaceIndex };
  });

  // Render SVG chart path helper
  const renderSvgChart = () => {
    if (playerWpmHistory.length === 0) return null;

    const width = 800;
    const height = 180;
    const top = 10;
    const right = 20;
    const bottom = 25;
    const left = 35;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const allHistoryTimes = [
      ...playerWpmHistory.map(d => d.second),
      ...ghostWpmHistory.map(d => d.second)
    ];
    const maxX = Math.max(...allHistoryTimes, 1);

    const allHistoryWpms = [
      ...playerWpmHistory.map(d => d.wpm),
      ...ghostWpmHistory.map(d => d.wpm)
    ];
    const maxYVal = Math.max(...allHistoryWpms, 60);
    const maxY = Math.ceil(maxYVal / 20) * 20; // grid in 20s

    const getX = (sec: number) => left + (sec / maxX) * plotWidth;
    const getY = (w: number) => top + plotHeight - (w / maxY) * plotHeight;

    const playerPath = playerWpmHistory.length > 0
      ? `M ${getX(playerWpmHistory[0].second)} ${getY(playerWpmHistory[0].wpm)} ` +
        playerWpmHistory.slice(1).map(pt => `L ${getX(pt.second)} ${getY(pt.wpm)}`).join(" ")
      : "";

    const ghostPath = ghostWpmHistory.length > 0
      ? `M ${getX(ghostWpmHistory[0].second)} ${getY(ghostWpmHistory[0].wpm)} ` +
        ghostWpmHistory.slice(1).map(pt => `L ${getX(pt.second)} ${getY(pt.wpm)}`).join(" ")
      : "";

    // Generate grid lines
    const gridLines = [];
    for (let w = 20; w <= maxY; w += 20) {
      gridLines.push(w);
    }

    return (
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Horizontal grid lines */}
        {gridLines.map(w => (
          <g key={w}>
            <line
              x1={left}
              y1={getY(w)}
              x2={width - right}
              y2={getY(w)}
              className={styles.chartGridLine}
            />
            <text
              x={left - 8}
              y={getY(w) + 4}
              textAnchor="end"
              className={styles.chartAxisText}
            >
              {w}
            </text>
          </g>
        ))}

        {/* X Axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const secVal = maxX * p;
          return (
            <text
              key={i}
              x={getX(secVal)}
              y={height - 5}
              textAnchor="middle"
              className={styles.chartAxisText}
            >
              {secVal.toFixed(1)}s
            </text>
          );
        })}

        {/* Ghost Line */}
        {ghostActive && ghostPath && (
          <path d={ghostPath} className={styles.chartPathGhost} />
        )}

        {/* Player Line */}
        {playerPath && (
          <path d={playerPath} className={styles.chartPathPlayer} />
        )}
      </svg>
    );
  };

  const hasError = typedText.length > 0 && typedText[typedText.length - 1] !== passage.text[typedText.length - 1];

  return (
    <div className={`${styles.layoutWrapper} ${isStarted && !isCompleted && isFocused ? styles.focusedMode : ""}`}>
      {/* Left Sidebar Ad Placeholder */}
      <aside className={styles.sideAdLeft}>
        <div className={styles.adLabel}>Sponsor</div>
        <div className={styles.adGraphic} />
        <div className={styles.adText}>
          <strong>KeyClash Premium</strong>
          <p style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Support minimal typing by purchasing premium physical keycaps.
          </p>
        </div>
      </aside>

      {/* Main typing container */}
      <div className={styles.container}>
      {/* Header panel */}
      <header className={styles.header}>
        <div
          className={styles.logoContainer}
          onClick={() => resetGame(true)}
          title="Reset to main dashboard"
        >
          <h1 className={styles.logo}>
            <span className={styles.logoIcon}>⌨</span> KeyClash
          </h1>
          <p className={styles.subTitle}>Asynchronous keyboard typing duels</p>
        </div>

        <div className={styles.controls}>
          {/* Theme Selector */}
          <div className={styles.ribbon}>
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`${styles.ribbonBtn} ${themeId === t.id ? styles.ribbonActive : ""}`}
                onClick={() => handleThemeChange(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Switch Sound Selector */}
          <div className={styles.ribbon}>
            <button
              type="button"
              className={`${styles.ribbonBtn} ${switchType === "creamy" ? styles.ribbonActive : ""}`}
              onClick={() => handleSwitchChange("creamy")}
            >
              POM Linear
            </button>
            <button
              type="button"
              className={`${styles.ribbonBtn} ${switchType === "clicky" ? styles.ribbonActive : ""}`}
              onClick={() => handleSwitchChange("clicky")}
            >
              Clicky
            </button>
            <button
              type="button"
              className={`${styles.ribbonBtn} ${switchType === "retro" ? styles.ribbonActive : ""}`}
              onClick={() => handleSwitchChange("retro")}
            >
              Spring
            </button>
            <button
              type="button"
              className={`${styles.ribbonBtn} ${switchType === "brown" ? styles.ribbonActive : ""}`}
              onClick={() => handleSwitchChange("brown")}
            >
              Tactile
            </button>
            <button
              type="button"
              className={`${styles.ribbonBtn} ${switchType === "silent" ? styles.ribbonActive : ""}`}
              onClick={() => handleSwitchChange("silent")}
            >
              Silent
            </button>
          </div>

          {/* Volume Control */}
          <div className={styles.volumeControl}>
            <button
              type="button"
              className={styles.volumeBtn}
              onClick={() => handleMutedChange(!isMuted)}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? "🔇" : volume < 0.4 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              className={styles.volumeSlider}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={isMuted}
            />
          </div>
        </div>
      </header>

      {/* Category selection */}
      {!isStarted && !isCompleted && (
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${currentCategory === "general" && passage.id !== -1 ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange("general")}
          >
            General Quotes
          </button>
          <button
            className={`${styles.filterBtn} ${currentCategory === "philosophy" && passage.id !== -1 ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange("philosophy")}
          >
            Philosophy
          </button>
          <button
            className={`${styles.filterBtn} ${currentCategory === "literature" && passage.id !== -1 ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange("literature")}
          >
            Literature
          </button>
          <button
            className={`${styles.filterBtn} ${currentCategory === "code" && passage.id !== -1 ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange("code")}
          >
            Code Snippets
          </button>
          <button
            className={`${styles.filterBtn} ${passage.id === -1 ? styles.filterBtnActive : ""}`}
            onClick={() => handleCategoryChange("custom")}
          >
            ✏️ Custom Text
          </button>
        </div>
      )}

      {/* Active gameplay elements */}
      {!isCompleted ? (
        <>
          {/* Race Track */}
          <div className={`${styles.trackContainer} glass`}>
            <div className={styles.trackTitle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>Race Progress</span>
                {ghostActive && (
                  <span style={{ color: "var(--ghost-caret)", fontWeight: 700, fontSize: '0.72rem', textTransform: 'none' }}>
                    (vs. 👻 {ghostWpm} WPM Ghost)
                  </span>
                )}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {ghostActive && (
                  <button
                    className={styles.exitDuelBtn}
                    onClick={() => resetGame(true)}
                  >
                    Exit Duel (Solo)
                  </button>
                )}
                <span>{Math.round(playerProgress)}% Completed</span>
              </div>
            </div>

            {/* Player Runner */}
            <div className={styles.trackRow}>
              <div className={styles.trackLine}></div>
              <div
                className={styles.playerProgressFill}
                style={{ width: `${playerProgress}%` }}
              />
              <div
                className={`${styles.runner} ${styles.playerRunner}`}
                style={{ left: `${Math.min(96, Math.max(4, playerProgress))}%` }}
              >
                <div className={styles.runnerIcon}>⚡</div>
                <div className={styles.runnerLabel}>You</div>
              </div>
            </div>

            {/* Ghost Runner */}
            {ghostActive && (
              <div className={styles.trackRow}>
                <div className={styles.trackLine}></div>
                <div
                  className={styles.ghostProgressFill}
                  style={{ width: `${ghostProgress}%` }}
                />
                <div
                  className={`${styles.runner} ${styles.ghostRunner}`}
                  style={{ left: `${Math.min(96, Math.max(4, ghostProgress))}%` }}
                >
                  <div className={styles.runnerIcon}>👻</div>
                  <div className={styles.runnerLabel}>Ghost</div>
                </div>
              </div>
            )}
          </div>

          {/* Typing Engine */}
          <div
            className={`${styles.typingWrapper} ${hasError ? styles.wrapperError : ""} glass`}
            onClick={() => textareaRef.current?.focus()}
          >
            {/* Unfocused overlay warn */}
            {!isFocused && (
              <div className={styles.unfocusedOverlay}>
                <div className={styles.unfocusedContent}>
                  <span>⌨ Click here or press any key to resume typing</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Typing will resume immediately
                  </span>
                </div>
              </div>
            )}

            {/* Caret positioning indicator */}
            <div
              className={`${styles.caret} ${(!isStarted || !isTyping || !isFocused) ? styles.caretBlink : ""}`}
              style={{
                transform: caretStyle.transform,
                height: caretStyle.height,
                opacity: caretStyle.opacity
              }}
            />

            {/* Ghost Caret positioning indicator */}
            {ghostActive && (
              <div
                className={styles.ghostCaret}
                style={{
                  transform: ghostCaretStyle.transform,
                  height: ghostCaretStyle.height,
                  opacity: ghostCaretStyle.opacity
                }}
              >
                <span className={styles.ghostCaretTag}>Ghost</span>
              </div>
            )}

            {/* Hidden Input field */}
            <textarea
              ref={textareaRef}
              className={styles.hiddenTextarea}
              value={typedText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              disabled={isCompleted}
            />

            {/* Spans for text highlighting */}
            <div className={styles.wordsContainer} ref={containerRef}>
              {formattedWords.map((word, wIdx) => (
                <div key={wIdx} className={styles.wordWrapper}>
                  {word.letters.map((letObj) => {
                    const isTyped = letObj.index < typedText.length;
                    const isCorrect = isTyped && typedText[letObj.index] === letObj.char;
                    const isActive = letObj.index === typedText.length;

                    let classes = styles.charSpan;
                    if (isActive) classes += ` ${styles.active}`;
                    if (isTyped) {
                      classes += isCorrect ? ` ${styles.correct}` : ` ${styles.incorrect}`;
                    }

                    return (
                      <span
                        key={letObj.index}
                        data-index={letObj.index}
                        className={classes}
                      >
                        {letObj.char}
                      </span>
                    );
                  })}
                  {word.spaceIndex !== -1 && (() => {
                    const isTyped = word.spaceIndex < typedText.length;
                    const isCorrect = isTyped && typedText[word.spaceIndex] === " ";
                    const isActive = word.spaceIndex === typedText.length;

                    let classes = `${styles.charSpan} ${styles.spaceSpan}`;
                    if (isActive) classes += ` ${styles.active}`;
                    if (isTyped) {
                      classes += isCorrect ? ` ${styles.correct}` : ` ${styles.incorrect}`;
                    }

                    return (
                      <span
                        key={word.spaceIndex}
                        data-index={word.spaceIndex}
                        className={classes}
                      >
                        {" "}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Running indicators */}
          {isStarted && (
            <div className={styles.liveStats}>
              <div>
                Time: <span className={styles.liveStatValue}>{secondsElapsed}s</span>
              </div>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                {ghostActive && (
                  <div>
                    Ghost:{" "}
                    <span style={{ color: "var(--ghost-caret)" }}>
                      {Math.round(ghostProgress)}% ({ghostWpm} WPM)
                    </span>
                  </div>
                )}
                <div>
                  Accuracy: <span className={styles.liveStatValue}>{accuracy}%</span>
                </div>
                <div>
                  Current WPM:{" "}
                  <span className={styles.liveStatValue}>
                    {secondsElapsed > 0
                      ? Math.round((correctCharactersCount / 5) / (secondsElapsed / 60))
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Results view panel */
        <div className={`${styles.results} glass`}>
          <div className={styles.banner}>
            {ghostActive ? (
              wpm > ghostWpm ? (
                <div className={styles.winner}>⚡ You defeated the ghost! ⚡</div>
              ) : wpm === ghostWpm ? (
                <div>🤝 It is a tie race! 🤝</div>
              ) : (
                <div className={styles.loser}>👻 The ghost beat you! 👻</div>
              )
            ) : (
              <div className={styles.winner}>🎉 Test Completed! 🎉</div>
            )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>WPM</span>
              <span className={styles.statValue}>{wpm}</span>
              <span className={styles.statSubtext}>Words Per Minute</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Accuracy</span>
              <span className={styles.statValue}>{accuracy}%</span>
              <span className={styles.statSubtext}>Keys correctness</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Raw WPM</span>
              <span className={styles.statValue}>{rawWpm}</span>
              <span className={styles.statSubtext}>Includes mistakes</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Time Taken</span>
              <span className={styles.statValue}>{(totalTimeMs / 1000).toFixed(1)}s</span>
              <span className={styles.statSubtext}>Elapsed seconds</span>
            </div>
          </div>

          {/* Comparison summary card */}
          {ghostActive && (
            <div className={styles.comparison}>
              <div className={styles.compareColumn}>
                <span className={styles.compareTitle}>You</span>
                <span className={styles.compareWpm} style={{ color: "var(--accent)" }}>
                  {wpm} WPM / {accuracy}% Acc
                </span>
              </div>
              <div
                className={styles.compareColumn}
                style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "3rem" }}
              >
                <span className={styles.compareTitle}>Ghost</span>
                <span className={styles.compareWpm} style={{ color: "var(--ghost-caret)" }}>
                  {ghostWpm} WPM / {Math.round(ghostAccuracy)}% Acc
                </span>
              </div>
            </div>
          )}

          {/* Performance chart */}
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>WPM Timeline Progression</div>
            {renderSvgChart()}
          </div>

          {/* Action trigger row */}
          <div className={styles.actionRow}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={copyChallengeLink}>
              🔗 {copyFeedback}
            </button>
            <button className={styles.btn} onClick={() => resetGame(false)}>
              🔄 Restart Duel
            </button>
            <button className={styles.btn} onClick={() => resetGame(true)}>
              ✨ New Test (Solo)
            </button>
          </div>
        </div>
      )}

      {/* Control indicators and shortcuts */}
      <footer className={styles.tips}>
        <div>
          Tip: Press <kbd className={styles.kbd}>Tab</kbd> to quickly restart the typing test at any point.
        </div>
        {passage.source && !isCompleted && (
          <div style={{ fontStyle: "italic", marginTop: "0.2rem" }}>
            Source: &ldquo;{passage.source}&rdquo;
          </div>
        )}
      </footer>
    </div> {/* Closes styles.container */}

    {/* Right Sidebar Ad Placeholder */}
    <aside className={styles.sideAdRight}>
      <div className={styles.adLabel}>Featured</div>
      <div className={styles.adGraphic} />
      <div className={styles.adText}>
        <strong>Acoustic Labs</strong>
        <p style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Discover lubed switches and desk mats designed for typists.
        </p>
      </div>
    </aside>

    {/* Custom Text Modal */}
    {showCustomModal && (
      <div className={styles.modalOverlay}>
        <div className={`${styles.modal} glass`}>
          <h3 className={styles.modalTitle}>Paste Custom Passage</h3>
          <textarea
            className={styles.textareaCustom}
            placeholder="Type or paste custom text here (ideal length: 20-60 words)..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
          />
          <div className={styles.modalActions}>
            <button
              className={styles.btn}
              style={{ padding: "0.5rem 1rem" }}
              onClick={() => setShowCustomModal(false)}
            >
              Cancel
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ padding: "0.5rem 1.2rem" }}
              onClick={handleCustomTextSubmit}
            >
              Start Typing
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
