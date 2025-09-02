import { ArrowRight, Crown, PieChart, Rocket, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/shared/ui/card";

interface PortfolioOptionsProps {
  onCreateCustom: () => void;
  onOpenTemplates: () => void;
  defaultPortfolios: any[];
}

export function PortfolioOptions({ onCreateCustom, onOpenTemplates, defaultPortfolios }: PortfolioOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Start Your Investment Journey</h2>
        <p className="text-muted-foreground">Choose how you want to build your portfolio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Portfolio Creation */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="relative overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 group cursor-pointer h-full"
            onClick={onCreateCustom}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  Create Custom Portfolio
                </CardTitle>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardDescription className="text-muted-foreground">
                Build your own investment strategy from scratch
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Create custom allocation charts, choose from 60+ ERC-20 tokens, set precise percentages, and configure
                automated rebalancing.
              </p>

              <div className="flex items-center gap-2 text-teal-500 group-hover:text-teal-400 transition-colors">
                <span className="text-sm font-medium">Start Building</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Portfolio Templates */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="relative overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 group cursor-pointer h-full"
            onClick={onOpenTemplates}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                  Professional Templates
                </CardTitle>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardDescription className="text-muted-foreground">
                Choose from expertly crafted portfolio strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Access {defaultPortfolios.length} professional portfolios including 1Balancer EndGame, DeFi strategies,
                Real Yield RWA, and specialized sector focuses.
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  <span>High Performance</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Risk Managed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Community Tested</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-purple-500 group-hover:text-purple-400 transition-colors">
                <span className="text-sm font-medium">Explore Templates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
