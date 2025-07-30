import { Metadata } from 'next';
import { AboutSection } from '../../components/figma/sections/AboutSection';
import { getServerSidePortfolioData } from '../../utils/storage';

export const metadata: Metadata = {
  title: "About 1Balancer - Next-Generation DeFi Portfolio Management",
  description: "Learn about 1Balancer's mission to democratize sophisticated portfolio management strategies through innovative DeFi technology.",
  keywords: ["DeFi", "Portfolio Management", "Blockchain", "1Balancer", "Crypto"],
  openGraph: {
    title: "About 1Balancer",
    description: "The next-generation decentralized portfolio management platform",
    images: ["/og-about.jpg"]
  }
};

export default async function AboutPage() {
  // Fetch data server-side for SEO and performance
  const data = await getServerSidePortfolioData();
  
  return (
    <main className="min-h-screen">
      {/* Hero and About Sections from Figma Pro */}
      <AboutSection />
      
      {/* Additional SEO content */}
      <section className="sr-only">
        <h1>About 1Balancer - DeFi Portfolio Management Platform</h1>
        <p>
          1Balancer is a revolutionary decentralized portfolio management platform that simplifies 
          and amplifies your investment strategy through innovative DeFi technology. Our mission is 
          to democratize access to sophisticated portfolio optimization techniques.
        </p>
        <h2>Platform Features</h2>
        <ul>
          <li>Smart Portfolio Balancing with AI-powered optimization</li>
          <li>Visual Portfolio Analytics with interactive charts</li>
          <li>Secure Wallet Management with bank-grade security</li>
          <li>Performance Tracking with real-time analytics</li>
          <li>Automated Rebalancing based on market conditions</li>
        </ul>
        <h2>Technology Stack</h2>
        <p>
          Built on cutting-edge blockchain technology with smart contracts, cross-chain analytics, 
          and real-time DeFi integration for a seamless user experience.
        </p>
      </section>
    </main>
  );
}