import { useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

export function useTheme() {
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current theme, preferring next-themes if available
  const getCurrentTheme = (): Theme => {
    if (!mounted) return "dark"; // SSR fallback

    if (nextTheme && nextTheme !== "system") {
      return nextTheme as Theme;
    }

    if (resolvedTheme) {
      return resolvedTheme as Theme;
    }

    // Fallback to localStorage or system preference
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme;
      if (stored && (stored === "light" || stored === "dark")) {
        return stored;
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }

    return "dark";
  };

  const theme = getCurrentTheme();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setNextTheme(newTheme);
  };

  const setLightTheme = () => setNextTheme("light");
  const setDarkTheme = () => setNextTheme("dark");

  return {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isLight: theme === "light",
    isDark: theme === "dark",
    mounted,
  };
}
