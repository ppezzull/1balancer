import { SharedPortfolio } from "../utils/types/portfolio";
import { CRYPTOCURRENCY_DATA } from "../utils/constants";

export function generateCommunityPortfolios(): SharedPortfolio[] {
  // Get saved portfolios from localStorage
  const savedPortfolios = localStorage.getItem('1balancer-wallets');
  let userPortfolios: any[] = [];
  
  if (savedPortfolios) {
    try {
      userPortfolios = JSON.parse(savedPortfolios);
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  }

  // Convert user portfolios to shared format (simulate some being public)
  const sharedUserPortfolios = userPortfolios
    .filter((_, index) => index % 2 === 0) // Simulate 50% being shared
    .map((portfolio, index) => ({
      ...portfolio,
      author: {
        username: `user${1000 + index}`,
        avatar: `U${index + 1}`,
        isVerified: Math.random() > 0.7,
        followers: Math.floor(Math.random() * 5000) + 100
      },
      performance: {
        totalValue: portfolio.totalInvestment * (1 + (Math.random() * 0.4 - 0.1)),
        totalReturn: portfolio.totalInvestment * (Math.random() * 0.3),
        returnPercentage: (Math.random() * 40) - 10,
        dailyChange: portfolio.totalInvestment * (Math.random() * 0.02 - 0.01),
        dailyChangePercentage: (Math.random() * 6) - 3
      },
      metrics: {
        likes: Math.floor(Math.random() * 200) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
        bookmarks: Math.floor(Math.random() * 100) + 10,
        comments: Math.floor(Math.random() * 30) + 2
      },
      strategy: {
        description: `A ${portfolio.presetType || 'custom'} investment strategy focusing on long-term growth and diversification across multiple asset classes.`,
        riskLevel: portfolio.presetType === 'aggressive' ? 'aggressive' : portfolio.presetType === 'balanced' ? 'moderate' : 'conservative',
        timeHorizon: portfolio.type === 'autoinvest' ? 'Long-term (3-5 years)' : 'Medium-term (1-3 years)',
        rebalanceFrequency: portfolio.type === 'autoinvest' ? 'Monthly' : 'Quarterly'
      },
      tags: [
        portfolio.presetType || 'custom',
        portfolio.type,
        'DeFi',
        'Diversified'
      ],
      isPublic: true,
      category: portfolio.presetType === 'aggressive' ? 'growth' : 'yield'
    }));

  // Add some famous mock portfolios
  const mockPortfolios: SharedPortfolio[] = [
    {
      id: 'community-defi-master',
      name: 'DeFi Yield Maximizer Pro',
      author: {
        username: 'defimaster2024',
        avatar: 'DM',
        isVerified: true,
        followers: 15420
      },
      type: 'manual',
      presetType: 'aggressive',
      totalInvestment: 75000,
      allocations: [
        {
          symbol: 'SLD',
          name: 'Shield StableCoin',
          percentage: 25,
          color: '#2F5586',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center',
          amount: 18750
        },
        {
          symbol: 'UNI',
          name: 'Uniswap',
          percentage: 30,
          color: '#FF007A',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'UNI')?.image || '',
          amount: 22500
        },
        {
          symbol: 'AAVE',
          name: 'Aave',
          percentage: 25,
          color: '#B6509E',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'AAVE')?.image || '',
          amount: 18750
        },
        {
          symbol: 'CRV',
          name: 'Curve DAO Token',
          percentage: 20,
          color: '#FF0000',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'CRV')?.image || '',
          amount: 15000
        }
      ],
      performance: {
        totalValue: 95500,
        totalReturn: 20500,
        returnPercentage: 27.33,
        dailyChange: 1200,
        dailyChangePercentage: 1.27
      },
      metrics: {
        likes: 342,
        shares: 89,
        bookmarks: 156,
        comments: 47
      },
      strategy: {
        description: 'Advanced DeFi yield farming strategy combining liquidity provision, governance token staking, and automated rebalancing for maximum returns.',
        riskLevel: 'aggressive',
        timeHorizon: 'Long-term (2-4 years)',
        rebalanceFrequency: 'Weekly'
      },
      tags: ['DeFi', 'Yield Farming', 'High APY', 'Advanced'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      isPublic: true,
      category: 'defi'
    },
    {
      id: 'community-layer2-growth',
      name: 'Layer 2 Scaling Giants',
      author: {
        username: 'scalingpro',
        avatar: 'L2',
        isVerified: true,
        followers: 8900
      },
      type: 'autoinvest',
      presetType: 'moderate',
      totalInvestment: 50000,
      allocations: [
        {
          symbol: 'SLD',
          name: 'Shield StableCoin',
          percentage: 30,
          color: '#2F5586',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center',
          amount: 15000
        },
        {
          symbol: 'MATIC',
          name: 'Polygon',
          percentage: 28,
          color: '#8247E5',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'MATIC')?.image || '',
          amount: 14000
        },
        {
          symbol: 'OP',
          name: 'Optimism',
          percentage: 22,
          color: '#FF0420',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'OP')?.image || '',
          amount: 11000
        },
        {
          symbol: 'ARB',
          name: 'Arbitrum',
          percentage: 20,
          color: '#2D374B',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'ARB')?.image || '',
          amount: 10000
        }
      ],
      performance: {
        totalValue: 62300,
        totalReturn: 12300,
        returnPercentage: 24.6,
        dailyChange: -450,
        dailyChangePercentage: -0.72
      },
      metrics: {
        likes: 198,
        shares: 45,
        bookmarks: 87,
        comments: 23
      },
      strategy: {
        description: 'Focused investment in Layer 2 scaling solutions that are revolutionizing Ethereum, with regular DCA for long-term accumulation.',
        riskLevel: 'moderate',
        timeHorizon: 'Long-term (3-5 years)',
        rebalanceFrequency: 'Monthly'
      },
      tags: ['Layer 2', 'Scaling', 'Ethereum', 'DCA'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isPublic: true,
      category: 'layer2'
    },
    {
      id: 'community-institutional',
      name: 'Institutional Grade Portfolio',
      author: {
        username: 'institutionalfund',
        avatar: 'IF',
        isVerified: true,
        followers: 25600
      },
      type: 'manual',
      presetType: 'conservative',
      totalInvestment: 150000,
      allocations: [
        {
          symbol: 'SLD',
          name: 'Shield StableCoin',
          percentage: 40,
          color: '#2F5586',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center',
          amount: 60000
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          percentage: 25,
          color: '#2775CA',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'USDC')?.image || '',
          amount: 37500
        },
        {
          symbol: 'LINK',
          name: 'Chainlink',
          percentage: 20,
          color: '#2A5ADA',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'LINK')?.image || '',
          amount: 30000
        },
        {
          symbol: 'MKR',
          name: 'Maker',
          percentage: 15,
          color: '#1AAB9B',
          image: CRYPTOCURRENCY_DATA.find(c => c.symbol === 'MKR')?.image || '',
          amount: 22500
        }
      ],
      performance: {
        totalValue: 168750,
        totalReturn: 18750,
        returnPercentage: 12.5,
        dailyChange: 820,
        dailyChangePercentage: 0.49
      },
      metrics: {
        likes: 456,
        shares: 127,
        bookmarks: 289,
        comments: 78
      },
      strategy: {
        description: 'Conservative institutional-grade portfolio emphasizing capital preservation with steady growth through blue-chip DeFi protocols.',
        riskLevel: 'conservative',
        timeHorizon: 'Long-term (5+ years)',
        rebalanceFrequency: 'Quarterly'
      },
      tags: ['Institutional', 'Conservative', 'Blue Chip', 'Stable Growth'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isPublic: true,
      category: 'institutional'
    }
  ];

  return [...sharedUserPortfolios, ...mockPortfolios];
}