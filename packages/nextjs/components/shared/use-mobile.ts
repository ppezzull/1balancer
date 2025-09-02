import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Inizializza con un valore predefinito per evitare undefined
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false; // Default per SSR
  });

  React.useEffect(() => {
    // Evita re-render inutili controllando se il valore è già corretto
    const updateIsMobile = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(prev => (prev !== newIsMobile ? newIsMobile : prev));
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      updateIsMobile();
    };

    // Setup listener
    mql.addEventListener("change", onChange);

    // Aggiorna una sola volta al mount se necessario
    updateIsMobile();

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
