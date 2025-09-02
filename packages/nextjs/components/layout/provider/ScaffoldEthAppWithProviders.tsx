"use client";

import { useEffect } from "react";
import { usePathname } from "next/dist/client/components/navigation";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { HeaderSimplified } from "~~/components/layout/header/HeaderSimplified";
import { SupabaseProvider } from "~~/components/layout/provider/SupabaseProvider";
import { LiveCryptoTicker } from "~~/components/shared/interactive/LiveCryptoTicker";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { privyConfig } from "~~/services/web3/privyConfig";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { initializeDefaultPortfolios } from "~~/utils/constants";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  const pathname = usePathname();

  useEffect(() => {
    initializeDefaultPortfolios();
  }, []);

  // Check if we're on a wallet page
  const isWalletPage = pathname.startsWith("/wallet");

  // Check if we're on the root page
  const isRootPage = pathname === "/";

  // Show footer on non-wallet pages only
  const showFooter = !isWalletPage;

  return (
    <div className={`min-h-screen flex flex-col ${isRootPage ? "viewport-fixed" : ""}`}>
      <HeaderSimplified />
      {/* <PrivyCustomConnectButton /> */}

      {/* Main content with proper spacing for fixed header and footer */}
      <main
        className={`flex-1 ${showFooter ? "fixed-navbar-offset pb-20" : "fixed-navbar-offset"} ${isRootPage ? "perfect-center" : "overflow-auto"}`}
      >
        {children}
      </main>

      {/* Footer - only show on non-wallet pages */}
      {showFooter && <LiveCryptoTicker />}

      <Toaster />
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
          <SupabaseProvider>
            <ProgressBar height="3px" color="#2299dd" options={{ showSpinner: false }} />
            <ScaffoldEthApp>{children}</ScaffoldEthApp>
          </SupabaseProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
