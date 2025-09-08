import LiveCryptoTickerServer from "~~/components/layout/footer/LiveCryptoTickerServer";
import { ScaffoldEthAppWithProviders } from "~~/components/layout/provider/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/layout/provider/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Scaffold-ETH 2 App",
  description: "Built with 🏗 Scaffold-ETH 2",
});

// Allow dynamic SSR so the server ticker can fetch at runtime
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ScaffoldEthApp = async ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
        {/* Server-rendered crypto ticker at the footer, must not be inside a client boundary */}
        <LiveCryptoTickerServer />
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
