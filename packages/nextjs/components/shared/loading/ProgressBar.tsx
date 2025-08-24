import { motion } from "motion/react";
import { useIsMobile } from "../use-mobile";

interface ProgressBarProps {
  progress: number;
  currentPhase: number;
}

export function ProgressBar({ progress, currentPhase }: ProgressBarProps) {
  const isMobile = useIsMobile();
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${isMobile ? 'max-w-xs mx-auto' : 'max-w-md mx-auto'}`}>
      {/* Progress Container */}
      <div className={`relative bg-gray-800/50 backdrop-blur-sm rounded-full ${
        isMobile ? 'h-2' : 'h-3'
      } border border-gray-700/50 overflow-hidden`}>
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-gray-800/30 to-gray-900/50" />
        
        {/* Progress Fill */}
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full`}
          style={{
            background: "linear-gradient(90deg, #14b8a6, #22d3ee, #6366f1, #8b5cf6)",
            backgroundSize: "200% 100%"
          }}
          animate={{
            width: `${clampedProgress}%`,
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"]
          }}
          transition={{
            width: { duration: 0.8, ease: "easeOut" },
            backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1
          }}
          style={{
            width: "50%",
            height: "100%"
          }}
        />

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-teal-400/30 via-blue-400/30 to-purple-400/30 blur-sm"
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: `${clampedProgress}%`
          }}
        />
      </div>

      {/* Progress Text */}
      <div className={`flex justify-between items-center mt-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <motion.span 
          className="text-gray-400 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading...
        </motion.span>
        
        <motion.div className="flex items-center gap-2">
          <motion.span 
            className="text-white font-bold"
            key={Math.floor(clampedProgress)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.floor(clampedProgress)}%
          </motion.span>
          
          {/* Phase Indicator */}
          <motion.div 
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i <= currentPhase 
                    ? 'bg-gradient-to-r from-teal-400 to-blue-500' 
                    : 'bg-gray-600'
                }`}
                animate={i <= currentPhase ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                } : {}}
                transition={{
                  duration: 1,
                  repeat: i <= currentPhase ? Infinity : 0,
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Additional Progress Details */}
      <motion.div 
        className={`text-center mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-gray-500">
          Phase {currentPhase + 1} of 5
        </span>
      </motion.div>
    </div>
  );
}