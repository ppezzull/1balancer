export const LOADING_PHASES = [
  "Initializing system...",
  "Connecting to markets...",
  "Synchronizing portfolio...",
  "Loading algorithms...",
  "Finalizing..."
];

export const LOADING_DURATION = 4000;

export const PARTICLE_COUNT = 50;

export const generateParticles = () => 
  Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2
  }));