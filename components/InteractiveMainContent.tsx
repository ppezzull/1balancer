import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Interactive3DCard } from "./interactive/Interactive3DCard";
import { useInViewAnimation } from "./interactive/useInViewAnimation";
import { useTheme } from "./ui/use-theme";
import { AboutSection } from "./AboutSection";
import { DashboardSection } from "./DashboardSection";
import { TopPerformersSection } from "./TopPerformersSection";
import { TrendingUp, Zap, Shield, Brain, Target, Sparkles, ArrowRight, BarChart3, Wallet, Users } from "lucide-react";

interface InteractiveMainContentProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'dashboard' | 'top-performers';
}

export function InteractiveMainContent({ activeTab }: InteractiveMainContentProps) {
  const [mouseTrail, setMouseTrail] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [clickEffects, setClickEffects] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation();
  const { ref: featuresRef, isInView: featuresInView } = useInViewAnimation();
  const { isDark } = useTheme();

  // Mouse trail effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now()
      };
      
      setMouseTrail(prev => [...prev.slice(-10), newTrail]);
    };

    const handleClick = (e: MouseEvent) => {
      const newEffect = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now()
      };
      
      setClickEffects(prev => [...prev, newEffect]);
      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  if (activeTab === 'home') {
    return (
      <div className="flex-1 relative overflow-hidden">
        {/* Mouse trail effects */}
        {mouseTrail.map((point, index) => (
          <motion.div
            key={point.id}
            className="fixed w-2 h-2 bg-cyan-400 rounded-full pointer-events-none z-30"
            style={{ left: point.x - 4, top: point.y - 4 }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
          />
        ))}

        {/* Click effects */}
        {clickEffects.map(effect => (
          <motion.div
            key={effect.id}
            className="fixed pointer-events-none z-30"
            style={{ left: effect.x, top: effect.y }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                animate={{
                  x: Math.cos((i * 30) * (Math.PI / 180)) * 50,
                  y: Math.sin((i * 30) * (Math.PI / 180)) * 50,
                  opacity: [1, 0],
                  scale: [1, 0]
                }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            ))}
          </motion.div>
        ))}

        {/* Hero Section */}
        <motion.div 
          ref={heroRef}
          className="min-h-screen flex items-start justify-center relative pt-20"
        >
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-4xl md:text-7xl text-foreground mb-8 transition-colors duration-300"
                animate={{
                  textShadow: isDark ? [
                    "0 0 10px rgba(34, 211, 238, 0.3)",
                    "0 0 20px rgba(34, 211, 238, 0.6)",
                    "0 0 10px rgba(34, 211, 238, 0.3)"
                  ] : [
                    "0 0 10px rgba(59, 130, 246, 0.2)",
                    "0 0 20px rgba(59, 130, 246, 0.4)",
                    "0 0 10px rgba(59, 130, 246, 0.2)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Il Futuro del{" "}
                <motion.span 
                  className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  style={{ backgroundSize: "200% 100%" }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Portfolio Management
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                1balancer è una piattaforma finanziaria innovativa che ti permette di gestire 
                e riequilibrare il tuo portafoglio di criptovalute in modo automatico e intelligente.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onHoverStart={() => setHoveredElement('start-btn')}
                  onHoverEnd={() => setHoveredElement(null)}
                >
                  <Button 
                    size="lg"
                    className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-12 py-4 text-lg font-bold overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={hoveredElement === 'start-btn' ? {
                        x: ["-100%", "100%"]
                      } : {}}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Inizia Ora <Sparkles className="w-5 h-5" />
                    </span>
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg"
                    variant="outline"
                    className={`px-12 py-4 text-lg border-2 transition-all duration-300 ${
                      isDark 
                        ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-cyan-400"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-blue-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      Scopri di Più <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Floating stats */}
          <motion.div
            className="absolute top-20 right-20 hidden lg:block"
            initial={{ opacity: 0, x: 100 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Interactive3DCard className="w-48" glowColor="rgba(20, 184, 166, 0.5)">
              <div className="text-center">
                <motion.div 
                  className="text-2xl text-foreground mb-1 transition-colors duration-300"
                  animate={{ 
                    color: isDark 
                      ? ["#ffffff", "#14b8a6", "#ffffff"]
                      : ["#1f2937", "#0d9488", "#1f2937"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  $2.4B+
                </motion.div>
                <div className="text-sm text-muted-foreground transition-colors duration-300">Volume Gestito</div>
              </div>
            </Interactive3DCard>
          </motion.div>

          <motion.div
            className="absolute bottom-32 left-20 hidden lg:block"
            initial={{ opacity: 0, x: -100 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <Interactive3DCard className="w-48" glowColor="rgba(34, 211, 238, 0.5)">
              <div className="text-center">
                <motion.div 
                  className="text-2xl text-foreground mb-1 transition-colors duration-300"
                  animate={{ 
                    color: isDark 
                      ? ["#ffffff", "#22d3ee", "#ffffff"]
                      : ["#1f2937", "#0ea5e9", "#1f2937"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  50K+
                </motion.div>
                <div className="text-sm text-muted-foreground transition-colors duration-300">Utenti Attivi</div>
              </div>
            </Interactive3DCard>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          ref={featuresRef}
          className="py-20 relative"
        >
          
        </motion.div>
      </div>
    );
  }

  if (activeTab === 'about') {
    return <AboutSection />;
  }

  if (activeTab === 'dashboard') {
    return <DashboardSection />;
  }

  if (activeTab === 'top-performers') {
    return <TopPerformersSection />;
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <motion.div 
        className="min-h-screen flex items-center justify-center relative py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 transition-colors duration-300">
              Smart Rebalancing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
              Il nostro algoritmo di riequilibrio automatico mantiene il tuo portafoglio 
              allineato alla tua strategia di investimento target.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Automatico",
                description: "Riequilibrio automatico basato su soglie predefinite",
                delay: 0
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "Intelligente", 
                description: "Analisi di mercato in tempo reale per decisioni ottimali",
                delay: 0.2
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Sicuro",
                description: "Protocolli di sicurezza avanzati per i tuoi fondi",
                delay: 0.4
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay + 0.6, duration: 0.8 }}
              >
                <Interactive3DCard className="h-full text-center">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center text-black"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl text-foreground mb-4 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground transition-colors duration-300">
                    {feature.description}
                  </p>
                </Interactive3DCard>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-12 py-4 text-lg font-bold relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{
                    x: ["-100%", "100%"]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Inizia il Rebalancing <Wallet className="w-5 h-5" />
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}