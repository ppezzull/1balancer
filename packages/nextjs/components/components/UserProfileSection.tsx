import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { useIsMobile } from "./ui/use-mobile";
import { User, Edit3, Save, X, PieChart, TrendingUp, Share2, Eye, Lock, Settings, Wallet, Trophy, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { 
  updatePortfolio, 
  getUserProfile, 
  updateUserProfileStats,
  Portfolio,
  UserProfile as UserProfileType,
  USER_PROFILE_STORAGE_KEY
} from "~~/utils/constants";

// Use the types from constants

export function UserProfileSection() {
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', description: '' });
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [strategyText, setStrategyText] = useState('');
  const isMobile = useIsMobile();

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
    loadUserPortfolios();
  }, []);

  // Listen for portfolio updates
  useEffect(() => {
    const handlePortfoliosUpdated = () => {
      console.log('📋 Portfolios updated event received in UserProfileSection');
      loadUserPortfolios();
    };

    window.addEventListener('portfolios-updated', handlePortfoliosUpdated);
    return () => window.removeEventListener('portfolios-updated', handlePortfoliosUpdated);
  }, []);

  // Refresh portfolios stats when component mounts
  useEffect(() => {
    updateUserProfileStats();
  }, []);

  const loadUserProfile = () => {
    const profile = getUserProfile();
    if (profile) {
      setUserProfile(profile);
      setEditForm({ username: profile.username, description: profile.description });
    } else {
      // First time user - show onboarding
      setIsOnboarding(true);
    }
  };

  const loadUserPortfolios = () => {
    try {
      // Get user portfolios from localStorage
      const userPortfolios = localStorage.getItem("user-portfolios");
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      
      let allPortfolios: Portfolio[] = [];
      const portfolioIds = new Set<string>(); // Track IDs to prevent duplicates
      
      // Load user-created portfolios (from template selection)
      if (userPortfolios) {
        try {
          const parsed = JSON.parse(userPortfolios);
          if (Array.isArray(parsed)) {
            for (const portfolio of parsed) {
              if (portfolio.id && !portfolioIds.has(portfolio.id)) {
                allPortfolios.push(portfolio);
                portfolioIds.add(portfolio.id);
              }
            }
          }
        } catch (error) {
          console.error("Error parsing user portfolios:", error);
        }
      }
      
      // Load saved portfolios (from PieChartCreator)
      if (savedPortfolios) {
        try {
          const parsed = JSON.parse(savedPortfolios);
          if (Array.isArray(parsed)) {
            // Filter out any default portfolios that might have been mixed in
            const userCreated = parsed.filter((p: Portfolio) => 
              p.id && 
              !p.id.startsWith('default-') && 
              !p.isTemplate &&
              !portfolioIds.has(p.id) // Prevent duplicates
            );
            
            for (const portfolio of userCreated) {
              allPortfolios.push(portfolio);
              portfolioIds.add(portfolio.id);
            }
          }
        } catch (error) {
          console.error("Error parsing saved portfolios:", error);
        }
      }
      
      // Sort portfolios by creation date (newest first)
      allPortfolios.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setPortfolios(allPortfolios);
      console.log(`✅ Loaded ${allPortfolios.length} unique user portfolios in profile:`, allPortfolios.map(p => `${p.name} (${p.id})`));
      
    } catch (error) {
      console.error("Error loading user portfolios:", error);
      setPortfolios([]);
    }
  };

  const handleOnboardingSubmit = () => {
    if (!editForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!editForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const newProfile: UserProfileType = {
      username: editForm.username.trim(),
      description: editForm.description.trim(),
      joinDate: new Date().toISOString(),
      totalPortfolios: 0,
      publicPortfolios: 0,
      totalInvestment: 0,
      bestPerformance: 0,
      isFirstTime: false
    };

    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    setUserProfile(newProfile);
    setIsOnboarding(false);
    
    toast.success("Profile created successfully!", {
      description: "Welcome to 1Balancer!"
    });
  };

  const handleEditSave = () => {
    if (!editForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    const updatedProfile = {
      ...userProfile!,
      username: editForm.username.trim(),
      description: editForm.description.trim()
    };

    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
    setIsEditing(false);
    
    toast.success("Profile updated successfully!");
  };

  const togglePortfolioPublic = (portfolioId: string) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) return;

    const newIsPublic = !portfolio.isPublic;
    
    try {
      // Update in user portfolios
      const userPortfolios = localStorage.getItem("user-portfolios");
      if (userPortfolios) {
        const parsed = JSON.parse(userPortfolios);
        const updated = parsed.map((p: Portfolio) => 
          p.id === portfolioId ? { ...p, isPublic: newIsPublic } : p
        );
        localStorage.setItem("user-portfolios", JSON.stringify(updated));
      }
      
      // Update in saved portfolios
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      if (savedPortfolios) {
        const parsed = JSON.parse(savedPortfolios);
        const updated = parsed.map((p: Portfolio) => 
          p.id === portfolioId ? { ...p, isPublic: newIsPublic } : p
        );
        localStorage.setItem("1balancer-portfolios", JSON.stringify(updated));
      }
      
      // Update local state
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => 
          p.id === portfolioId ? { ...p, isPublic: newIsPublic } : p
        )
      );
      
      const action = newIsPublic ? 'published' : 'made private';
      toast.success(`Portfolio ${action}!`);
      
    } catch (error) {
      console.error("Error updating portfolio visibility:", error);
      toast.error("Failed to update portfolio visibility");
    }
  };

  const handleAddStrategy = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setStrategyText(portfolio.strategy || '');
    setShowStrategyModal(true);
  };

  const saveStrategy = () => {
    if (!selectedPortfolio) return;

    const strategy = strategyText.trim();
    
    try {
      // Update in user portfolios
      const userPortfolios = localStorage.getItem("user-portfolios");
      if (userPortfolios) {
        const parsed = JSON.parse(userPortfolios);
        const updated = parsed.map((p: Portfolio) => 
          p.id === selectedPortfolio.id ? { ...p, strategy } : p
        );
        localStorage.setItem("user-portfolios", JSON.stringify(updated));
      }
      
      // Update in saved portfolios
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      if (savedPortfolios) {
        const parsed = JSON.parse(savedPortfolios);
        const updated = parsed.map((p: Portfolio) => 
          p.id === selectedPortfolio.id ? { ...p, strategy } : p
        );
        localStorage.setItem("1balancer-portfolios", JSON.stringify(updated));
      }
      
      // Update local state
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => 
          p.id === selectedPortfolio.id ? { ...p, strategy } : p
        )
      );
      
      setShowStrategyModal(false);
      setSelectedPortfolio(null);
      setStrategyText('');
      
      toast.success("Strategy saved successfully!");
      
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast.error("Failed to save strategy");
    }
  };

  // Calculate profile stats
  const profileStats = {
    totalPortfolios: portfolios.length,
    publicPortfolios: portfolios.filter(p => p.isPublic).length,
    totalInvestment: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
    bestPerformance: Math.max(...portfolios.map(p => p.performance), 0)
  };

  if (isOnboarding) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card 
            className="border-border/30 backdrop-blur-sm"
            style={{ background: 'var(--card-bg)' }}
          >
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'var(--gradient-primary)' }}>
                <User className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome to 1Balancer!</CardTitle>
              <p className="text-muted-foreground">Let's set up your profile to get started</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <Input
                  placeholder="Enter your username"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Tell us about yourself and your investment strategy..."
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[80px]"
                />
              </div>
              <Button 
                onClick={handleOnboardingSubmit}
                className="w-full"
                style={{ background: 'var(--gradient-primary)', color: 'white' }}
              >
                Create Profile
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            className="border-border/30 backdrop-blur-sm"
            style={{ background: 'var(--card-bg)' }}
          >
            <CardContent className="p-6">
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-start gap-6`}>
                {/* Profile Avatar */}
                <div className={`flex-shrink-0 ${isMobile ? 'self-center' : ''}`}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--gradient-primary)' }}>
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="text-xl font-bold"
                        placeholder="Username"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleEditSave} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({ username: userProfile.username, description: userProfile.description });
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">{userProfile.username}</h1>
                        <Button 
                          onClick={() => setIsEditing(true)}
                          variant="outline" 
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{userProfile.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(userProfile.joinDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          {profileStats.totalPortfolios} Portfolios
                        </div>
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          {profileStats.publicPortfolios} Public
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}
        >
          <Card className="border-border/30 backdrop-blur-sm" style={{ background: 'var(--card-bg)' }}>
            <CardContent className="p-4 text-center">
              <PieChart className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{profileStats.totalPortfolios}</div>
              <div className="text-sm text-muted-foreground">Total Portfolios</div>
            </CardContent>
          </Card>

          <Card className="border-border/30 backdrop-blur-sm" style={{ background: 'var(--card-bg)' }}>
            <CardContent className="p-4 text-center">
              <Share2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{profileStats.publicPortfolios}</div>
              <div className="text-sm text-muted-foreground">Public Portfolios</div>
            </CardContent>
          </Card>

          <Card className="border-border/30 backdrop-blur-sm" style={{ background: 'var(--card-bg)' }}>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">${profileStats.totalInvestment.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Investment</div>
            </CardContent>
          </Card>

          <Card className="border-border/30 backdrop-blur-sm" style={{ background: 'var(--card-bg)' }}>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">+{profileStats.bestPerformance.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Best Performance</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Portfolios Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/30 backdrop-blur-sm" style={{ background: 'var(--card-bg)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                My Portfolios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolios.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No portfolios created yet</p>
                  <p className="text-sm text-muted-foreground">Create your first portfolio to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolios.map((portfolio) => (
                    <div
                      key={portfolio.id}
                      className="p-4 rounded-lg border border-border/30 hover:border-border/50 transition-colors"
                      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'items-start' : 'items-center'} justify-between gap-4`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{portfolio.name}</h3>
                            <Badge variant={portfolio.isPublic ? "default" : "secondary"}>
                              {portfolio.isPublic ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 mr-1" />
                                  Private
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {portfolio.tokens.slice(0, 3).map((token) => (
                              <span key={token.symbol} className="text-xs bg-accent px-2 py-1 rounded">
                                {token.symbol} {token.percentage}%
                              </span>
                            ))}
                            {portfolio.tokens.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{portfolio.tokens.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>${portfolio.totalValue.toLocaleString()}</span>
                            <span className={portfolio.performance >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {portfolio.performance >= 0 ? '+' : ''}{portfolio.performance.toFixed(2)}%
                            </span>
                            <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className={`flex ${isMobile ? 'w-full justify-between' : 'flex-col'} gap-2`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Public</span>
                            <Switch
                              checked={portfolio.isPublic}
                              onCheckedChange={() => togglePortfolioPublic(portfolio.id)}
                            />
                          </div>
                          <Button
                            onClick={() => handleAddStrategy(portfolio)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            {portfolio.strategy ? 'Edit Strategy' : 'Add Strategy'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Strategy Modal */}
        <AnimatePresence>
          {showStrategyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowStrategyModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="border-border/30" style={{ background: 'var(--card-bg)' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Portfolio Strategy</span>
                      <Button
                        onClick={() => setShowStrategyModal(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Describe your investment strategy for "{selectedPortfolio?.name}"
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={strategyText}
                      onChange={(e) => setStrategyText(e.target.value)}
                      placeholder="Explain your investment strategy, risk tolerance, goals, and any specific methodology you follow..."
                      className="min-h-[120px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => setShowStrategyModal(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveStrategy}
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}
                      >
                        Save Strategy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}