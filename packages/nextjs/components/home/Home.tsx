"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../shared/button";
import { WhitepaperModal } from "../shared/modals/WhitepaperModal";
import { usePrivy } from "@privy-io/react-auth";
import { AlertCircle, ArrowRight, FileText, Shield, TrendingUp, Wallet, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface HomeProps {
  onGetStarted?: () => void;
  isWalletConnected?: boolean;
  data?: any;
}

export function Home({ onGetStarted }: HomeProps) {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(false);

  // Use Privy state as primary source of truth
  const isWalletConnected = ready && authenticated;

  // Redirect to wallet only if the user explicitly requested Get Started
  useEffect(() => {
    if (ready && authenticated && redirectAfterAuth) {
      // Small delay to allow authentication to complete
      const timer = setTimeout(() => {
        router.push("/wallet");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ready, authenticated, router, redirectAfterAuth]);

  const handleGetStarted = async () => {
    if (!isWalletConnected) {
      try {
        login();
        toast.success("Wallet connected successfully!", {
          description: "Redirecting to your dashboard...",
          duration: 3000,
        });
        // Mark that we should redirect after authentication completes
        setRedirectAfterAuth(true);
      } catch {
        toast.error("Connection Failed", {
          description: "Failed to connect wallet. Please try again.",
          duration: 3000,
        });
      }
      return;
    }

    // If already connected, trigger the callback which will redirect
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <>
      <section className="relative w-full overflow-hidden home-page-centered">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />

        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: Math.random() * 10 + 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 home-content-wrapper viewport-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                Next-Gen DeFi Portfolio Management
              </span>
            </motion.div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="hero-title">
                <span className="text-foreground">Rebalance Your</span>
                <br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  Portfolio
                </span>
                <br />
                <span className="text-foreground">Automatically</span>
              </h1>
              <p className="hero-subtitle text-muted-foreground max-w-3xl mx-auto">
                The first non-custodial DeFi protocol for automated portfolio rebalancing. Set your strategy, maintain
                control, let smart contracts do the work.
              </p>
            </div>

            {/* Key Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>1inch Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Automated</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="relative overflow-hidden px-8 py-4 text-lg font-semibold transition-all duration-300 group text-white border-none"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 10px 30px rgba(20, 184, 166, 0.3)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isWalletConnected ? (
                    <>
                      Start Building Portfolio
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet Pro
                    </>
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </Button>

              <Button
                onClick={() => setShowWhitepaper(true)}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 font-semibold relative overflow-hidden group transition-all duration-300 border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/40 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-800 dark:hover:text-cyan-200"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Whitepaper
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-blue-100/20 dark:from-cyan-900/20 dark:to-blue-900/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </Button>
            </motion.div>

            {/* Connection Warning */}
            {!isWalletConnected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm"
              >
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  Connect your wallet to start building portfolios
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-20 w-16 h-16 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-lg" />
      </section>

      {/* Whitepaper Modal */}
      <WhitepaperModal isOpen={showWhitepaper} onClose={() => setShowWhitepaper(false)} />
    </>
  );
}
