"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { CryptoTicker } from "./CryptoTicker";
import { Toaster } from "sonner";
import { useLoading } from "~~/contexts/LoadingContext";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { isLoading } = useLoading();
  const pathname = usePathname();
  const router = useRouter();
  
  // Hide header and footer in dashboard since it has its own navigation
  const isDashboard = pathname === '/dashboard';

  // Determine active tab based on pathname
  const getActiveTab = (): 'home' | 'about' | 'rebalance' | 'top-performers' => {
    if (pathname === '/about') return 'about';
    if (pathname === '/rebalance') return 'rebalance';
    if (pathname === '/top-performers') return 'top-performers';
    return 'home';
  };

  // Handle tab navigation
  const handleTabChange = (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => {
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'about':
        router.push('/about');
        break;
      case 'rebalance':
        router.push('/rebalance');
        break;
      case 'top-performers':
        router.push('/top-performers');
        break;
    }
  };

  const isHomePage = pathname === '/';

  return (
    <div className={`flex flex-col ${isHomePage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Header - Hidden during loading or in dashboard */}
      {!isLoading && !isDashboard && (
        <Header 
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          router={router}
        />
      )}
      
      {/* Main Content */}
      <main className={
        isLoading 
          ? "h-screen" 
          : isDashboard 
            ? "min-h-screen pb-12" 
            : isHomePage 
              ? "flex-1 overflow-hidden" 
              : "flex-1 pb-12 overflow-y-auto"
      }>
        {children}
      </main>
      
      {/* Crypto Ticker - Always visible except during loading */}
      {!isLoading && <CryptoTicker />}
    </div>
  );
}