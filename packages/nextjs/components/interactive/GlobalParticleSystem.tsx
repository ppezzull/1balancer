import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useTheme } from "../ui/use-theme";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  magneticForce: number;
}

interface MousePosition {
  x: number;
  y: number;
}

export function GlobalParticleSystem() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const colors = isDark ? [
    "rgba(20, 184, 166, 0.7)", // teal
    "rgba(34, 211, 238, 0.7)", // cyan
    "rgba(99, 102, 241, 0.7)", // indigo
    "rgba(168, 85, 247, 0.7)", // purple
  ] : [
    "rgba(59, 130, 246, 0.6)", // blue
    "rgba(14, 165, 233, 0.5)", // sky
    "rgba(99, 102, 241, 0.5)", // indigo
    "rgba(139, 92, 246, 0.4)", // violet
  ];

  // Inizializza le particelle
  useEffect(() => {
    const initParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          magneticForce: Math.random() * 0.02 + 0.01,
        });
      }
      setParticles(newParticles);
    };

    initParticles();
    window.addEventListener('resize', initParticles);
    return () => window.removeEventListener('resize', initParticles);
  }, []);

  // Traccia il movimento del mouse
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsMouseActive(true);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMouseActive(false), 100);
    };

    const handleMouseLeave = () => {
      setIsMouseActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeout);
    };
  }, []);

  // Animazione delle particelle
  useEffect(() => {
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let { x, y, vx, vy } = particle;

          // Gravità magnetica verso il mouse
          if (isMouseActive) {
            const dx = mousePos.x - x;
            const dy = mousePos.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
              const force = (200 - distance) / 200 * particle.magneticForce;
              vx += (dx / distance) * force;
              vy += (dy / distance) * force;
            }
          }

          // Movimento base
          x += vx;
          y += vy;

          // Rimbalzo sui bordi
          if (x <= 0 || x >= window.innerWidth) {
            vx *= -0.8;
            x = Math.max(0, Math.min(window.innerWidth, x));
          }
          if (y <= 0 || y >= window.innerHeight) {
            vy *= -0.8;
            y = Math.max(0, Math.min(window.innerHeight, y));
          }

          // Attrito
          vx *= 0.99;
          vy *= 0.99;

          return { ...particle, x, y, vx, vy };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos, isMouseActive]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: isDark ? 'screen' : 'multiply' }}
    >
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: 'blur(0.5px)',
          }}
          animate={{
            scale: isMouseActive && 
              Math.sqrt((mousePos.x - particle.x) ** 2 + (mousePos.y - particle.y) ** 2) < 100
              ? [1, 1.5, 1] 
              : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
      
      {/* Magnetic Cursor */}
      {isMouseActive && (
        <motion.div
          className="absolute w-8 h-8 border rounded-full pointer-events-none"
          style={{
            left: mousePos.x - 16,
            top: mousePos.y - 16,
            borderColor: isDark ? '#22d3ee' : '#3b82f6',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: 360,
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" }
          }}
        />
      )}
    </div>
  );
}