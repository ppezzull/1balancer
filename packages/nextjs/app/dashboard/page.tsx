import { Metadata } from 'next';
import { DashboardClient } from '../../components/DashboardClient';
import { getServerSidePortfolioData, getServerSideMarketData, getServerSideUserData } from '../../utils/storage';

export const metadata: Metadata = {
  title: "Portfolio Dashboard - 1Balancer",
  description: "Monitor your DeFi portfolio performance, track holdings, and analyze market trends with 1Balancer's comprehensive dashboard.",
  keywords: ["Portfolio Dashboard", "DeFi Analytics", "Crypto Portfolio", "1Balancer"],
  robots: "noindex" // Dashboard should not be indexed as it's user-specific
};

export default async function DashboardPage() {
  // Fetch all necessary data server-side
  const [portfolioData, marketData, userData] = await Promise.all([
    getServerSidePortfolioData(),
    getServerSideMarketData(),
    getServerSideUserData()
  ]);
  
  return (
    <>
      <DashboardClient 
        portfolioData={portfolioData}
        marketData={marketData} 
        userData={userData}
      />
      
      {/* Hidden data for SSR hydration */}
      <script
        type="application/json"
        id="dashboard-data"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            portfolio: portfolioData,
            market: marketData,
            user: userData,
            timestamp: new Date().toISOString()
          })
        }}
      />
      
      {/* SEO content for search engines */}
      <section className="sr-only">
        <h1>Portfolio Dashboard</h1>
        <p>
          Monitor your cryptocurrency portfolio performance with real-time analytics, 
          track token holdings across multiple networks, and analyze market trends.
        </p>
        <h2>Dashboard Features</h2>
        <ul>
          <li>Real-time portfolio valuation and performance tracking</li>
          <li>Multi-network token holdings overview</li>
          <li>Interactive charts and analytics</li>
          <li>Portfolio allocation visualization</li>
          <li>Transaction history and analysis</li>
          <li>Social trading and portfolio sharing</li>
          <li>Advanced trading interface</li>
          <li>User profile and settings management</li>
        </ul>
      </section>
    </>
  );
}