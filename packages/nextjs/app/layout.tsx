import "./globals.css";
import { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { Toaster } from "sonner";
import { LoadingProvider } from "~~/contexts/LoadingContext";
import { LayoutContent } from "~~/components/LayoutContent";

export const metadata: Metadata = {
  title: {
    default: "1Balancer - DeFi Portfolio Management Platform",
    template: "%s | 1Balancer"
  },
  description: "The next-generation decentralized portfolio management platform. Simplify and amplify your investment strategy with innovative DeFi tools.",
  keywords: ["DeFi", "Portfolio Management", "Blockchain", "Cryptocurrency", "1Balancer", "Web3"],
  authors: [{ name: "1Balancer Team" }],
  creator: "1Balancer",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://1balancer.com",
    title: "1Balancer - DeFi Portfolio Management",
    description: "Simplify and amplify your investment strategy with innovative DeFi tools",
    siteName: "1Balancer",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "1Balancer Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "1Balancer - DeFi Portfolio Management",
    description: "Simplify and amplify your investment strategy with innovative DeFi tools",
    images: ["/og-image.jpg"],
    creator: "@1balancer"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "verification-token-here"
  }
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className="h-full">
      <body className="h-full">
        <LoadingProvider>
          <ThemeProvider themes={["light", "dark"]} defaultTheme="light">
            <ScaffoldEthAppWithProviders>
              <LayoutContent>
                {children}
              </LayoutContent>
              
              {/* Toast Notifications */}
              <Toaster 
                position="top-right"
                expand={false}
                richColors
                closeButton
              />
            </ScaffoldEthAppWithProviders>
          </ThemeProvider>
        </LoadingProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
