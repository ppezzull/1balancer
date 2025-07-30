import { Metadata } from 'next';
import { RebalanceSection } from '../../components/RebalanceSection';
import { getServerSidePortfolioData } from '../../utils/storage';

export const metadata: Metadata = {
  title: "Portfolio Rebalancer - 1Balancer",
  description: "Automatically rebalance your DeFi portfolio to maintain optimal asset allocation and maximize returns with 1Balancer's smart rebalancing tools.",
  keywords: ["Portfolio Rebalancing", "DeFi Automation", "Asset Allocation", "1Balancer"],
  openGraph: {
    title: "Smart Portfolio Rebalancing",
    description: "Maintain optimal portfolio allocation with automated rebalancing",
    images: ["/og-rebalance.jpg"]
  }
};

export default async function RebalancePage() {
  // Fetch portfolio data for rebalancing calculations
  const portfolioData = await getServerSidePortfolioData();
  
  return (
    <main className="min-h-screen bg-background">
      {/* Rebalance Interface */}
      <RebalanceSection />
      
      {/* SEO content */}
      <section className="sr-only">
        <h1>Portfolio Rebalancing - Smart Asset Allocation</h1>
        <p>
          Maintain optimal portfolio allocation with 1Balancer's intelligent rebalancing system. 
          Set target percentages, drift thresholds, and rebalancing frequency to automate your investment strategy.
        </p>
        <h2>Rebalancing Features</h2>
        <ul>
          <li>Automatic portfolio rebalancing based on custom rules</li>
          <li>Drift threshold monitoring and alerts</li>
          <li>Gas optimization for cost-effective transactions</li>
          <li>Historical rebalancing performance analysis</li>
          <li>Custom allocation strategies and presets</li>
        </ul>
        <h2>How It Works</h2>
        <ol>
          <li>Set your target allocation percentages for each asset</li>
          <li>Configure drift thresholds and rebalancing frequency</li>
          <li>Enable automatic rebalancing or manual triggers</li>
          <li>Monitor performance and adjust strategy as needed</li>
        </ol>
      </section>
    </main>
  );
}