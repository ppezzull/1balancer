"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "~~/components/shared/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/shared/card";
import { useTheme } from "~~/components/shared/use-theme";
import { motion } from "motion/react";
import { Zap, Brain, Shield, TrendingUp, BarChart3, Target, ArrowRight, Crown } from "lucide-react";
import { toast } from "sonner";

interface RebalanceProps {
  onStartRebalancing?: () => void;
  data?: any;
}

export function Rebalance({ onStartRebalancing, data }: RebalanceProps) {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { isDark } = useTheme();

  const isWalletConnected = ready && authenticated;

  // Redirect to wallet after successful authentication
  useEffect(() => {
    if (ready && authenticated && onStartRebalancing) {
      // Small delay to allow authentication to complete
      const timer = setTimeout(() => {
        router.push('/wallet');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ready, authenticated, router, onStartRebalancing]);

  const handleStartRebalancing = async () => {
    if (!isWalletConnected) {
      try {
        await login();
        toast.success("Wallet connected successfully!", {
          description: "Redirecting to your dashboard...",
          duration: 3000,
        });
        // Redirect will happen in useEffect above
      } catch (error) {
        toast.error("Connection Failed", {
          description: "Failed to connect wallet. Please try again.",
          duration: 3000,
        });
      }
      return;
    }

    // If already connected, trigger the callback which will redirect
    if (onStartRebalancing) {
      onStartRebalancing();
    }
  };

  const features = [
    {
      title: "Automated",
      description: "Automatic rebalancing based on predefined thresholds",
      icon: <Zap className="w-8 h-8 text-white" />,
      color: "from-emerald-400 via-cyan-400 to-indigo-500"
    },
    {
      title: "Intelligent",
      description: "Real-time market analysis for optimal decisions", 
      icon: <Brain className="w-8 h-8 text-white" />,
      color: "from-blue-400 via-purple-400 to-pink-500"
    },
    {
      title: "Secure",
      description: "Advanced security protocols for your funds",
      icon: <Shield className="w-8 h-8 text-white" />,
      color: "from-green-400 via-teal-400 to-blue-500"
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Optimize Returns",
      description: "Maximize your portfolio performance with data-driven rebalancing"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Risk Management", 
      description: "Maintain your desired risk profile through strategic allocation"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Stay on Target",
      description: "Keep your portfolio aligned with your investment goals"
    }
  ];

  return (
    <section 
      id="rebalance" 
      className="py-20 transition-colors duration-300 bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-foreground mb-6 transition-colors duration-300">
            <span 
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradient-primary)' }}
            >
              Smart Rebalancing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto transition-colors duration-300 leading-relaxed">
            Our automated rebalancing algorithm keeps your portfolio aligned with your target investment strategy, ensuring optimal performance and risk management.
          </p>
        </motion.div>

        {/* Cash is KING Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Card 
            className="relative overflow-hidden border-2 border-amber-400/30 shadow-2xl"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              backgroundImage: isDark 
                ? 'radial-gradient(circle at 50% 50%, rgba(255, 193, 7, 0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 50% 50%, rgba(255, 193, 7, 0.05) 0%, transparent 50%)'
            }}
          >
            {/* Golden glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/5 to-amber-400/10 animate-pulse" />
            
            <CardContent className="relative z-10 p-8 md:p-12">
              <div className="text-center">
                {/* Lion Crown Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  }}
                  className="relative mb-6 inline-block"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full mx-auto flex items-center justify-center shadow-2xl">
                    <span className="text-4xl">🦁</span>
                  </div>
                  {/* Radiating effect */}
                  <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-amber-400/30 via-yellow-500/30 to-amber-600/30 rounded-full animate-ping" />
                </motion.div>

                {/* Main Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-4xl md:text-5xl font-bold mb-4"
                >
                  <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                    Cash is KING
                  </span>
                </motion.h3>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-xl md:text-2xl text-foreground font-semibold mb-6"
                >
                  Passive income generation.
                </motion.p>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="max-w-3xl mx-auto"
                >
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    Utilizes micro-volatility to earn APY between{" "}
                    <span className="font-bold text-emerald-500">3-15%</span>{" "}
                    on stablecoins
                  </p>
                  
                  {/* APY Range Visual */}
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Min 3% APY</span>
                    </div>
                    
                    <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Max 15% APY</span>
                    </div>
                  </div>

                  {/* Key Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[
                      { title: "Low Risk", desc: "Stablecoin focused", icon: "🛡️" },
                      { title: "Micro-Volatility", desc: "Smart arbitrage", icon: "📈" },
                      { title: "Passive Income", desc: "Automated earning", icon: "💰" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                        className="p-4 rounded-xl bg-background/50 border border-border/30 backdrop-blur-sm"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card 
                className="text-center border transition-all duration-300 hover:shadow-xl relative overflow-hidden h-full"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: isDark ? '#374151' : 'var(--border-light)'
                }}
              >
                {/* Hover Effect Background */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ background: 'var(--gradient-primary)' }}
                />
                
                <CardHeader className="relative z-10">
                  <div 
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-cyan-500">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-semibold text-center text-foreground mb-12">
            Why Choose Smart Rebalancing?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="flex items-start gap-4 p-6 rounded-xl border border-border/30 hover:border-border/50 transition-all duration-300"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--gradient-accent)' }}
                >
                  <div className="text-white">
                    {benefit.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{benefit.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-4">How It Works</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our intelligent rebalancing system works seamlessly in the background to optimize your portfolio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Set Targets", desc: "Define your ideal portfolio allocation" },
              { step: "2", title: "Monitor", desc: "AI continuously tracks market conditions" },
              { step: "3", title: "Analyze", desc: "Algorithm identifies rebalancing opportunities" },
              { step: "4", title: "Execute", desc: "Automated trades maintain your strategy" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="text-center"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-center"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Ready to Optimize Your Portfolio?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start using our smart rebalancing features to maximize your investment potential
            </p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              size="lg"
              onClick={handleStartRebalancing}
              className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-4 text-lg font-semibold transition-all duration-300 group shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                {isWalletConnected ? 'Start Smart Rebalancing' : 'Connect Wallet to Start'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Button>
          </motion.div>
          
          <p className="text-sm text-muted-foreground mt-4">
            {isWalletConnected 
              ? "Your wallet is connected and ready for professional portfolio management"
              : "Connect your wallet to get started with professional portfolio management"
            }
          </p>
        </motion.div>
      </div>
    </section>
  );
}