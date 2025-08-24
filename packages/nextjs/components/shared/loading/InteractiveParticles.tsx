import { motion } from "motion/react";
import { useMouseInteractions } from "./useMouseInteractions";

export function InteractiveParticles() {
  const { mousePosition, isMouseMoving, clickCount } = useMouseInteractions();

  // Genera particelle attorno al mouse
  const mouseParticles = Array.from({ length: 8 }, (_, i) => ({
    id: `mouse-${i}`,
    angle: (i * 45) * (Math.PI / 180),
    distance: 30 + Math.sin(Date.now() * 0.005 + i) * 10,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Particelle che seguono il mouse */}
      {isMouseMoving && mouseParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
          style={{
            left: mousePosition.x + Math.cos(particle.angle) * particle.distance,
            top: mousePosition.y + Math.sin(particle.angle) * particle.distance,
          }}
          animate={{
            scale: [0.5, 1, 0.5],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: particle.id.split('-')[1] as any * 0.1,
          }}
        />
      ))}

      {/* Effetto click burst */}
      {clickCount > 0 && (
        <motion.div
          key={clickCount}
          className="absolute"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2, 0], opacity: [1, 0.5, 0] }}
          transition={{ duration: 0.6 }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              animate={{
                x: Math.cos((i * 30) * (Math.PI / 180)) * 40,
                y: Math.sin((i * 30) * (Math.PI / 180)) * 40,
                opacity: [1, 0],
              }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            />
          ))}
        </motion.div>
      )}

      {/* Cursore personalizzato */}
      <motion.div
        className="absolute w-6 h-6 border-2 border-cyan-400 rounded-full pointer-events-none"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
        animate={{
          scale: isMouseMoving ? 1.2 : 1,
          rotate: clickCount * 90,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
}