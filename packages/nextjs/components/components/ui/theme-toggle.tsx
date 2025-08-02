import { motion } from "motion/react";
import { Sun, Moon, Lock } from "lucide-react";
import { useTheme } from "./use-theme";
import { Button } from "./button";

interface ThemeToggleProps {
  isMobile?: boolean;
  disabled?: boolean;
}

export function ThemeToggle({ isMobile = false, disabled = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size={isMobile ? "sm" : "default"}
      onClick={disabled ? undefined : toggleTheme}
      disabled={disabled}
      className={`relative overflow-hidden transition-all duration-300 ${
        isMobile 
          ? "h-8 w-8 p-0" 
          : "h-10 w-10 p-0"
      } ${
        disabled 
          ? "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent" 
          : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
      } border border-gray-200 dark:border-gray-700`}
      aria-label={disabled ? "Theme toggle disabled when wallet connected" : `Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={disabled ? "Theme cannot be changed when wallet is connected" : `Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background gradient that changes with theme */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br"
        animate={{
          background: disabled 
            ? "linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1))"
            : isDark 
              ? "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon container */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{ rotate: disabled ? 0 : (isDark ? 0 : 180) }}
        transition={{ duration: disabled ? 0 : 0.5, ease: "easeInOut" }}
      >
        {/* Sun Icon - Shows in dark mode (click to go to light) */}
        <motion.div
          className="absolute"
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? (disabled ? 0.5 : 1) : 0,
            rotate: disabled ? 0 : (isDark ? 0 : 90)
          }}
          transition={{ duration: disabled ? 0 : 0.3, ease: "easeInOut" }}
        >
          <Sun 
            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${disabled ? 'text-gray-400' : 'text-yellow-500'}`}
          />
        </motion.div>

        {/* Moon Icon - Shows in light mode (click to go to dark) */}
        <motion.div
          className="absolute"
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : (disabled ? 0.5 : 1),
            rotate: disabled ? 0 : (isDark ? -90 : 0)
          }}
          transition={{ duration: disabled ? 0 : 0.3, ease: "easeInOut" }}
        >
          <Moon 
            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${disabled ? 'text-gray-400' : 'text-blue-400'}`}
          />
        </motion.div>

        {/* Lock icon overlay when disabled */}
        {disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-0 right-0 z-20"
          >
            <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center border border-gray-400">
              <Lock className="w-2 h-2 text-gray-300" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Ripple effect on click - only show when not disabled */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full opacity-0"
          animate={{ scale: [0, 2], opacity: [0.3, 0] }}
          transition={{ duration: 0.4 }}
          key={`ripple-${theme}`}
        />
      )}

      {/* Glow effect - reduced when disabled */}
      <motion.div
        className="absolute inset-0 rounded-lg blur-sm"
        animate={{
          background: disabled
            ? "linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1))"
            : isDark 
              ? "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))",
          opacity: disabled ? 0.3 : [0.5, 0.8, 0.5]
        }}
        transition={{ 
          background: { duration: 0.3 },
          opacity: disabled 
            ? { duration: 0.3 }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      />
    </Button>
  );
}