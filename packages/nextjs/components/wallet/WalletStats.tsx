import { BarChart3, DollarSign, PieChart, Target } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "~~/components/shared/ui/card";

interface WalletStatsProps {
  defaultPortfolios: any[];
}

export function WalletStats({ defaultPortfolios }: WalletStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">$0.00</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Portfolios</span>
              <PieChart className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{defaultPortfolios.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready strategies</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Assets</span>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">60+</p>
            <p className="text-xs text-muted-foreground mt-1">ERC-20 tokens</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Rebalancing</span>
              <Target className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">Auto</p>
            <p className="text-xs text-muted-foreground mt-1">Drift & Time based</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
