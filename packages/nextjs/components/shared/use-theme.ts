import { useCallback, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

export function useTheme() {
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Local theme state to avoid mismatches between SSR and client and to
  // allow immediate visual updates when toggling.
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored as Theme;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [themeState, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync from next-themes when it becomes available or when resolvedTheme changes.
  useEffect(() => {
    if (!mounted) return;

    if (nextTheme && nextTheme !== "system") {
      setThemeState(nextTheme as Theme);
      localStorage.setItem("theme", nextTheme);
      return;
    }

    if (resolvedTheme) {
      setThemeState(resolvedTheme as Theme);
      localStorage.setItem("theme", resolvedTheme as Theme);
      return;
    }

    // If next-themes didn't provide a value, fallback to system/local pref
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setThemeState(stored as Theme);
      return;
    }

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(prefersDark ? "dark" : "light");
  }, [mounted, nextTheme, resolvedTheme]);

  // Listen for system theme changes and update local theme when user hasn't
  // explicitly chosen a theme (i.e., no stored preference). This keeps the
  // UI in sync with OS-level theme changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      try {
        const stored = localStorage.getItem("theme");
        if (stored === "light" || stored === "dark") return;
      } catch {
        // ignore
      }

      const matches = "matches" in e ? e.matches : mq.matches;
      setThemeState(matches ? "dark" : "light");
    };

    if (mq.addEventListener) mq.addEventListener("change", handleChange);
    else mq.addListener(handleChange as any);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handleChange);
      else mq.removeListener(handleChange as any);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = themeState === "light" ? "dark" : "light";
    setNextTheme(newTheme);
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      /* ignore */
    }
  }, [themeState, setNextTheme]);

  const setLightTheme = useCallback(() => {
    setNextTheme("light");
    setThemeState("light");
    try {
      localStorage.setItem("theme", "light");
    } catch {
      /* ignore */
    }
  }, [setNextTheme]);

  const setDarkTheme = useCallback(() => {
    setNextTheme("dark");
    setThemeState("dark");
    try {
      localStorage.setItem("theme", "dark");
    } catch {
      /* ignore */
    }
  }, [setNextTheme]);

  return {
    theme: themeState,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isLight: themeState === "light",
    isDark: themeState === "dark",
    mounted,
  };
}
