"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "~~/components/shared/button";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Determine current theme with proper fallbacks
  let currentTheme = 'dark'; // default fallback
  if (mounted) {
    if (theme && theme !== 'system') {
      currentTheme = theme;
    } else {
      currentTheme = resolvedTheme || 'dark';
    }
  }
  
  const isDarkMode = currentTheme === "dark";

  const handleToggle = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
    
    // Force immediate DOM update for better UX
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state with current theme assumption
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={className}
        disabled
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className={`${className} transition-all duration-200 hover:scale-105`}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
