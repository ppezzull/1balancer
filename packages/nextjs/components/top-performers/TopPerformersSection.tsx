import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Crown,
  Filter,
  Heart,
  Search,
  Share,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Badge } from "~~/components/shared/badge";
import { Button } from "~~/components/shared/button";
import { Card, CardContent, CardHeader } from "~~/components/shared/card";
import { Input } from "~~/components/shared/input";
import { useInViewAnimation } from "~~/components/shared/interactive/useInViewAnimation";
import { PortfolioDetailModal } from "~~/components/shared/modals/PortfolioDetailModal";
import { useIsMobile } from "~~/components/shared/use-mobile";
import { useTheme } from "~~/components/shared/use-theme";
import { SharedPortfolio } from "~~/types/portfolio";
import { generateCommunityPortfolios } from "~~/utils/portfolio-generator";

export function TopPerformersSection() {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation<HTMLDivElement>();
  const { ref: performersRef, isInView: performersInView } = useInViewAnimation<HTMLDivElement>();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("performance");
  const [selectedPortfolio, setSelectedPortfolio] = useState<SharedPortfolio | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [communityPortfolios, setCommunityPortfolios] = useState<SharedPortfolio[]>([]);

  // Generate portfolios on mount
  useEffect(() => {
    const portfolios = generateCommunityPortfolios();
    setCommunityPortfolios(portfolios);
  }, []);

  // Filter and sort portfolios
  const filteredAndSortedPortfolios = useMemo(() => {
    let filtered = communityPortfolios;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        portfolio =>
          portfolio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          portfolio.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          portfolio.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(portfolio => portfolio.category === selectedCategory);
    }

    // Sort portfolios
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "performance":
          return b.performance.returnPercentage - a.performance.returnPercentage;
        case "likes":
          return b.metrics.likes - a.metrics.likes;
        case "followers":
          return b.author.followers - a.author.followers;
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [communityPortfolios, searchQuery, selectedCategory, sortBy]);

  const handlePortfolioClick = (portfolio: SharedPortfolio) => {
    setSelectedPortfolio(portfolio);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedPortfolio(null);
  };

  const categories = [
    { id: "all", label: "All Portfolios", count: communityPortfolios.length },
    { id: "defi", label: "DeFi", count: communityPortfolios.filter(p => p.category === "defi").length },
    { id: "layer2", label: "Layer 2", count: communityPortfolios.filter(p => p.category === "layer2").length },
    { id: "yield", label: "Yield", count: communityPortfolios.filter(p => p.category === "yield").length },
    { id: "growth", label: "Growth", count: communityPortfolios.filter(p => p.category === "growth").length },
    {
      id: "institutional",
      label: "Institutional",
      count: communityPortfolios.filter(p => p.category === "institutional").length,
    },
  ];

  const sortOptions = [
    { id: "performance", label: "Best Performance" },
    { id: "likes", label: "Most Liked" },
    { id: "followers", label: "Top Authors" },
    { id: "recent", label: "Most Recent" },
  ];

  return (
    <section id="top-performers" className="py-20 transition-colors duration-300 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-foreground mb-6 transition-colors duration-300">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Top Performers
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto transition-colors duration-300 leading-relaxed">
            Discover and learn from the most successful portfolio strategies shared by our community of expert traders
            and investors.
          </p>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div
            className={`flex ${isMobile ? "flex-col space-y-4" : "flex-row items-center justify-between"} gap-4 mb-6`}
          >
            {/* Search Bar */}
            <div className={`relative ${isMobile ? "w-full" : "flex-1 max-w-md"}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search portfolios, authors, or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/30 transition-colors duration-300"
              />
            </div>

            {/* Sort Dropdown */}
            <div className={`flex items-center gap-3 ${isMobile ? "w-full justify-between" : ""}`}>
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={`bg-card/50 border border-border/30 rounded-md px-3 py-2 text-sm transition-colors duration-300 ${
                  isMobile ? "flex-1" : ""
                }`}
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filters */}
          <div className={`flex ${isMobile ? "overflow-x-auto scrollbar-hide" : "flex-wrap"} gap-2`}>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`transition-all duration-300 ${isMobile ? "flex-shrink-0" : ""} ${
                  selectedCategory === category.id ? "shadow-lg" : "hover:border-border/50"
                }`}
                style={
                  selectedCategory === category.id
                    ? {
                        background: "var(--gradient-primary)",
                        color: "white",
                      }
                    : {}
                }
              >
                {category.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Results Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-6 text-sm text-muted-foreground"
        >
          Showing {filteredAndSortedPortfolios.length} portfolios
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          ref={performersRef}
          initial={{ opacity: 0, y: 40 }}
          animate={performersInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-6`}
        >
          {filteredAndSortedPortfolios.map((portfolio, index) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              index={index}
              onClick={() => handlePortfolioClick(portfolio)}
              isMobile={isMobile}
              isDark={isDark}
            />
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredAndSortedPortfolios.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No portfolios found matching your criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>

      {/* Portfolio Detail Modal */}
      <PortfolioDetailModal portfolio={selectedPortfolio} isOpen={showDetailModal} onClose={handleCloseModal} />
    </section>
  );
}

// Portfolio Card Component
interface PortfolioCardProps {
  portfolio: SharedPortfolio;
  index: number;
  onClick: () => void;
  isMobile: boolean;
  isDark: boolean;
}

function PortfolioCard({ portfolio, index, onClick, isDark }: PortfolioCardProps) {
  const isPositiveReturn = portfolio.performance.returnPercentage > 0;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Portfolio liked!", { duration: 2000 });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Portfolio shared!", { duration: 2000 });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Portfolio bookmarked!", { duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card
        className="border border-border/30 transition-all duration-300 hover:shadow-xl hover:border-border/50 overflow-hidden h-full"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: isDark ? "#374151" : "var(--border-light)",
        }}
      >
        {/* Card Header */}
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {portfolio.author.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate group-hover:text-cyan-500 transition-colors duration-300">
                  {portfolio.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>@{portfolio.author.username}</span>
                  {portfolio.author.isVerified && <Star className="w-3 h-3 text-yellow-400" />}
                </div>
              </div>
            </div>

            {/* Portfolio Rank */}
            {index < 3 && (
              <div className="flex items-center gap-1">
                {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                {index === 2 && <Trophy className="w-4 h-4 text-amber-600" />}
                <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Performance</span>
              <div
                className={`flex items-center gap-1 ${
                  isPositiveReturn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {isPositiveReturn ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="font-bold text-sm">
                  {isPositiveReturn ? "+" : ""}
                  {portfolio.performance.returnPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Investment</span>
              <span className="font-semibold text-sm text-foreground">
                ${portfolio.totalInvestment.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {portfolio.tags.slice(0, 3).map((tag, tagIndex) => (
              <Badge key={tagIndex} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {portfolio.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{portfolio.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-1 h-auto hover:text-red-500" onClick={handleLike}>
                <Heart className="w-3 h-3 mr-1" />
                {portfolio.metrics.likes}
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-auto hover:text-blue-500" onClick={handleShare}>
                <Share className="w-3 h-3 mr-1" />
                {portfolio.metrics.shares}
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-auto hover:text-yellow-500" onClick={handleBookmark}>
                <Bookmark className="w-3 h-3 mr-1" />
                {portfolio.metrics.bookmarks}
              </Button>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="text-xs">{portfolio.author.followers.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
