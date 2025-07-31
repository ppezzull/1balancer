"use client";

import { usePathname } from "next/navigation";
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
  
  // Hide header and footer in dashboard since it has its own navigation
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Hidden during loading or in dashboard */}
      {!isLoading && !isDashboard && <Header />}
      
      {/* Main Content */}
      <main className={isLoading ? "h-screen" : isDashboard ? "min-h-screen" : "flex-1"}>
        {children}
      </main>
      
      {/* Footer - Hidden during loading or in dashboard */}
      {!isLoading && !isDashboard && <Footer />}
    </div>
  );
}