import { motion } from "motion/react";

export function DataStreams() {
  return (
    <>
      <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="text-teal-400/40 text-xs mb-1 font-mono"
            animate={{
              x: [100, -400],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {`USDC: ${(1.00 + Math.random() * 0.01).toFixed(3)}`}
          </motion.div>
        ))}
      </div>

      <div className="absolute -left-10 top-1/2 transform -translate-y-1/2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="text-cyan-400/40 text-xs mb-1 font-mono"
            animate={{
              x: [-100, 400],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              delay: i * 0.7,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {`UNI: ${(12.45 + Math.random() * 2).toFixed(2)}`}
          </motion.div>
        ))}
      </div>
    </>
  );
}