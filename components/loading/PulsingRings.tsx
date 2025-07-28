import { motion } from "motion/react";

export function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Primary Ring Set */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`primary-${i}`}
          className="absolute rounded-full border-2"
          animate={{
            scale: [1, 2.2, 3.5],
            opacity: [0.8, 0.4, 0],
            borderColor: [
              "rgba(20, 184, 166, 0.6)",
              "rgba(34, 211, 238, 0.4)", 
              "rgba(99, 102, 241, 0.2)"
            ]
          }}
          transition={{
            duration: 4,
            delay: i * 1.3,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{
            width: "120px",
            height: "120px",
          }}
        />
      ))}

      {/* Secondary Ring Set - Più omogeneo con il primary */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={`secondary-${i}`}
          className="absolute rounded-full border"
          animate={{
            scale: [1, 2.5, 3.8],
            opacity: [0.6, 0.3, 0],
            borderColor: [
              "rgba(34, 211, 238, 0.4)",
              "rgba(99, 102, 241, 0.3)",
              "rgba(20, 184, 166, 0.2)"
            ]
          }}
          transition={{
            duration: 4.5,
            delay: i * 2 + 0.8,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{
            width: "80px",
            height: "80px",
          }}
        />
      ))}

      {/* Inner Glow Ring */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 blur-sm"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: "200px",
          height: "200px",
        }}
      />

      {/* Outer Glow Ring - Ridotta la dimensione massima */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-r from-purple-500/5 via-teal-500/5 to-blue-500/5 blur-lg"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: "350px",
          height: "350px",
        }}
      />
    </div>
  );
}