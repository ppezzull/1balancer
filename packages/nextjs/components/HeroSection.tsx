import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Zap, Shield, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { toast } from "sonner";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const isMobile = useIsMobile();

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnection = (event: CustomEvent) => {
      setIsWalletConnected(event.detail.connected);
    };

    window.addEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
    return () => window.removeEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Rebalancing",
      description: "AI-powered portfolio optimization"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Trading",
      description: "Bank-grade security protocols"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Tracking",
      description: "Real-time analytics & insights"
    }
  ];

  const handleGetStarted = () => {
    if (!isWalletConnected) {
      toast.error("Wallet Connection Required", {
        description: "Please connect your wallet first to access portfolio features",
        duration: 4000,
        action: {
          label: "Connect",
          onClick: () => {
            // The wallet connection is handled by the Header component
            toast.info("Use the 'Connect Wallet' button in the header", {
              duration: 3000,
            });
          },
        },
      });
      return;
    }

    // If wallet is connected, navigate to wallet section
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      {/* Main Hero Content */}
      <div className="text-center mb-16 lg:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'var(--gradient-primary)'
              }}
            >
              Perfectly balanced
            </span>{' '}
            <span className="text-foreground">as all</span>
            <br />
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'var(--gradient-accent)'
              }}
            >
              Portfolios
            </span>{' '}
            <span className="text-foreground">should be</span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Simplify and Amplify Your Investment Strategy with 1Balancer's Innovative Platform
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Button
            size="lg"
            onClick={handleGetStarted}
            className={`text-lg px-8 py-4 font-semibold group relative overflow-hidden transition-all duration-300 ${
              isWalletConnected
                ? 'cursor-pointer'
                : 'cursor-pointer'
            }`}
            style={{
              background: isWalletConnected 
                ? 'var(--gradient-primary)' 
                : 'var(--gradient-secondary)',
              color: 'white'
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isWalletConnected ? (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Connect Wallet First
                </>
              )}
            </span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4 font-semibold border-border/30 hover:border-border/50"
          >
            Learn More
          </Button>
        </motion.div>

        {/* Wallet Status Indicator */}
        {!isWalletConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Connect your wallet to access portfolio features
              </span>
            </div>
          </motion.div>
        )}

        {isWalletConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Wallet connected - Ready to get started!
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}