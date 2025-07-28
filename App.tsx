import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { InteractiveMainContent } from "./components/InteractiveMainContent";
import { LoadingScreen } from "./components/LoadingScreen";
import { GlobalParticleSystem } from "./components/interactive/GlobalParticleSystem";
import { LiveCryptoTicker } from "./components/interactive/LiveCryptoTicker";
import { DynamicBackground } from "./components/interactive/DynamicBackground";
import { EasterEggs } from "./components/interactive/EasterEggs";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./components/ui/use-mobile";
import { useTheme } from "./components/ui/use-theme";

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'rebalance' | 'dashboard' | 'top-performers'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { theme } = useTheme(); // Initialize theme

  useEffect(() => {
    // Tempo di caricamento ottimizzato
    const loadingTime = isMobile ? 4000 : 5000;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [isMobile]);

  if (isLoading) {
    return <LoadingScreen onSkip={() => setIsLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">
      <DynamicBackground 
        intensity={isMobile ? 0.6 : 1.0} 
        responseToMouse={!isMobile} 
      />
      {!isMobile && <GlobalParticleSystem />}
      
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content container con scroll corretto */}
      <main 
        className={`flex-1 relative ${
          activeTab === 'home' 
            ? 'h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] overflow-hidden' 
            : 'min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] overflow-y-auto'
        }`}
      >
        <InteractiveMainContent activeTab={activeTab} />
      </main>
      
      {/* Fixed elements */}
      <LiveCryptoTicker />
      {!isMobile && <EasterEggs />}
      
      <Toaster 
        position={isMobile ? "bottom-center" : "bottom-right"}
        richColors
        closeButton
        theme={theme === 'dark' ? 'dark' : 'light'}
        expand={false}
        visibleToasts={isMobile ? 1 : 3}
        toastOptions={{
          duration: 3000,
          style: {
            marginBottom: isMobile ? '80px' : '70px',
          },
        }}
      />
    </div>
  );
}