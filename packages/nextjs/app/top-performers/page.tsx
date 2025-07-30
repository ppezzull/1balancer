import { Metadata } from 'next';
import { TopPerformersSection } from '../../components/figma/sections/TopPerformersSection';
import { getServerSidePortfolioData, getTopPerformingPortfolios } from '../../utils/storage';

export const metadata: Metadata = {
  title: "Top Performing Portfolios - 1Balancer",
  description: "Discover and copy the best performing DeFi portfolios from experienced traders. Learn from successful strategies and optimize your returns.",
  keywords: ["Top Portfolios", "DeFi Performance", "Copy Trading", "Portfolio Strategies", "1Balancer"],
  openGraph: {
    title: "Top Performing DeFi Portfolios",
    description: "Discover successful investment strategies from top performers",
    images: ["/og-top-performers.jpg"]
  }
};

export default async function TopPerformersPage() {
  // Fetch portfolio performance data
  const [portfolioData, topPortfolios] = await Promise.all([
    getServerSidePortfolioData(),
    Promise.resolve(getTopPerformingPortfolios(20)) // Get top 20 performers
  ]);
  
  return (
    <main className="min-h-screen bg-background">
      {/* Top Performers Section from Figma Pro */}
      <TopPerformersSection />
      
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Top Performing DeFi Portfolios",
            "description": "Discover the best performing decentralized finance portfolios",
            "url": "https://1balancer.com/top-performers",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": topPortfolios.slice(0, 10).map((portfolio, index) => ({
                "@type": "Investment",
                "position": index + 1,
                "name": portfolio.name,
                "description": portfolio.description,
                "returnValue": `${portfolio.performance.returnPercentage}%`,
                "author": {
                  "@type": "Person",
                  "name": portfolio.author.username
                }
              }))
            }
          })
        }}
      />
      
      {/* SEO content */}
      <section className="sr-only">
        <h1>Top Performing DeFi Portfolios</h1>
        <p>
          Explore the most successful DeFi portfolio strategies from experienced traders and investors. 
          Learn from their allocation decisions, risk management approaches, and performance metrics.
        </p>
        <h2>Featured Portfolio Categories</h2>
        <ul>
          <li>Conservative DeFi - Low risk, steady returns</li>
          <li>Growth Strategies - High potential, moderate risk</li>
          <li>Layer 2 Focus - Scaling solution investments</li>
          <li>Yield Farming - Optimized for passive income</li>
          <li>Blue Chip Crypto - Established token portfolios</li>
        </ul>
        <h2>Performance Metrics</h2>
        <p>
          All portfolios are ranked by risk-adjusted returns, considering factors like Sharpe ratio, 
          maximum drawdown, volatility, and consistency of performance over different market conditions.
        </p>
      </section>
    </main>
  );
}