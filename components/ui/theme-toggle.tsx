import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./use-theme";
import { Button } from "./button";

interface ThemeToggleProps {
  isMobile?: boolean;
}

export function ThemeToggle({ isMobile = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size={isMobile ? "sm" : "default"}
      onClick={toggleTheme}
      className={`relative overflow-hidden transition-all duration-300 ${
        isMobile 
          ? "h-8 w-8 p-0" 
          : "h-10 w-10 p-0"
      } hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background gradient that changes with theme */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br"
        animate={{
          background: isDark 
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
            : "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))"
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon container */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Sun Icon */}
        <motion.div
          className="absolute"
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Sun 
            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-500`}
          />
        </motion.div>

        {/* Moon Icon */}
        <motion.div
          className="absolute"
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Moon 
            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-400`}
          />
        </motion.div>
      </motion.div>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full opacity-0"
        animate={{ scale: [0, 2], opacity: [0.3, 0] }}
        transition={{ duration: 0.4 }}
        key={`ripple-${theme}`}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg blur-sm"
        animate={{
          background: isDark 
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
            : "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))",
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          background: { duration: 0.3 },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      />
    </Button>
  );
}