import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useIsMobile } from "./ui/use-mobile";
import { useTheme } from "./ui/use-theme";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Star,
  Eye,
  PieChart,
  Calendar,
  DollarSign,
  Target,
  Send,
  UserPlus,
  Bookmark,
  MoreVertical,
  X,
  ExternalLink,
  Crown,
  Shield,
  Zap,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { getPortfolios, Portfolio, getUserProfile, CRYPTOCURRENCY_DATA } from "~~/utils/constants";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface SocialPortfolio extends Portfolio {
  user: {
    id: string;
    username: string;
    avatar?: string;
    followers: number;
    isFollowing: boolean;
    joinDate: string;
    bio?: string;
    isVerified?: boolean;
    level?: 'Beginner' | 'Intermediate' | 'Expert' | 'Pro';
  };
  likes: number;
  comments: Comment[];
  shares: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

// Expanded Mock Users with more diverse profiles
const MOCK_USERS = [
  {
    id: "user1",
    username: "DeFiAlpha",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 2840,
    isFollowing: false,
    joinDate: "2023-03-15",
    bio: "Professional DeFi strategist with 5+ years experience in portfolio optimization. Specialized in yield farming and risk management.",
    isVerified: true,
    level: "Expert" as const
  },
  {
    id: "user2", 
    username: "CryptoSage",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 1560,
    isFollowing: true,
    joinDate: "2023-01-20",
    bio: "Long-term investor focused on sustainable crypto growth strategies. Believers in DeFi revolution and decentralized finance future.",
    isVerified: false,
    level: "Intermediate" as const
  },
  {
    id: "user3",
    username: "YieldMaster",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b814?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 892,
    isFollowing: false,
    joinDate: "2023-06-10",
    bio: "Yield farming expert specializing in high-APY strategies. Always looking for the next big opportunity in DeFi protocols.",
    isVerified: false,
    level: "Expert" as const
  },
  {
    id: "user4",
    username: "StableCoin_Pro",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 3200,
    isFollowing: true,
    joinDate: "2022-11-05",
    bio: "Conservative investor focused on stable returns and risk management. 10+ years in traditional finance, now exploring DeFi safely.",
    isVerified: true,
    level: "Pro" as const
  },
  {
    id: "user5",
    username: "LayerTwoLover",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 1245,
    isFollowing: false,
    joinDate: "2023-08-22",
    bio: "Layer 2 enthusiast and early adopter. Arbitrum and Optimism maximalist. Building the future of scalable DeFi one transaction at a time.",
    isVerified: false,
    level: "Intermediate" as const
  },
  {
    id: "user6",
    username: "NFTPortfolioGuru",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 2180,
    isFollowing: true,
    joinDate: "2023-02-14",
    bio: "Combining traditional portfolio theory with NFT and gaming tokens. Creating balanced exposure across DeFi, gaming, and metaverse.",
    isVerified: false,
    level: "Expert" as const
  },
  {
    id: "user7",
    username: "QuantDeFi",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 3890,
    isFollowing: false,
    joinDate: "2022-09-30",
    bio: "Quantitative analyst applying mathematical models to DeFi. PhD in Finance, creating algorithmic strategies for optimal portfolio allocation.",
    isVerified: true,
    level: "Pro" as const
  },
  {
    id: "user8",
    username: "MemeTokenMania",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 967,
    isFollowing: false,
    joinDate: "2023-05-18",
    bio: "High-risk, high-reward meme token investor. DYOR always, but sometimes you just have to believe in the community and the memes! 🚀",
    isVerified: false,
    level: "Beginner" as const
  },
  {
    id: "user9",
    username: "InstitutionalCrypto",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 4567,
    isFollowing: true,
    joinDate: "2022-12-08",
    bio: "Institutional portfolio manager bringing traditional investment principles to DeFi. Focus on risk-adjusted returns and regulatory compliance.",
    isVerified: true,
    level: "Pro" as const
  },
  {
    id: "user10",
    username: "DeFiDegenerator",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 1890,
    isFollowing: false,
    joinDate: "2023-04-12",
    bio: "Full-time DeFi degen exploring the wildest protocols. Aping into new projects daily. Not financial advice, just sharing the journey! 🦍",
    isVerified: false,
    level: "Intermediate" as const
  },
  {
    id: "user11",
    username: "ETHMaximalist",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 2341,
    isFollowing: true,
    joinDate: "2022-10-15",
    bio: "Ethereum believer since 2017. Building wealth through ETH ecosystem tokens. Staking, lending, and hodling for the long term.",
    isVerified: false,
    level: "Expert" as const
  },
  {
    id: "user12",
    username: "StablecoinStrategy",
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    followers: 1567,
    isFollowing: false,
    joinDate: "2023-07-03",
    bio: "Master of stablecoin yield strategies. Finding the best rates across lending protocols while maintaining minimal risk exposure.",
    isVerified: false,
    level: "Intermediate" as const
  }
];

// Additional Mock Portfolios with diverse strategies
const ADDITIONAL_MOCK_PORTFOLIOS: Omit<SocialPortfolio, 'user' | 'likes' | 'comments' | 'shares' | 'views' | 'isLiked' | 'isBookmarked' | 'tags'>[] = [
  {
    id: 'mock_conservative_defi',
    name: 'Conservative DeFi Stack',
    tokens: [
      { symbol: 'SLD', percentage: 40, amount: 8000 },
      { symbol: 'USDC', percentage: 30, amount: 6000 },
      { symbol: 'AAVE', percentage: 15, amount: 3000 },
      { symbol: 'COMP', percentage: 10, amount: 2000 },
      { symbol: 'MKR', percentage: 5, amount: 1000 }
    ],
    totalValue: 20000,
    performance: 8.5,
    isPublic: true,
    strategy: "Low-risk approach focusing on established DeFi protocols with proven track records. Heavy weighting in stablecoins for capital preservation with selective exposure to blue-chip DeFi tokens for growth potential.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'autoinvest',
    investmentConfig: {
      initialDeposit: 15000,
      monthlyInvestment: 500,
      years: 3
    }
  },
  {
    id: 'mock_layer2_maximalist',
    name: 'Layer 2 Scaling Bet',
    tokens: [
      { symbol: 'ARB', percentage: 35, amount: 10500 },
      { symbol: 'OP', percentage: 25, amount: 7500 },
      { symbol: 'MATIC', percentage: 20, amount: 6000 },
      { symbol: 'SLD', percentage: 15, amount: 4500 },
      { symbol: 'LDO', percentage: 5, amount: 1500 }
    ],
    totalValue: 30000,
    performance: 45.2,
    isPublic: true,
    strategy: "Betting big on Ethereum Layer 2 solutions. This portfolio captures the growth of scaling solutions while maintaining some stability with stablecoins. Focus on tokens that benefit from increased L2 adoption.",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'manual'
  },
  {
    id: 'mock_yield_farming_pro',
    name: 'High-Yield DeFi Hunter',
    tokens: [
      { symbol: 'CRV', percentage: 25, amount: 6250 },
      { symbol: 'BAL', percentage: 20, amount: 5000 },
      { symbol: 'SUSHI', percentage: 20, amount: 5000 },
      { symbol: 'UNI', percentage: 15, amount: 3750 },
      { symbol: 'LDO', percentage: 10, amount: 2500 },
      { symbol: 'COMP', percentage: 10, amount: 2500 }
    ],
    totalValue: 25000,
    performance: 67.8,
    isPublic: true,
    strategy: "Aggressive yield farming strategy targeting high-APY opportunities across multiple DeFi protocols. Regular rebalancing to chase optimal yields while managing impermanent loss risk.",
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'manual'
  },
  {
    id: 'mock_gaming_metaverse',
    name: 'Gaming & Metaverse Portfolio',
    tokens: [
      { symbol: 'AXS', percentage: 30, amount: 9000 },
      { symbol: 'SAND', percentage: 25, amount: 7500 },
      { symbol: 'MANA', percentage: 20, amount: 6000 },
      { symbol: 'ENS', percentage: 15, amount: 4500 },
      { symbol: 'SLD', percentage: 10, amount: 3000 }
    ],
    totalValue: 30000,
    performance: 23.4,
    isPublic: true,
    strategy: "Focused on the intersection of gaming, NFTs, and metaverse development. Investing in platforms that are building the future of virtual worlds and digital ownership.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'autoinvest',
    investmentConfig: {
      initialDeposit: 25000,
      monthlyInvestment: 1000,
      years: 2
    }
  },
  {
    id: 'mock_meme_degen',
    name: 'Degen Meme Machine',
    tokens: [
      { symbol: 'PEPE', percentage: 40, amount: 4000 },
      { symbol: 'SHIB', percentage: 30, amount: 3000 },
      { symbol: 'FLOKI', percentage: 20, amount: 2000 },
      { symbol: 'SLD', percentage: 10, amount: 1000 }
    ],
    totalValue: 10000,
    performance: 156.7,
    isPublic: true,
    strategy: "High-risk meme token portfolio for maximum volatility and potential gains. Only invest what you can afford to lose. This is pure speculation and fun money allocation!",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'manual'
  },
  {
    id: 'mock_institutional_grade',
    name: 'Institutional Grade DeFi',
    tokens: [
      { symbol: 'SLD', percentage: 25, amount: 12500 },
      { symbol: 'USDC', percentage: 25, amount: 12500 },
      { symbol: 'LINK', percentage: 20, amount: 10000 },
      { symbol: 'AAVE', percentage: 15, amount: 7500 },
      { symbol: 'UNI', percentage: 10, amount: 5000 },
      { symbol: 'MKR', percentage: 5, amount: 2500 }
    ],
    totalValue: 50000,
    performance: 12.3,
    isPublic: true,
    strategy: "Institutional-quality portfolio emphasizing regulatory compliance and risk management. Balanced allocation across established protocols with strong governance and proven security records.",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    investmentType: 'autoinvest',
    investmentConfig: {
      initialDeposit: 40000,
      monthlyInvestment: 2000,
      years: 5
    }
  }
];

const FILTER_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'recent', label: 'Recent', icon: Calendar },
  { id: 'top-performers', label: 'Top Performers', icon: Star },
  { id: 'following', label: 'Following', icon: UserPlus }
];

// Color palette for pie charts
const PIE_COLORS = [
  '#0891b2', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#10b981', '#f97316', '#ec4899', '#06b6d4', '#84cc16',
  '#6366f1', '#d946ef', '#fb7185', '#facc15', '#22d3ee'
];

export function SocialSection() {
  const [socialPortfolios, setSocialPortfolios] = useState<SocialPortfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<SocialPortfolio | null>(null);
  const [showPortfolioDetail, setShowPortfolioDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [commentText, setCommentText] = useState("");
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // Create social portfolios with both user and mock data
  useEffect(() => {
    const userPortfolios = getPortfolios();
    const publicUserPortfolios = userPortfolios.filter(p => p.isPublic);
    const userProfile = getUserProfile();
    
    // Transform user portfolios
    const userSocialPortfolios: SocialPortfolio[] = publicUserPortfolios.map((portfolio) => {
      const mockComments: Comment[] = [
        {
          id: `comment1_${portfolio.id}`,
          userId: "commenter1",
          username: "CryptoEnthusiast",
          content: "Interesting allocation! What's your reasoning behind this distribution?",
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          likes: Math.floor(Math.random() * 15) + 1,
          isLiked: Math.random() > 0.7
        },
        {
          id: `comment2_${portfolio.id}`,
          userId: "commenter2",
          username: "PortfolioTracker",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
          content: "Thanks for sharing! This helps me understand different strategies.",
          timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: Math.floor(Math.random() * 8) + 1,
          isLiked: Math.random() > 0.5
        }
      ];

      return {
        ...portfolio,
        user: {
          id: "current_user",
          username: userProfile?.username || "You",
          followers: 42,
          isFollowing: false,
          joinDate: userProfile?.joinDate || new Date().toISOString(),
          bio: userProfile?.description || "Your portfolio strategy",
          isVerified: false,
          level: 'Beginner' as const
        },
        likes: Math.floor(Math.random() * 50) + 10,
        comments: mockComments,
        shares: Math.floor(Math.random() * 20) + 3,
        views: Math.floor(Math.random() * 200) + 50,
        isLiked: Math.random() > 0.7,
        isBookmarked: Math.random() > 0.8,
        tags: ['Your Strategy', 'Custom'].slice(0, Math.floor(Math.random() * 2) + 1)
      };
    });

    // Transform mock portfolios
    const mockSocialPortfolios: SocialPortfolio[] = ADDITIONAL_MOCK_PORTFOLIOS.map((portfolio, index) => {
      const user = MOCK_USERS[index % MOCK_USERS.length];
      const mockComments: Comment[] = [
        {
          id: `comment1_${portfolio.id}`,
          userId: "commenter1",
          username: "InvestorJane",
          content: "Great allocation strategy! How do you decide on the percentages?",
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          likes: Math.floor(Math.random() * 15) + 1,
          isLiked: Math.random() > 0.7
        },
        {
          id: `comment2_${portfolio.id}`,
          userId: "commenter2",
          username: "CryptoNewbie",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
          content: "Thanks for sharing! This helped me understand portfolio diversification better.",
          timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          likes: Math.floor(Math.random() * 8) + 1,
          isLiked: Math.random() > 0.5
        }
      ];

      const strategyTags = {
        'Conservative DeFi Stack': ['Conservative', 'Stablecoins', 'Low-Risk'],
        'Layer 2 Scaling Bet': ['Layer2', 'Scaling', 'High-Growth'],
        'High-Yield DeFi Hunter': ['Yield-Farming', 'High-Risk', 'DeFi'],
        'Gaming & Metaverse Portfolio': ['Gaming', 'NFTs', 'Metaverse'],
        'Degen Meme Machine': ['Meme', 'High-Risk', 'Speculative'],
        'Institutional Grade DeFi': ['Institutional', 'Conservative', 'Compliant']
      };

      return {
        ...portfolio,
        user,
        likes: Math.floor(Math.random() * 200) + 30,
        comments: mockComments,
        shares: Math.floor(Math.random() * 80) + 10,
        views: Math.floor(Math.random() * 800) + 150,
        isLiked: Math.random() > 0.6,
        isBookmarked: Math.random() > 0.8,
        tags: strategyTags[portfolio.name as keyof typeof strategyTags] || ['DeFi', 'Strategy']
      };
    });

    // Combine both arrays
    const allSocialPortfolios = [...userSocialPortfolios, ...mockSocialPortfolios];
    setSocialPortfolios(allSocialPortfolios);
  }, []);

  // Filter portfolios based on search and filter
  const filteredPortfolios = useMemo(() => {
    let filtered = socialPortfolios;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(portfolio => 
        portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        portfolio.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        portfolio.strategy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        portfolio.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply selected filter
    switch (selectedFilter) {
      case 'trending':
        filtered = filtered.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'top-performers':
        filtered = filtered.sort((a, b) => b.performance - a.performance);
        break;
      case 'following':
        filtered = filtered.filter(portfolio => portfolio.user.isFollowing);
        break;
    }

    return filtered;
  }, [socialPortfolios, searchTerm, selectedFilter]);

  const handleLikePortfolio = useCallback((portfolioId: string) => {
    setSocialPortfolios(prev => prev.map(portfolio => {
      if (portfolio.id === portfolioId) {
        return {
          ...portfolio,
          isLiked: !portfolio.isLiked,
          likes: portfolio.isLiked ? portfolio.likes - 1 : portfolio.likes + 1
        };
      }
      return portfolio;
    }));
  }, []);

  const handleBookmarkPortfolio = useCallback((portfolioId: string) => {
    setSocialPortfolios(prev => prev.map(portfolio => {
      if (portfolio.id === portfolioId) {
        return {
          ...portfolio,
          isBookmarked: !portfolio.isBookmarked
        };
      }
      return portfolio;
    }));
    
    toast.success("Portfolio bookmarked!", {
      description: "You can find it in your saved portfolios",
      duration: 2000,
    });
  }, []);

  const handleFollowUser = useCallback((userId: string) => {
    setSocialPortfolios(prev => prev.map(portfolio => {
      if (portfolio.user.id === userId) {
        return {
          ...portfolio,
          user: {
            ...portfolio.user,
            isFollowing: !portfolio.user.isFollowing,
            followers: portfolio.user.isFollowing 
              ? portfolio.user.followers - 1 
              : portfolio.user.followers + 1
          }
        };
      }
      return portfolio;
    }));
  }, []);

  const handleSharePortfolio = useCallback((portfolio: SocialPortfolio) => {
    // Mock sharing functionality
    navigator.clipboard?.writeText(`Check out this portfolio by ${portfolio.user.username}: ${portfolio.name}`);
    toast.success("Portfolio link copied to clipboard!", {
      duration: 2000,
    });
  }, []);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim() || !selectedPortfolio) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId: "current_user",
      username: "You",
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };

    setSocialPortfolios(prev => prev.map(portfolio => {
      if (portfolio.id === selectedPortfolio.id) {
        return {
          ...portfolio,
          comments: [...portfolio.comments, newComment]
        };
      }
      return portfolio;
    }));

    setCommentText("");
    toast.success("Comment added!", { duration: 2000 });
  }, [commentText, selectedPortfolio]);

  const handlePortfolioClick = useCallback((portfolio: SocialPortfolio) => {
    setSelectedPortfolio(portfolio);
    setShowPortfolioDetail(true);
    
    // Increment view count
    setSocialPortfolios(prev => prev.map(p => 
      p.id === portfolio.id ? { ...p, views: p.views + 1 } : p
    ));
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Pro': return <Crown className="w-3 h-3" />;
      case 'Expert': return <Award className="w-3 h-3" />;
      case 'Intermediate': return <Zap className="w-3 h-3" />;
      default: return <Shield className="w-3 h-3" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Pro': return 'text-yellow-500';
      case 'Expert': return 'text-purple-500';
      case 'Intermediate': return 'text-blue-500';
      default: return 'text-green-500';
    }
  };

  // Prepare data for pie chart
  const preparePieChartData = (portfolio: SocialPortfolio) => {
    if (!portfolio || !portfolio.tokens || portfolio.tokens.length === 0) {
      return [];
    }
    
    return portfolio.tokens.map((token, index) => {
      const cryptoData = CRYPTOCURRENCY_DATA.find(c => c.symbol === token.symbol);
      return {
        name: token.symbol,
        value: token.percentage || 0,
        amount: token.amount || 0,
        fullName: cryptoData?.name || token.symbol,
        color: PIE_COLORS[index % PIE_COLORS.length]
      };
    });
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">Symbol: {data.name}</p>
          <p className="text-sm text-cyan-600 dark:text-cyan-400">
            {data.value}% (${data.amount.toLocaleString()})
          </p>
        </div>
      );
    }
    return null;
  };

  // Mini Pie Chart Component
  const MiniPieChart = ({ data, size = 120 }: { data: any[], size?: number }) => {
    if (!data || data.length === 0) {
      return (
        <div 
          className="flex items-center justify-center bg-muted/20 rounded-full"
          style={{ width: size, height: size }}
        >
          <PieChart className="w-6 h-6 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.3}
              outerRadius={size * 0.45}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPortfolioCard = (portfolio: SocialPortfolio) => {
    if (!portfolio) return null;
    
    const pieData = preparePieChartData(portfolio);
    
    return (
      <motion.div
        key={portfolio.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card 
          className="border border-border/30 backdrop-blur-sm hover:border-border/50 transition-all duration-200 cursor-pointer overflow-hidden group"
          style={{ background: 'var(--card-bg)' }}
          onClick={() => handlePortfolioClick(portfolio)}
        >
          <CardHeader className="pb-3">
            {/* User Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={portfolio.user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                    {portfolio.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{portfolio.user.username}</p>
                    {portfolio.user.isVerified && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 text-xs ${getLevelColor(portfolio.user.level || 'Beginner')}`}>
                      {getLevelIcon(portfolio.user.level || 'Beginner')}
                      <span>{portfolio.user.level}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{portfolio.user.followers.toLocaleString()} followers</p>
                </div>
              </div>
              {portfolio.user.id !== "current_user" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowUser(portfolio.user.id);
                  }}
                  className={`text-xs ${portfolio.user.isFollowing ? 'bg-accent' : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'}`}
                >
                  {portfolio.user.isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            {/* Portfolio Title and Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors">
                  {portfolio.name}
                </h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                  portfolio.performance >= 0 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {portfolio.performance >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{portfolio.performance >= 0 ? '+' : ''}{portfolio.performance.toFixed(2)}%</span>
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {portfolio.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Portfolio Value and Pie Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">${portfolio.totalValue.toLocaleString()}</span>
              </div>

              {/* Pie Chart Visualization */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <MiniPieChart data={pieData} size={isMobile ? 80 : 100} />
                </div>
                
                {/* Top Holdings */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-2">Top Holdings</p>
                  <div className="space-y-1">
                    {portfolio.tokens && portfolio.tokens.slice(0, isMobile ? 3 : 4).map((token, index) => (
                      <div key={token.symbol || index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-muted-foreground truncate">{token.symbol || 'N/A'}</span>
                        </div>
                        <span className="font-medium text-foreground">{token.percentage || 0}%</span>
                      </div>
                    ))}
                    {portfolio.tokens && portfolio.tokens.length > (isMobile ? 3 : 4) && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{portfolio.tokens.length - (isMobile ? 3 : 4)} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border/20">
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikePortfolio(portfolio.id);
                    }}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      portfolio.isLiked 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${portfolio.isLiked ? 'fill-current' : ''}`} />
                    <span>{portfolio.likes}</span>
                  </button>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span>{portfolio.comments.length}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{portfolio.views}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkPortfolio(portfolio.id);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      portfolio.isBookmarked
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-muted-foreground hover:text-yellow-500'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${portfolio.isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSharePortfolio(portfolio);
                    }}
                    className="p-1 rounded-full text-muted-foreground hover:text-cyan-500 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="py-8 bg-background transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            <span 
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradient-primary)' }}
            >
              Social Trading
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and share investment strategies with the community. Learn from top performers and connect with fellow investors.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search portfolios, users, or strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 border-border/30"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {FILTER_OPTIONS.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`transition-all duration-200 ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-card/50 border-border/30'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          {filteredPortfolios.length === 0 ? (
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Portfolios Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Try adjusting your search criteria or browse different categories."
                    : "No portfolios match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPortfolios.map((portfolio) => renderPortfolioCard(portfolio))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Portfolio Detail Modal */}
      <AnimatePresence>
        {showPortfolioDetail && selectedPortfolio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowPortfolioDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-default ${
                isMobile ? 'mx-2' : 'mx-4'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Card 
                className="border border-border/30"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <CardHeader className="border-b border-border/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedPortfolio.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                          {selectedPortfolio.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-foreground">{selectedPortfolio.name}</h2>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                            selectedPortfolio.performance >= 0 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {selectedPortfolio.performance >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{selectedPortfolio.performance >= 0 ? '+' : ''}{selectedPortfolio.performance.toFixed(2)}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {selectedPortfolio.user.username} • ${selectedPortfolio.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPortfolioDetail(false)}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pie Chart */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Portfolio Allocation</h3>
                      <div className="w-full h-80">
                        {selectedPortfolio && selectedPortfolio.tokens && selectedPortfolio.tokens.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={preparePieChartData(selectedPortfolio)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {preparePieChartData(selectedPortfolio).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                formatter={(value, entry: any) => (
                                  <span style={{ color: entry.color }}>
                                    {value} ({entry.payload.value}%)
                                  </span>
                                )}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">No portfolio data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Portfolio Details */}
                    <div className="space-y-6">
                      {/* Strategy Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Investment Strategy</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {selectedPortfolio.strategy}
                        </p>
                      </div>

                      {/* Token Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Token Breakdown</h3>
                        <div className="space-y-3">
                          {selectedPortfolio.tokens && selectedPortfolio.tokens.map((token, index) => {
                            const cryptoData = CRYPTOCURRENCY_DATA.find(c => c.symbol === token.symbol);
                            return (
                              <div key={token.symbol || index} className="flex items-center justify-between p-3 rounded-lg bg-accent/20">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                  />
                                  <div>
                                    <p className="font-medium text-foreground">{token.symbol || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">{cryptoData?.name || token.symbol || 'Unknown Token'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">{token.percentage || 0}%</p>
                                  <p className="text-xs text-muted-foreground">${(token.amount || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* User Info and Actions */}
                      <div className="pt-4 border-t border-border/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedPortfolio.user.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs">
                                {selectedPortfolio.user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{selectedPortfolio.user.username}</p>
                              <p className="text-xs text-muted-foreground">{selectedPortfolio.user.followers.toLocaleString()} followers</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBookmarkPortfolio(selectedPortfolio.id)}
                              className={selectedPortfolio.isBookmarked ? 'text-yellow-500' : ''}
                            >
                              <Bookmark className={`w-4 h-4 mr-1 ${selectedPortfolio.isBookmarked ? 'fill-current' : ''}`} />
                              {selectedPortfolio.isBookmarked ? 'Saved' : 'Save'}
                            </Button>
                            
                            {selectedPortfolio.user.id !== "current_user" && (
                              <Button
                                variant={selectedPortfolio.user.isFollowing ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleFollowUser(selectedPortfolio.user.id)}
                                className={!selectedPortfolio.user.isFollowing ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600' : ''}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                {selectedPortfolio.user.isFollowing ? 'Following' : 'Follow'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-8 pt-6 border-t border-border/20">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Comments ({selectedPortfolio.comments.length})
                    </h3>
                    
                    {/* Add Comment */}
                    <div className="mb-6">
                      <div className="flex gap-3">
                        <Textarea
                          placeholder="Share your thoughts about this strategy..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 min-h-[80px] bg-card/50 border-border/30"
                        />
                        <Button
                          onClick={handleAddComment}
                          disabled={!commentText.trim()}
                          className="self-end bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {selectedPortfolio.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs">
                              {comment.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-accent/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-foreground text-sm">{comment.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm text-foreground">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                                <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current text-red-500' : ''}`} />
                                <span>{comment.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}