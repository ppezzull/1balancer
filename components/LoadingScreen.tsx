import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "./ui/use-mobile";
import { useTheme } from "./ui/use-theme";
import logoImage from 'figma:asset/4ec3ac8d40639284c043d1d5a8d06d0449713468.png';
import { ParticleField } from "./loading/ParticleField";
import { PulsingRings } from "./loading/PulsingRings";
import { ProgressBar } from "./loading/ProgressBar";
import { DataStreams } from "./loading/DataStreams";
import { InteractiveParticles } from "./loading/InteractiveParticles";
import { LiveFinancialData } from "./loading/LiveFinancialData";
import { DeveloperMode } from "./loading/DeveloperMode";
import { SkipButton } from "./loading/SkipButton";
import { TouchGestures } from "./loading/TouchGestures";
import { useLoadingProgress } from "./loading/useLoadingProgress";
import { useMouseInteractions } from "./loading/useMouseInteractions";
import { LOADING_PHASES } from "./loading/constants";

interface LoadingScreenProps {
  onSkip?: () => void;
}

export function LoadingScreen({ onSkip }: LoadingScreenProps) {
  const { progress, currentPhase } = useLoadingProgress();
  const { clickCount } = useMouseInteractions();
  const [developerMode, setDeveloperMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [speedBoosts, setSpeedBoosts] = useState(0);
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // Easter egg: 7 cliques sur le logo activent le mode développeur
  useEffect(() => {
    if (logoClicks >= 7) {
      setDeveloperMode(true);
    }
  }, [logoClicks]);

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleSpeedBoost = () => {
    setSpeedBoosts(prev => prev + 1);
    // Effetto visivo per il boost
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div 
      className="h-screen flex items-center justify-center overflow-hidden relative transition-all duration-1000"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #000000 0%, #1f2937 50%, #000000 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
      }}
    >
      {/* Background Effects */}
      {!isMobile && <ParticleField />}
      <PulsingRings />
      {!isMobile && <InteractiveParticles />}
      <LiveFinancialData />
      <DeveloperMode isActive={developerMode} progress={progress} />
      <SkipButton onSkip={handleSkip} progress={progress} />
      {isMobile && <TouchGestures onSpeedBoost={handleSpeedBoost} />}

      {/* Main content container */}
      <motion.div 
        className={`relative z-10 text-center px-4 ${
          isMobile 
            ? 'w-full max-w-sm mt-16' 
            : ''
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo with Enhanced Movement */}
        <motion.div
          className={`cursor-pointer ${isMobile ? 'mb-4' : 'mb-10'} relative`}
          onClick={handleLogoClick}
          whileHover={{ scale: isMobile ? 1.1 : 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Outer Glow Ring - Correggendo l'animazione disallineata */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: logoClicks >= 7 
                ? "radial-gradient(circle, rgba(34, 197, 94, 0.3), rgba(34, 211, 238, 0.3), rgba(99, 102, 241, 0.3))"
                : "radial-gradient(circle, rgba(20, 184, 166, 0.2), rgba(34, 211, 238, 0.2), rgba(99, 102, 241, 0.2))",
              filter: "blur(20px)",
              width: isMobile ? "120px" : "180px",
              height: isMobile ? "120px" : "180px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)"
            }}
          />

          {/* Main Logo Container */}
          <motion.div
            className="relative"
            animate={{
              rotate: logoClicks > 0 ? [0, 15, -15, 10, -10, 0] : [0, 5, -5, 3, -3, 0],
              scale: logoClicks > 0 ? [1, 1.1, 0.9, 1.05, 0.95, 1] : [1, 1.05, 1],
              y: [0, -10, 0, -5, 0]
            }}
            transition={{
              duration: logoClicks > 0 ? 2 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.img 
              src={logoImage} 
              alt="1balancer" 
              className={`mx-auto ${isMobile ? 'h-60 sm:h-60' : 'h-100'} w-auto relative z-10`}
              animate={{
                filter: logoClicks >= 7 ? [
                  "drop-shadow(0 0 30px rgba(34, 197, 94, 1)) brightness(1.3) saturate(1.5)",
                  "drop-shadow(0 0 40px rgba(34, 211, 238, 1)) brightness(1.4) saturate(1.6)",
                  "drop-shadow(0 0 35px rgba(99, 102, 241, 1)) brightness(1.3) saturate(1.5)"
                ] : [
                  "drop-shadow(0 0 20px rgba(20, 184, 166, 0.8)) brightness(1.1)",
                  "drop-shadow(0 0 30px rgba(34, 211, 238, 0.9)) brightness(1.2)",
                  "drop-shadow(0 0 25px rgba(99, 102, 241, 0.8)) brightness(1.1)"
                ],
                rotate: logoClicks >= 7 ? [0, 360] : [0, 10, -10, 0]
              }}
              transition={{
                filter: {
                  duration: logoClicks >= 7 ? 2 : 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotate: {
                  duration: logoClicks >= 7 ? 3 : 6,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
            
            {/* Floating Elements Around Logo */}
            {logoClicks > 0 && (
              <>
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 360],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {logoClicks}
                </motion.div>

                {/* Orbiting Particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full"
                    animate={{
                      rotate: [0, 360],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      transformOrigin: isMobile ? "60px 60px" : "80px 80px",
                      left: "50%",
                      top: "50%",
                      marginLeft: "-4px",
                      marginTop: "-4px"
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Pulsing Ring Around Logo - Sincronizzato meglio */}
          <motion.div
            className="absolute inset-0 border-2 border-teal-400/30 rounded-full"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.7, 0.3],
              borderColor: logoClicks >= 7 ? [
                "rgba(34, 197, 94, 0.7)",
                "rgba(34, 211, 238, 0.7)",
                "rgba(99, 102, 241, 0.7)"
              ] : [
                "rgba(20, 184, 166, 0.5)",
                "rgba(34, 211, 238, 0.5)",
                "rgba(99, 102, 241, 0.5)"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: isMobile ? "100px" : "130px",
              height: isMobile ? "100px" : "130px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)"
            }}
          />
        </motion.div>

        {/* Brand Name with Enhanced Animation */}
        <motion.h2 
          className={`mb-4 ${isMobile ? 'text-2xl sm:text-3xl' : 'text-4xl md:text-5xl'} font-bold tracking-wider transition-colors duration-300`}
          style={{ color: isDark ? '#ffffff' : '#1f2937' }}
          animate={{ 
            background: logoClicks >= 7 ? [
              "linear-gradient(45deg, #22c55e, #22d3ee, #6366f1)",
              "linear-gradient(45deg, #6366f1, #22c55e, #22d3ee)",
              "linear-gradient(45deg, #22d3ee, #6366f1, #22c55e)"
            ] : [
              "linear-gradient(45deg, #14b8a6, #22d3ee, #6366f1)",
              "linear-gradient(45deg, #6366f1, #14b8a6, #22d3ee)",
              "linear-gradient(45deg, #22d3ee, #6366f1, #14b8a6)"
            ],
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            scale: clickCount > 10 ? [1, 1.02, 1] : [1, 1.01, 1],
            y: [0, -2, 0]
          }}
          transition={{ 
            background: {
              duration: logoClicks >= 7 ? 2 : 4,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: {
              duration: 1.5,
              repeat: Infinity
            },
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          style={{
            backgroundSize: "200% 200%"
          }}
        >
          1balancer
          {developerMode && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                color: ["#22c55e", "#22d3ee", "#6366f1", "#22c55e"]
              }}
              transition={{
                color: { duration: 2, repeat: Infinity }
              }}
              className="text-lg ml-3 font-normal"
            >
              [DEV]
            </motion.span>
          )}
        </motion.h2>

        {/* Subtitle with Floating Effect */}
        <motion.p 
          className={`mb-6 ${isMobile ? 'text-sm mb-4' : 'text-base mb-8'} px-4 font-medium transition-colors duration-300`}
          style={{ color: isDark ? '#9ca3af' : '#64748b' }}
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: [0, -3, 0],
            color: developerMode ? ["#9ca3af", "#22d3ee", "#9ca3af"] : "#9ca3af"
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.5,
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            color: { duration: 2, repeat: Infinity }
          }}
        >
          {developerMode ? `[${currentPhase + 1}/5] ${LOADING_PHASES[currentPhase]}` : LOADING_PHASES[currentPhase]}
          {clickCount > 20 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity,
                rotate: { duration: 2, repeat: Infinity, ease: "linear" }
              }}
              className="text-cyan-400 ml-2 inline-block"
            >
              ⚡
            </motion.span>
          )}
        </motion.p>

        <div className={isMobile ? 'px-4' : ''}>
          <ProgressBar progress={progress + (speedBoosts * 5)} currentPhase={currentPhase} />
        </div>
        
        {!isMobile && <DataStreams />}
        
        {/* Easter Egg Hints & Messages */}
        {logoClicks > 0 && logoClicks < 7 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 0.6, 
              y: [0, -2, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className={`absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center ${
              isMobile ? 'bottom-8 px-4' : '-bottom-16'
            }`}
          >
            Keep clicking the logo... ({logoClicks}/7)
          </motion.div>
        )}
        
        {developerMode && logoClicks === 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.1, 1],
              y: [0, -3, 0],
              boxShadow: [
                "0 0 20px rgba(34, 197, 94, 0.5)",
                "0 0 30px rgba(34, 211, 238, 0.5)",
                "0 0 20px rgba(99, 102, 241, 0.5)"
              ]
            }}
            transition={{
              scale: { duration: 1, repeat: Infinity },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 2, repeat: Infinity }
            }}
            className={`absolute left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-500 text-black px-4 py-2 rounded-full text-sm font-bold ${
              isMobile ? 'bottom-12 whitespace-nowrap' : '-bottom-20'
            }`}
          >
            🚀 Developer Mode Activated!
          </motion.div>
        )}
        
        {speedBoosts > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              y: [0, -2, 0]
            }}
            transition={{
              y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1 ${
              isMobile ? 'bottom-16 text-xs' : 'bottom-32'
            }`}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, repeat: Infinity }
              }}
            >
              ⚡
            </motion.div>
            <span className={`text-yellow-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              Speed boost x{speedBoosts}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Wave Effect */}
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'h-12' : 'h-24'}`}
        style={{
          background: isMobile 
            ? "linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.1), rgba(34, 211, 238, 0.1), rgba(99, 102, 241, 0.1), transparent)"
            : "linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.15), rgba(34, 211, 238, 0.15), rgba(99, 102, 241, 0.15), transparent)"
        }}
        animate={{
          x: [-200, 200, -200],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: isMobile ? 4 : 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}