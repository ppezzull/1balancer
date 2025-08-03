import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function WalletHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-4 py-8"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
        <Sparkles className="w-4 h-4 text-teal-500" />
        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
          Portfolio Management Hub
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
        Build Your Perfect 
        <span className="bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent"> Portfolio</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Create custom portfolios or choose from our professionally crafted strategies. 
        Start building your DeFi investment future today.
      </p>
    </motion.div>
  );
}