import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code, Cpu, Zap, Database, Globe } from "lucide-react";

interface SystemStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface DeveloperModeProps {
  isActive: boolean;
  progress: number;
}

export function DeveloperMode({ isActive, progress }: DeveloperModeProps) {
  const [stats, setStats] = useState<SystemStat[]>([]);
  const [activeConnections, setActiveConnections] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      setStats([
        {
          label: "CPU Usage",
          value: `${(Math.random() * 30 + 20).toFixed(1)}%`,
          icon: <Cpu className="w-4 h-4" />,
          color: "text-green-400"
        },
        {
          label: "Memory",
          value: `${(Math.random() * 200 + 800).toFixed(0)}MB`,
          icon: <Database className="w-4 h-4" />,
          color: "text-blue-400"
        },
        {
          label: "Network",
          value: `${(Math.random() * 50 + 10).toFixed(1)}Mbps`,
          icon: <Globe className="w-4 h-4" />,
          color: "text-purple-400"
        },
        {
          label: "Performance",
          value: `${(Math.random() * 20 + 80).toFixed(0)}%`,
          icon: <Zap className="w-4 h-4" />,
          color: "text-yellow-400"
        }
      ]);

      setActiveConnections(Math.floor(Math.random() * 500 + 1200));
    };

    if (isActive) {
      updateStats();
      const interval = setInterval(updateStats, 800);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-8 left-8 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-green-400/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-mono">DEVELOPER MODE</span>
          </div>

          <div className="space-y-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className={stat.color}>{stat.icon}</span>
                  <span className="text-gray-300 text-xs">{stat.label}</span>
                </div>
                <span className="text-white font-mono text-xs">{stat.value}</span>
              </motion.div>
            ))}

            <div className="border-t border-gray-600 pt-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Active Connections</span>
                <motion.span 
                  className="text-cyan-400 font-mono text-xs"
                  animate={{ 
                    textShadow: [
                      "0 0 5px rgba(34, 211, 238, 0.5)",
                      "0 0 10px rgba(34, 211, 238, 0.8)",
                      "0 0 5px rgba(34, 211, 238, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {activeConnections.toLocaleString()}
                </motion.span>
              </div>
            </div>

            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs text-gray-400 mb-1">Load Progress</div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-cyan-400"
                  style={{ width: `${progress}%` }}
                  animate={{
                    boxShadow: [
                      "0 0 5px rgba(34, 197, 94, 0.5)",
                      "0 0 10px rgba(34, 211, 238, 0.8)",
                      "0 0 5px rgba(34, 197, 94, 0.5)"
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}