import { useEffect, useState } from "react";
import { LOADING_PHASES } from "./constants";

export function useLoadingProgress() {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 3;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        const phaseIndex = Math.floor(newProgress / 20);
        setCurrentPhase(Math.min(phaseIndex, LOADING_PHASES.length - 1));
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { progress, currentPhase };
}