"use client";

import { motion } from "framer-motion";
import { useInViewAnimation } from "../interactive/useInViewAnimation";
import { useTheme } from "../../ui/use-theme";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { 
  BarChart3, 
  PieChart, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  RefreshCw,
  ChevronRight,
  Users,
  Clock,
  DollarSign
} from "lucide-react";

export function AboutSection() {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation();
  const { ref: featuresRef, isInView: featuresInView } = useInViewAnimation();
  const { ref: howItWorksRef, isInView: howItWorksInView } = useInViewAnimation();
  const { isDark } = useTheme();

  const features = [
    {
      icon: BarChart3,
      title: "Smart Portfolio Balancing",
      description: "Set custom allocation percentages for each asset in your portfolio with our intuitive interface inspired by industry-leading platforms."
    },
    {
      icon: PieChart,
      title: "Visual Portfolio Analytics",
      description: "Visualize your portfolio distribution with interactive cake charts and set drift percentages with customizable rebalancing periods."
    },
    {
      icon: Wallet,
      title: "Wallet Management",
      description: "Connect your wallet, monitor balances, fund your portfolio, and withdraw assets directly from our smart contracts."
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Access comprehensive rankings of top-performing portfolio strategies with detailed cross-chain analytics and earnings data."
    },
    {
      icon: Shield,
      title: "Secure & Decentralized",
      description: "Built on blockchain technology with smart contracts ensuring security, transparency, and full user control over assets."
    },
    {
      icon: RefreshCw,
      title: "Automated Rebalancing",
      description: "Set it and forget it - our system automatically rebalances your portfolio based on your predefined parameters and market conditions."
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Configure Your Portfolio",
      description: "Navigate to /balancer and set allocation percentages for each crypto asset using our token selector interface.",
      icon: Target
    },
    {
      step: "02", 
      title: "Visualize & Fine-tune",
      description: "Review your portfolio distribution in /cake with interactive charts and configure drift percentages and rebalancing frequency.",
      icon: PieChart
    },
    {
      step: "03",
      title: "Monitor & Manage",
      description: "Track performance in /dashboard, fund your portfolio, and withdraw assets as needed while monitoring real-time balances.",
      icon: Wallet
    },
    {
      step: "04",
      title: "Optimize Performance",
      description: "Analyze top-performing strategies in /top-performers and adapt your approach based on successful portfolio configurations.",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      {/* Hero Section */}
      <section ref={heroRef} className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl mb-8">
              About{" "}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                1Balancer
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed transition-colors duration-300">
              The next-generation decentralized portfolio management platform that revolutionizes 
              how you balance, track, and optimize your cryptocurrency investments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-colors duration-300">
              1Balancer democratizes sophisticated portfolio management strategies by providing 
              institutional-grade tools in a user-friendly, decentralized platform. We believe 
              everyone should have access to advanced portfolio optimization techniques that were 
              once exclusive to professional traders and fund managers.
            </p>
          </motion.div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Users, label: "Active Users", value: "10,000+" },
              { icon: DollarSign, label: "Assets Under Management", value: "$50M+" },
              { icon: Clock, label: "Uptime", value: "99.9%" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Card 
                  className="backdrop-blur-sm p-6 text-center border transition-all duration-300"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    borderColor: isDark ? '#374151' : 'var(--border-light)'
                  }}
                >
                  <stat.icon className={`w-8 h-8 mx-auto mb-4 ${
                    isDark ? 'text-cyan-400' : 'text-blue-500'
                  } transition-colors duration-300`} />
                  <div className="text-2xl mb-2 text-foreground transition-colors duration-300">{stat.value}</div>
                  <div className="text-muted-foreground transition-colors duration-300">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl mb-6">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
              Comprehensive tools designed to give you complete control over your cryptocurrency portfolio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className="backdrop-blur-sm p-6 h-full border transition-all duration-300 group cursor-pointer hover:shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    borderColor: isDark ? '#374151' : 'var(--border-light)'
                  }}
                >
                  <feature.icon className={`w-12 h-12 mb-4 ${
                    isDark ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-blue-500 group-hover:text-blue-400'
                  } transition-colors duration-300`} />
                  <h3 className="text-xl mb-3 text-foreground transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed transition-colors duration-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl mb-6">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
              Get started with 1Balancer in four simple steps and take control of your portfolio
            </p>
          </motion.div>

          <div className="space-y-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={howItWorksInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <Card 
                    className="backdrop-blur-sm p-8 border transition-all duration-300"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      borderColor: isDark ? '#374151' : 'var(--border-light)'
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full flex items-center justify-center text-black font-bold">
                        {step.step}
                      </div>
                      <h3 className="text-2xl text-foreground transition-colors duration-300">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed transition-colors duration-300">{step.description}</p>
                  </Card>
                </div>
                <div className="flex-shrink-0">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors duration-300"
                    style={{ 
                      backgroundColor: isDark ? 'rgb(31 41 55)' : 'rgb(243 244 246)',
                      borderColor: isDark ? '#4b5563' : 'var(--border-light)'
                    }}
                  >
                    <step.icon className={`w-10 h-10 ${
                      isDark ? 'text-cyan-400' : 'text-blue-500'
                    } transition-colors duration-300`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <Card 
              className="backdrop-blur-sm p-12 border transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: isDark ? '#374151' : 'var(--border-light)'
              }}
            >
              <Zap className={`w-16 h-16 mx-auto mb-6 ${
                isDark ? 'text-cyan-400' : 'text-blue-500'
              } transition-colors duration-300`} />
              <h2 className="text-3xl md:text-4xl mb-6">Built for the Future</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed transition-colors duration-300">
                1Balancer leverages cutting-edge blockchain technology, smart contracts, and 
                cross-chain analytics to provide a seamless, secure, and highly efficient 
                portfolio management experience. Our platform is designed to scale with the 
                evolving DeFi ecosystem.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {["Smart Contracts", "Cross-Chain Support", "DeFi Integration", "Real-time Analytics", "Automated Execution"].map((tech, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.7)',
                      color: isDark ? '#9ca3af' : '#6b7280'
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <h2 className="text-3xl md:text-4xl mb-6">Ready to Start?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto transition-colors duration-300">
              Join thousands of users who have already optimized their crypto portfolios with 1Balancer
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-3"
              >
                Get Started <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className={`px-8 py-3 transition-colors duration-300 ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                View Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}