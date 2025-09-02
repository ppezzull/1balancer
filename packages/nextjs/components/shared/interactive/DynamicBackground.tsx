import { useEffect, useRef, useState } from "react";
import { useTheme } from "../use-theme";
import { motion } from "motion/react";

interface BackgroundProps {
  intensity?: number;
  responseToMouse?: boolean;
}

export function DynamicBackground({ intensity = 1, responseToMouse = true }: BackgroundProps) {
  const [mouseActivity, setMouseActivity] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [time, setTime] = useState(0);
  const activityDecayRef = useRef<NodeJS.Timeout | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleMouseMove = () => {
      if (!responseToMouse) return;

      setMouseActivity(prev => Math.min(prev + 1, 100));

      if (activityDecayRef.current) clearTimeout(activityDecayRef.current);
      activityDecayRef.current = setTimeout(() => {
        setMouseActivity(prev => Math.max(prev - 10, 0));
      }, 100);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (activityDecayRef.current) clearTimeout(activityDecayRef.current);
    };
  }, [responseToMouse]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const gradientIntensity = 0.1 + (mouseActivity / 100) * 0.2 * intensity;
  const waveAmplitude = 10 + (mouseActivity / 100) * 20 * intensity;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base Dynamic Gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `linear-gradient(to bottom right, rgb(17 24 39), rgb(31 41 55), rgb(0 0 0))`
            : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)`,
        }}
        animate={
          isDark
            ? {
                background: [
                  `linear-gradient(to bottom right, 
              rgb(17 24 39), 
              rgb(31 41 55), 
              rgb(0 0 0))`,
                  `linear-gradient(to bottom right, 
              rgb(${Math.floor(17 + gradientIntensity * 100)} ${Math.floor(24 + gradientIntensity * 150)} ${Math.floor(39 + gradientIntensity * 200)}), 
              rgb(${Math.floor(31 + gradientIntensity * 80)} ${Math.floor(41 + gradientIntensity * 120)} ${Math.floor(55 + gradientIntensity * 150)}), 
              rgb(0 0 0))`,
                  `linear-gradient(to bottom right, 
              rgb(17 24 39), 
              rgb(31 41 55), 
              rgb(0 0 0))`,
                ],
              }
            : {
                background: [
                  `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)`,
                  `linear-gradient(135deg, 
              rgb(${Math.floor(248 + gradientIntensity * 7)} ${Math.floor(250 + gradientIntensity * 5)} ${Math.floor(252 + gradientIntensity * 3)}) 0%, 
              rgb(${Math.floor(226 + gradientIntensity * 29)} ${Math.floor(232 + gradientIntensity * 23)} ${Math.floor(240 + gradientIntensity * 15)}) 25%, 
              rgb(${Math.floor(241 + gradientIntensity * 14)} ${Math.floor(245 + gradientIntensity * 10)} ${Math.floor(249 + gradientIntensity * 6)}) 50%, 
              rgb(${Math.floor(226 + gradientIntensity * 29)} ${Math.floor(232 + gradientIntensity * 23)} ${Math.floor(240 + gradientIntensity * 15)}) 75%, 
              rgb(${Math.floor(248 + gradientIntensity * 7)} ${Math.floor(250 + gradientIntensity * 5)} ${Math.floor(252 + gradientIntensity * 3)}) 100%)`,
                  `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)`,
                ],
              }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Colored Gradient Overlays */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(circle at 20% 80%, 
                rgba(20, 184, 166, ${gradientIntensity}) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, 
                  rgba(34, 211, 238, ${gradientIntensity}) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, 
                  rgba(99, 102, 241, ${gradientIntensity * 0.7}) 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 80%, 
                rgba(59, 130, 246, ${gradientIntensity * 0.6}) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, 
                  rgba(14, 165, 233, ${gradientIntensity * 0.5}) 0%, transparent 60%),
                radial-gradient(circle at 60% 60%, 
                  rgba(99, 102, 241, ${gradientIntensity * 0.4}) 0%, transparent 60%)`,
        }}
        animate={{
          transform: [
            `translate(0px, 0px) rotate(0deg)`,
            `translate(${Math.sin(time) * 20}px, ${Math.cos(time) * 15}px) rotate(${time * 2}deg)`,
            `translate(0px, 0px) rotate(360deg)`,
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Animated Waves */}
      <svg
        className="absolute bottom-0 left-0 w-full h-64"
        style={{ opacity: isDark ? 0.2 : 0.15 }}
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
      >
        <motion.path
          fill={isDark ? "rgba(20, 184, 166, 0.3)" : "rgba(59, 130, 246, 0.25)"}
          animate={{
            d: [
              `M0,160 C300,${160 - waveAmplitude} 900,${160 + waveAmplitude} 1200,160 L1200,320 L0,320 Z`,
              `M0,180 C300,${180 + waveAmplitude} 900,${180 - waveAmplitude} 1200,180 L1200,320 L0,320 Z`,
              `M0,160 C300,${160 - waveAmplitude} 900,${160 + waveAmplitude} 1200,160 L1200,320 L0,320 Z`,
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          fill={isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(14, 165, 233, 0.2)"}
          animate={{
            d: [
              `M0,200 C300,${200 + waveAmplitude * 0.7} 900,${200 - waveAmplitude * 0.7} 1200,200 L1200,320 L0,320 Z`,
              `M0,220 C300,${220 - waveAmplitude * 0.7} 900,${220 + waveAmplitude * 0.7} 1200,220 L1200,320 L0,320 Z`,
              `M0,200 C300,${200 + waveAmplitude * 0.7} 900,${200 - waveAmplitude * 0.7} 1200,200 L1200,320 L0,320 Z`,
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Floating Light Points */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: isDark ? "4px" : "3px",
            height: isDark ? "4px" : "3px",
            backgroundColor: isDark ? "#ffffff" : "#3b82f6",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: isDark ? [0.2, 1, 0.2] : [0.1, 0.6, 0.1],
            scale: [1, 1.5, 1],
            y: [0, -scrollY * 0.1, -scrollY * 0.1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
