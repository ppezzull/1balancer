"use client";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useTheme } from "./ui/use-theme";
import { motion } from "framer-motion";
import { Zap, Brain, Shield, TrendingUp, BarChart3, Target, ArrowRight } from "lucide-react";

interface RebalanceSectionProps {
  onStartRebalancing?: () => void;
}

export function RebalanceSection({ onStartRebalancing }: RebalanceSectionProps) {
  const { isDark } = useTheme();

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

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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
          transition={{ duration: 0.8, delay: 0.4 }}
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
          transition={{ duration: 0.8, delay: 0.6 }}
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
          transition={{ duration: 0.8, delay: 0.8 }}
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
              onClick={onStartRebalancing}
              className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-4 text-lg font-semibold transition-all duration-300 group shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                Start Smart Rebalancing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Button>
          </motion.div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Connect your wallet to get started with professional portfolio management
          </p>
        </motion.div>
      </div>
    </section>
  );
}