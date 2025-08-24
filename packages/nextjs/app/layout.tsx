import "./globals.css";
import { ScaffoldEthAppWithProviders } from "~~/components/providers/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/providers/ThemeProvider";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Scaffold-ETH 2 App",
  description: "Built with 🏗 Scaffold-ETH 2",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider 
          themes={["light", "dark"]}
          defaultTheme="dark"
          enableSystem={true}
          attribute="class"
          disableTransitionOnChange={false}
        >
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
