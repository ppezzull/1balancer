import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Rocket, Zap } from "lucide-react";

export function EasterEggs() {
  const [konamiSequence, setKonamiSequence] = useState<string[]>([]);
  const [showRocketMode, setShowRocketMode] = useState(false);
  const [showMatrixMode, setShowMatrixMode] = useState(false);
  const [showSparkleRain, setShowSparkleRain] = useState(false);

  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
    'KeyB', 'KeyA'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Konami Code detection
      const newSequence = [...konamiSequence, e.code].slice(-konamiCode.length);
      setKonamiSequence(newSequence);
      
      if (JSON.stringify(newSequence) === JSON.stringify(konamiCode)) {
        setShowRocketMode(true);
        setTimeout(() => setShowRocketMode(false), 10000);
        setKonamiSequence([]);
      }

      // Matrix mode with "CRYPTO"
      if (e.code === 'KeyC') {
        const checkCrypto = async () => {
          const keys = ['KeyC', 'KeyR', 'KeyY', 'KeyP', 'KeyT', 'KeyO'];
          let isMatrixSequence = true;
          
          for (let i = 0; i < keys.length; i++) {
            await new Promise(resolve => {
              const timeout = setTimeout(() => {
                isMatrixSequence = false;
                resolve(void 0);
              }, 1000);
              
              const listener = (e: KeyboardEvent) => {
                if (e.code === keys[i]) {
                  clearTimeout(timeout);
                  document.removeEventListener('keydown', listener);
                  resolve(void 0);
                } else if (i === 0) {
                  clearTimeout(timeout);
                  document.removeEventListener('keydown', listener);
                  isMatrixSequence = false;
                  resolve(void 0);
                }
              };
              
              if (i === 0) return resolve(void 0); // First key already pressed
              document.addEventListener('keydown', listener);
            });
            
            if (!isMatrixSequence) break;
          }
          
          if (isMatrixSequence) {
            setShowMatrixMode(true);
            setTimeout(() => setShowMatrixMode(false), 8000);
          }
        };
        
        checkCrypto();
      }

      // Sparkle rain with space
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        setShowSparkleRain(true);
        setTimeout(() => setShowSparkleRain(false), 5000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [konamiSequence]);

  return (
    <>
      {/* Rocket Mode */}
      <AnimatePresence>
        {showRocketMode && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-cyan-900/50"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(88, 28, 135, 0.5), rgba(30, 58, 138, 0.5), rgba(22, 78, 99, 0.5))",
                  "linear-gradient(225deg, rgba(22, 78, 99, 0.5), rgba(88, 28, 135, 0.5), rgba(30, 58, 138, 0.5))",
                  "linear-gradient(45deg, rgba(88, 28, 135, 0.5), rgba(30, 58, 138, 0.5), rgba(22, 78, 99, 0.5))"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Flying rockets */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${100 + Math.random() * 50}%`,
                }}
                animate={{
                  y: [0, -window.innerHeight - 200],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              >
                <Rocket className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
              </motion.div>
            ))}

            {/* Success message */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 1 }}
            >
              <motion.div
                className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent text-4xl md:text-6xl font-bold mb-4"
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(251, 191, 36, 0.5)",
                    "0 0 20px rgba(239, 68, 68, 0.7)",
                    "0 0 10px rgba(236, 72, 153, 0.5)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                🚀 ROCKET MODE! 🚀
              </motion.div>
              <motion.div
                className="text-white text-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                To the moon! 🌙
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matrix Mode */}
      <AnimatePresence>
        {showMatrixMode && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/80" />
            
            {/* Matrix rain */}
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute font-mono text-green-400 text-sm"
                style={{
                  left: `${(i * 20) % 100}%`,
                  top: "-20px"
                }}
                animate={{
                  y: window.innerHeight + 100
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: 3,
                  ease: "linear"
                }}
              >
                {Array.from({ length: 20 }).map((_, j) => (
                  <div key={j} className="opacity-80">
                    {['BTC', 'ETH', '₿', '1', '0', '$', 'Ξ'][Math.floor(Math.random() * 7)]}
                  </div>
                ))}
              </motion.div>
            ))}

            {/* "CRYPTO MATRIX" text */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 2 }}
            >
              <motion.div
                className="text-green-400 font-mono text-4xl md:text-6xl font-bold mb-4"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(34, 197, 94, 0.8)",
                    "0 0 20px rgba(34, 197, 94, 1)",
                    "0 0 10px rgba(34, 197, 94, 0.8)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                CRYPTO MATRIX
              </motion.div>
              <motion.div
                className="text-green-300 font-mono text-lg"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Welcome to the blockchain... Neo
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle Rain */}
      <AnimatePresence>
        {showSparkleRain && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-20px"
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 3,
                  ease: "easeOut"
                }}
              >
                <Sparkles 
                  className="text-yellow-400 drop-shadow-lg" 
                  size={8 + Math.random() * 16} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions hint */}
      <motion.div
        className="fixed bottom-4 left-4 text-xs text-gray-500 font-mono opacity-30 hover:opacity-80 transition-opacity"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 5 }}
      >
        <div>Easter eggs:</div>
        <div>• ↑↑↓↓←→←→BA = Rocket Mode</div>
        <div>• Type "CRYPTO" = Matrix Mode</div>
        <div>• Ctrl+Space = Sparkle Rain</div>
      </motion.div>
    </>
  );
}