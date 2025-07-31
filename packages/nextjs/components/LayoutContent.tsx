"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Hidden during loading or in dashboard */}
      {!isLoading && !isDashboard && (
        <Header 
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          router={router}
        />
      )}
      
      {/* Main Content */}
      <main className={isLoading ? "h-screen" : isDashboard ? "min-h-screen" : "flex-1"}>
        {children}
      </main>
      
      {/* Footer - Hidden during loading or in dashboard */}
      {!isLoading && !isDashboard && <Footer />}
    </div>
  );
}