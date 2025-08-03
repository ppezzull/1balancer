"use client";

import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "sonner";
import { usePathname, useSearchParams } from "next/navigation";

import { HeaderSimplified } from "~~/components/HeaderSimplified";
import { LoadingScreen } from "~~/components/LoadingScreen";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { privyConfig } from "~~/services/web3/privyConfig";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { useIsMobile } from "~~/components/ui/use-mobile";
import { useTheme } from "~~/components/ui/use-theme";
import { toast } from "sonner";
import { initializeDefaultPortfolios } from "~~/utils/constants";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [modalOrderSubmitted, setModalOrderSubmitted] = useState(false);
  const [defaultPortfoliosInitialized, setDefaultPortfoliosInitialized] = useState(false);
  
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  // Derive state from URL
  const activeTab = pathname === '/about' ? 'about' 
    : pathname === '/rebalance' ? 'rebalance'
    : pathname === '/top-performers' ? 'top-performers'
    : 'home';
  
  const activeWalletTab = searchParams.get('tab') as 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio' || 'home';
  const showWalletSection = searchParams.get('wallet') === 'true';

  // Control body overflow based on active tab
  useEffect(() => {
    const isHomePage = activeTab === 'home' && !showWalletSection;
    
    if (isHomePage) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [activeTab, showWalletSection]);

  // Loading screen timer
  useEffect(() => {
    const loadingTime = isMobile ? 4000 : 5000;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [isMobile]);

  // Initialize default portfolios
  useEffect(() => {
    if (!defaultPortfoliosInitialized) {
      try {
        const portfolios = initializeDefaultPortfolios();
        setDefaultPortfoliosInitialized(true);
        
        console.log(`🚀 Default portfolios initialized: ${portfolios.length} portfolios available`);
        
        const hasInitializedKey = localStorage.getItem('defaultPortfoliosInitialized');
        if (!hasInitializedKey && portfolios.length > 0) {
          setTimeout(() => {
            toast.success("1Balancer Portfolios Ready!", {
              description: `${portfolios.length} professional portfolio strategies are now available to explore.`,
              duration: 4000,
            });
          }, isLoading ? (isMobile ? 4500 : 5500) : 1000);
        }
      } catch (error) {
        console.error("Error initializing default portfolios:", error);
        setDefaultPortfoliosInitialized(true);
      }
    }
  }, [defaultPortfoliosInitialized, isLoading, isMobile]);

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnection = (event: CustomEvent) => {
      setIsWalletConnected(event.detail.connected);
    };

    window.addEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
    return () => window.removeEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
  }, []);

  // Listen for modal order submission events
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleModalOrderSubmitted = (event: CustomEvent) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      setModalOrderSubmitted(true);
      
      timeoutId = setTimeout(() => {
        setModalOrderSubmitted(false);
        timeoutId = null;
      }, 4000);
    };

    window.addEventListener('modal-order-submitted', handleModalOrderSubmitted as EventListener);
    
    return () => {
      window.removeEventListener('modal-order-submitted', handleModalOrderSubmitted as EventListener);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen onSkip={() => setIsLoading(false)} />;
  }

  const isHomePage = activeTab === 'home' && !showWalletSection;

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300 ${
      isHomePage ? 'h-screen overflow-hidden' : ''
    }`}>
      <HeaderSimplified 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === 'home') {
            window.location.href = '/';
          } else {
            window.location.href = `/${tab}`;
          }
        }}
        activeWalletTab={activeWalletTab}
        onWalletTabChange={(tab) => {
          window.location.href = `/?wallet=true&tab=${tab}`;
        }}
        isWalletConnected={isWalletConnected}
        showWalletNavigation={showWalletSection}
        onLogoClick={() => {
          window.location.href = '/';
        }}
      />
      
      <main 
        className={`flex-1 relative ${
          isHomePage
            ? 'h-screen overflow-hidden pt-16 sm:pt-20' 
            : 'min-h-screen overflow-y-auto pt-16 sm:pt-20'
        }`}
      >
        {children}
      </main>
      
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
            marginBottom: modalOrderSubmitted 
              ? isMobile 
                ? '20px'
                : '20px'
              : isMobile 
                ? '80px'
                : '70px',
            zIndex: modalOrderSubmitted ? 9999 : 1000,
          },
        }}
      />
    </div>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProvider appId={scaffoldConfig.privyProjectId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
