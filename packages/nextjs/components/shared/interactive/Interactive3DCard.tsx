import { useRef, useState } from "react";
import { useTheme } from "../use-theme";
import { useInViewAnimation } from "./useInViewAnimation";
import { motion } from "motion/react";

interface Interactive3DCardProps {
  className?: string;
  glowColor?: string;
  rotationIntensity?: number;
}

export function Interactive3DCard({ className = "", glowColor, rotationIntensity = 1 }: Interactive3DCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, isInView } = useInViewAnimation();
  const { isDark } = useTheme();

  // Dynamic glow color based on theme
  const dynamicGlowColor = glowColor || (isDark ? "rgba(34, 211, 238, 0.5)" : "rgba(59, 130, 246, 0.5)");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const rotateX = mousePosition.y * -10 * rotationIntensity;
  const rotateY = mousePosition.x * 10 * rotationIntensity;

  return (
    <motion.div
      ref={el => {
        cardRef.current = el;
        inViewRef.current = el;
      }}
      className={`relative perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              rotateX: 0,
              rotateY: rotateY,
              rotateZ: rotateX * 0.1,
            }
          : {}
      }
      transition={{
        duration: 0.6,
        rotateY: { type: "spring", stiffness: 300, damping: 30 },
        rotateZ: { type: "spring", stiffness: 300, damping: 30 },
      }}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background with dynamic theme support */}
      <motion.div
        className="absolute inset-0 rounded-lg backdrop-blur-sm transition-all duration-300"
        style={{
          backgroundColor: "var(--card-bg)",
          border: isDark ? "1px solid rgba(55, 65, 81, 0.5)" : "1px solid var(--border-light)",
        }}
        animate={
          isHovered
            ? {
                boxShadow: [
                  `0 0 0px ${dynamicGlowColor}`,
                  `0 0 30px ${dynamicGlowColor}`,
                  `0 10px 50px ${dynamicGlowColor.replace("0.5", "0.3")}`,
                ],
              }
            : {
                boxShadow: "0 0 0px rgba(0,0,0,0)",
              }
        }
        transition={{ duration: 0.3 }}
      />

      {/* Highlight effect with theme adaptation */}
      <motion.div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(
            ${45 + mousePosition.x * 90}deg,
            transparent 30%,
            ${dynamicGlowColor.replace("0.5", "0.1")} 50%,
            transparent 70%
          )`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}

      {/* Floating particles on hover with theme colors */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full transition-colors duration-300 ${
                isDark ? "bg-cyan-400" : "bg-blue-500"
              }`}
              style={{
                left: `${20 + i * 20}%`,
                top: `${20 + i * 15}%`,
              }}
              animate={{
                y: [0, -20, -40],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
