"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "./use-mobile";
import { useTheme } from "./use-theme";

interface LoadingScreenProps {
  onSkip?: () => void;
}

export function LoadingScreen({ onSkip }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  const phases = [
    "Initializing 1balancer...",
    "Loading portfolio engine...",
    "Connecting to DeFi protocols...",
    "Preparing your dashboard...",
    "Almost ready!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 300);

    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(skipTimer);
    };
  }, []);

  useEffect(() => {
    const phaseIndex = Math.floor((progress / 100) * phases.length);
    setCurrentPhase(Math.min(phaseIndex, phases.length - 1));
  }, [progress, phases.length]);

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  return (
    <div 
      className="h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #000000 0%, #1f2937 50%, #000000 100%)'
          : 'var(--universe-bg)'
      }}
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(20, 184, 166, 0.4), rgba(34, 211, 238, 0.2), transparent)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.2), transparent)',
            filter: 'blur(40px)'
          }}
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: '10%',
            top: '20%'
          }}
        />
        
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.2), transparent)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2), transparent)',
            filter: 'blur(30px)'
          }}
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1.2, 1, 1.2]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            right: '10%',
            bottom: '20%'
          }}
        />
      </div>

      {/* Floating Particles */}
      {!isMobile && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: isDark 
                  ? 'rgba(20, 184, 166, 0.6)'
                  : 'rgba(59, 130, 246, 0.6)',
                left: `${10 + (i * 7)}%`,
                top: `${20 + (i * 5)}%`
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-md mx-auto">
        {/* Logo Container */}
        <motion.div
          className="mb-8 cursor-pointer"
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="relative inline-block"
            animate={{
              rotate: logoClicks > 0 ? [0, 5, -5, 0] : [0, 2, -2, 0],
              scale: logoClicks > 0 ? [1, 1.1, 1] : [1, 1.02, 1]
            }}
            transition={{
              duration: logoClicks > 0 ? 1 : 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.img 
              src={"/logo.png"} 
              alt="1balancer" 
              className={`mx-auto ${isMobile ? 'h-70' : 'h-100'} w-auto`}
              style={{
                filter: logoClicks >= 5
                  ? 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.8)) brightness(1.2)'
                  : isDark 
                    ? 'drop-shadow(0 0 15px rgba(20, 184, 166, 0.5))'
                    : 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))'
              }}
            />
            
            {/* Logo Click Counter */}
            {logoClicks > 0 && (
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: isDark 
                    ? 'linear-gradient(45deg, #14b8a6, #22d3ee)'
                    : 'linear-gradient(45deg, #3b82f6, #1d4ed8)'
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
              >
                {logoClicks}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.h1 
          className={`mb-2 ${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-wide`}
          style={{
            background: isDark 
              ? 'var(--gradient-primary)'
              : 'linear-gradient(135deg, #3b82f6, #1d4ed8, #1e40af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          1balancer
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className={`mb-8 ${isMobile ? 'text-sm' : 'text-base'} opacity-70`}
          style={{ color: isDark ? '#9ca3af' : '#64748b' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          DeFi Portfolio Management Platform
        </motion.p>

        {/* Progress Section */}
        <div className="space-y-4">
          {/* Phase Text */}
          <motion.p 
            className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80`}
            style={{ color: isDark ? '#9ca3af' : '#64748b' }}
            key={currentPhase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {phases[currentPhase]}
          </motion.p>

          {/* Progress Bar */}
          <div className="relative">
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ 
                backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(0, 0, 0, 0.1)' 
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isDark 
                    ? 'var(--gradient-primary)'
                    : 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                  width: `${progress}%`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Progress Percentage */}
            <motion.span 
              className={`absolute right-0 -top-6 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
              style={{ color: isDark ? '#22d3ee' : '#3b82f6' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Skip Button */}
        {showSkip && (
          <motion.button
            onClick={handleSkip}
            className={`mt-8 px-6 py-2 rounded-full font-medium transition-all duration-200 ${isMobile ? 'text-sm' : 'text-base'}`}
            style={{
              background: isDark 
                ? 'rgba(20, 184, 166, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              color: isDark ? '#22d3ee' : '#3b82f6',
              border: `1px solid ${isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: isDark ? 'rgba(20, 184, 166, 0.2)' : 'rgba(59, 130, 246, 0.2)'
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Skip Loading
          </motion.button>
        )}

        {/* Easter Egg Message */}
        {logoClicks >= 5 && (
          <motion.div
            className={`absolute left-1/2 transform -translate-x-1/2 mt-4 px-4 py-2 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
            style={{
              background: isDark 
                ? 'linear-gradient(45deg, #22c55e, #16a34a)'
                : 'linear-gradient(45deg, #10b981, #059669)',
              color: 'white',
              bottom: isMobile ? '2rem' : '3rem'
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -5, 0]
            }}
            transition={{
              scale: { duration: 0.3 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            🚀 Portfolio Master Activated!
          </motion.div>
        )}
      </div>
    </div>
  );
}