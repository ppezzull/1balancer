import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HeaderSimplified } from "./components/HeaderSimplified";
import { HomePage } from "./pages/HomePage";
import { WalletPage } from "./pages/WalletPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./components/ui/use-mobile";
import { useTheme } from "./components/ui/use-theme";
import { toast } from "sonner";
import { initializeDefaultPortfolios } from "../utils/constants";

export default function App() {
  const router = useRouter();
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
      
      if (!event.detail.connected) {
        setShowWalletSection(false);
        setActiveTab('home');
      }
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

  // Handle Get Started button click
  const handleGetStarted = () => {
    if (isWalletConnected) {
      router.push('/?wallet=true&tab=home');
      
      toast.success("Welcome to 1Balancer Dashboard!", {
        description: "Your personalized investment platform is ready. Explore your portfolios and start trading!",
        duration: 3000,
      });
    }
  };

  // Handle Start Rebalancing button click
  const handleStartRebalancing = () => {
    if (!isWalletConnected) {
      toast.error("Wallet Connection Required", {
        description: "Please connect your wallet first to access rebalancing features",
        duration: 4000,
        action: {
          label: "Connect",
          onClick: () => {
            toast.info("Use the 'Connect Wallet' button in the header", {
              duration: 3000,
            });
          },
        },
      });
      return;
    }

    router.push('/?wallet=true&tab=home');
    
    toast.success("Welcome to Smart Rebalancing!", {
      description: "You can now create and manage your portfolio with automated rebalancing",
      duration: 3000,
    });
  };

  // Handle tab changes
  const handleTabChange = (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => {
    if (tab === 'home') {
      router.push('/');
    } else {
      router.push(`/${tab}`);
    }
  };

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
        onTabChange={handleTabChange}
        activeWalletTab={activeWalletTab}
        onWalletTabChange={(tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio') => {
          router.push(`/?wallet=true&tab=${tab}`);
        }}
        isWalletConnected={isWalletConnected}
        showWalletNavigation={showWalletSection}
        onLogoClick={() => {
          router.push('/');
        }}
      />
      
      {/* Main content */}
      <main 
        className={`flex-1 relative ${
          isHomePage
            ? 'h-screen overflow-hidden pt-16 sm:pt-20' 
            : 'min-h-screen overflow-y-auto pt-16 sm:pt-20'
        }`}
      >
        {showWalletSection && isWalletConnected ? (
          <WalletPage 
            activeWalletTab={activeWalletTab}
            onWalletTabChange={(tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio') => setActiveWalletTab(tab)}
          />
        ) : (
          <HomePage 
            activeTab={activeTab} 
            onGetStarted={handleGetStarted}
            onStartRebalancing={handleStartRebalancing}
            isWalletConnected={isWalletConnected}
          />
        )}
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
}