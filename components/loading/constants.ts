export const LOADING_PHASES = [
  "Inizializzazione sistema...",
  "Connessione ai mercati...",
  "Sincronizzazione portfolio...",
  "Caricamento algoritmi...",
  "Finalizzazione..."
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