"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../button";
import { Card, CardContent, CardHeader } from "../card";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import { Separator } from "../separator";
import {
  X,
  FileText,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Copy,
  Download,
  Share2,
  Lock,
  TrendingUp,
  Bot,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useIsMobile } from "../use-mobile";
import { useTheme } from "../use-theme";
import { toast } from "sonner";
import logoImage from "figma:asset/4ec3ac8d40639284c043d1d5a8d06d0449713468.png";

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhitepaperModal({
  isOpen,
  onClose,
}: WhitepaperModalProps) {
  const [activeSection, setActiveSection] =
    useState("overview");
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const sections = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "problem",
      label: "Problem Statement",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: "solution",
      label: "Solution",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: "yield",
      label: "Stablecoin Yield",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "benefits",
      label: "Benefits",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "disclaimers",
      label: "Disclaimers",
      icon: <Lock className="w-4 h-4" />,
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "1Balancer Protocol Whitepaper",
        text: "A Non-Custodial Portfolio Rebalancing Protocol for DeFi",
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  const renderContent = () => {
    // Helper function for responsive padding
    const getResponsivePadding = (base = 4) =>
      isMobile ? Math.max(base - 1, 2) : base;
    const getResponsiveSpacing = (base = 4) =>
      isMobile ? Math.max(base - 1, 3) : base;

    switch (activeSection) {
      case "overview":
        return (
          <div className={isMobile ? "space-y-4" : "space-y-6"}>
            <div>
              <h2
                className={`font-bold text-foreground mb-4 ${isMobile ? "text-xl" : "text-2xl"}`}
              >
                1Balancer: A Non-Custodial Portfolio Rebalancing
                Protocol
              </h2>
              <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-500" />
                  Abstract
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  1Balancer is a decentralized, non-custodial
                  portfolio rebalancing protocol that leverages
                  the 1inch API and smart contracts to automate
                  portfolio management for DeFi users. Users can
                  authorize a smart contract vault to manage a
                  defined subset of their assets and
                  automatically execute rebalancing operations
                  according to pre-set strategies, frequencies,
                  and thresholds, while maintaining full control
                  over their funds.
                </p>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${isMobile ? "gap-3" : "md:grid-cols-2 gap-4"}`}
            >
              <div
                className={`${isMobile ? "p-3" : "p-4"} rounded-lg bg-card border border-border`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-foreground">
                    Non-Custodial
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Users maintain full control and ownership of
                  their funds at all times
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-foreground">
                    Automated
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Smart contracts handle rebalancing based on
                  predefined rules and thresholds
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold text-foreground">
                    1inch Integration
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Best price execution through 1inch Aggregation
                  Router
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">
                    Flexible Strategies
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time-based and drift-based rebalancing with
                  custom thresholds
                </p>
              </div>
            </div>
          </div>
        );

      case "problem":
        return (
          <div className={isMobile ? "space-y-4" : "space-y-6"}>
            <h2
              className={`font-bold text-foreground ${isMobile ? "text-xl" : "text-2xl"}`}
            >
              Problem Statement
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                In DeFi, users hold diversified assets across
                wallets, yet lack tools to automate and optimize
                portfolio distribution over time. Manual
                rebalancing is inefficient, error-prone, and
                requires multiple transaction approvals.
              </p>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Current Challenges:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      <strong>Manual Inefficiency:</strong>{" "}
                      Users must manually monitor and execute
                      rebalancing operations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      <strong>High Error Rate:</strong> Manual
                      calculations and transactions are prone to
                      mistakes
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      <strong>Multiple Approvals:</strong> Each
                      rebalancing requires numerous transaction
                      signatures
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      <strong>No Secure Delegation:</strong> No
                      intuitive way to delegate rebalancing
                      without giving up custody
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "solution":
        return (
          <div className={isMobile ? "space-y-4" : "space-y-6"}>
            <h2
              className={`font-bold text-foreground ${isMobile ? "text-xl" : "text-2xl"}`}
            >
              The 1Balancer Solution
            </h2>

            <div
              className={`grid grid-cols-1 ${isMobile ? "gap-4" : "lg:grid-cols-2 gap-6"}`}
            >
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        1
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      Entire Wallet Mode
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The protocol analyzes current wallet token
                    balances and proposes rebalancing actions
                    based on target allocations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        2
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      Dedicated Vault Mode
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Users allocate assets to a vault smart
                    contract with autonomous rebalancing while
                    retaining full control and withdrawal
                    rights.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Portfolio Options:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    Pre-defined Portfolios
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Choose from curated portfolios with fixed
                    strategies (DeFi Blue Chips,
                    ETH/BTC/Stables)
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    Custom Portfolios
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Select tokens, assign weight percentages,
                    and configure rebalancing rules
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Rebalancing Strategies:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        T
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">
                      Time-based
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rebalancing occurs at fixed intervals
                    (weekly, monthly)
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        D
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">
                      Drift-based
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Triggered when asset weight deviates beyond
                    defined threshold
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "architecture":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Technical Architecture
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Core Components
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <h4 className="font-medium text-foreground">
                      Smart Contract Vault
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Holds user-designated funds and executes
                      rebalancing logic securely
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <h4 className="font-medium text-foreground">
                      1inch Integration
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uses 1inch Aggregation Router for best
                      swap execution and limit orders
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <h4 className="font-medium text-foreground">
                      Automation Layer
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Off-chain/on-chain bots check portfolio
                      drift and execute rebalancing
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Process Flow
                </h3>
                <div className="space-y-3">
                  {[
                    "Create or Connect Vault",
                    "Allocate Funds & Approve",
                    "Choose Portfolio Type",
                    "Set Strategy Parameters",
                    "Approve Rebalancing Logic",
                    "Autonomous Rebalancing",
                    "Modify or Exit Anytime",
                  ].map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5 text-yellow-600" />
                Keeper Network
              </h4>
              <p className="text-sm text-muted-foreground">
                Powered by Chainlink Automation and Gelato,
                keepers monitor portfolio drift and execute
                rebalancing when conditions are met, ensuring
                optimal portfolio management without manual
                intervention.
              </p>
            </div>
          </div>
        );

      case "yield":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Stablecoin Yield via Limit Orders
            </h2>

            <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Cash is King Philosophy
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Idle capital should always work for the user
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Stablecoins held in vaults can be used
                strategically by enabling the "Yield-on-Stables"
                option. This feature leverages 1inch's Limit
                Order Protocol to place buy orders on volatile
                assets at discounted prices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  How It Works
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Stablecoin Deployment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Instead of remaining idle, stablecoins
                        act as passive liquidity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Limit Order Placement
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Strategic buy orders placed at
                        discounted prices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Market Execution
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Orders execute automatically when market
                        conditions are met
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Benefits
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-foreground">
                      Passive Income Generation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earn yield during volatile market
                      conditions
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-foreground">
                      Strategic Integration
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seamlessly integrates with rebalancing
                      strategy
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-foreground">
                      Automated Optimization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No manual intervention required
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "benefits":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Summary & Benefits
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              1Balancer provides an intuitive and secure way to
              automate DeFi portfolio management, empowering
              both retail and institutional users to manage
              crypto portfolios more intelligently.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Non-Custodial",
                  description:
                    "Users always retain control of their funds",
                  color: "green",
                },
                {
                  icon: <RefreshCw className="w-5 h-5" />,
                  title: "Automated",
                  description:
                    "Rebalancing executed only when needed",
                  color: "blue",
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Efficient",
                  description: "Best price routing via 1inch",
                  color: "yellow",
                },
                {
                  icon: <Bot className="w-5 h-5" />,
                  title: "Composable",
                  description:
                    "Works with existing DeFi tools and wallets",
                  color: "purple",
                },
                {
                  icon: <Target className="w-5 h-5" />,
                  title: "Flexible",
                  description:
                    "Vaults can be paused, modified or exited",
                  color: "indigo",
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: "Smart Strategies",
                  description:
                    "Time-based or drift-based rebalancing",
                  color: "cyan",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg bg-${benefit.color}-500/10 flex items-center justify-center text-${benefit.color}-600 dark:text-${benefit.color}-400`}
                    >
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800">
              <h3 className="font-semibold text-foreground mb-2">
                By reducing friction, maximizing security, and
                offering automation:
              </h3>
              <p className="text-sm text-muted-foreground">
                1Balancer empowers users to focus on strategy
                while the protocol handles execution, creating a
                more efficient and accessible DeFi portfolio
                management experience.
              </p>
            </div>
          </div>
        );

      case "disclaimers":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Important Disclaimers
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-foreground">
                    Tokenomics Disclaimer
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>
                      There is currently no token associated
                      with the 1Balancer protocol.
                    </strong>
                    Any token claiming to represent 1Balancer is
                    a scam.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    While tokenomics may be explored in the
                    future to support governance or utility
                    within the ecosystem, only official channels
                    will be used for announcements.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>
                      Until then, do not interact with any token
                      or airdrop claiming association with
                      1Balancer.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-semibold text-foreground">
                    Airdrop Disclaimer
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>
                      No airdrop is active at this time.
                    </strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If and when an airdrop program is
                    introduced, it will be communicated
                    exclusively via verified and official
                    1Balancer channels.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>
                      Any airdrop claiming to represent
                      1Balancer is fraudulent.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-foreground">
                    Official Channels
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Always verify information through official
                  1Balancer channels. Be cautious of phishing
                  attempts, fake tokens, and fraudulent
                  airdrops. When in doubt, consult official
                  documentation and verified social media
                  accounts.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className={`w-full ${
            isMobile
              ? "h-screen max-h-screen mx-0 my-0"
              : "max-w-6xl h-[85vh] max-h-[85vh] mx-4 my-8"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Card
            className="border border-border/30 overflow-hidden h-full flex flex-col"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
              backdropFilter: "blur(20px)",
              maxHeight: isMobile ? "100vh" : "85vh",
            }}
          >
            {/* Header */}
            <CardHeader
              className={`border-b border-border/30 ${isMobile ? "p-3" : "p-4"} flex-shrink-0`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <img
                    src={"/logo.png"}
                    alt="1Balancer"
                    className={`h-15 sm:h-30 w-auto flex-shrink-0`}
                  />
                  <div className="min-w-0">
                    <h1
                      className={`font-bold text-foreground ${isMobile ? "text-lg" : "text-xl"} truncate`}
                    >
                      1Balancer Protocol
                    </h1>
                    <p
                      className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"} truncate`}
                    >
                      Technical Whitepaper
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {!isMobile && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyLink}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  >
                    <X
                      className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
                    />
                  </Button>
                </div>
              </div>

              {/* Mobile action buttons */}
              {isMobile && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex-1"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    <span className="text-xs">Share</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <div
              className={`flex ${isMobile ? "flex-col" : "flex-row"} flex-1 min-h-0 overflow-hidden`}
            >
              {/* Sidebar Navigation - Desktop */}
              {!isMobile && (
                <div className="w-64 border-r border-border/30 flex-shrink-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <nav className="space-y-2">
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() =>
                              setActiveSection(section.id)
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${
                              activeSection === section.id
                                ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            {section.icon}
                            <span className="text-sm font-medium">
                              {section.label}
                            </span>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Mobile Navigation */}
              {isMobile && (
                <div className="p-3 border-b border-border/30 flex-shrink-0">
                  <select
                    value={activeSection}
                    onChange={(e) =>
                      setActiveSection(e.target.value)
                    }
                    className="w-full p-2 text-sm rounded-lg border border-border bg-card text-foreground"
                  >
                    {sections.map((section) => (
                      <option
                        key={section.id}
                        value={section.id}
                      >
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Content Area with improved scroll */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full whitepaper-modal-content">
                  <div className={`${isMobile ? "px-3 py-4" : "p-6"} modal-content-padding modal-card-container`}>
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={isMobile ? "space-y-4" : "space-y-6"}
                    >
                      {renderContent()}
                    </motion.div>
                    {/* Add bottom padding for safe scroll area */}
                    <div className={isMobile ? "h-20" : "h-16"} />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}