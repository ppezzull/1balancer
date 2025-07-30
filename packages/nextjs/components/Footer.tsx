"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Github, Twitter, MessageCircle, BookOpen, ExternalLink } from "lucide-react";
import { useTheme } from "./ui/use-theme";

export function Footer() {
  const { isDark } = useTheme();

  const footerLinks = {
    product: [
      { name: "Portfolio Balancer", href: "/balancer" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "Top Performers", href: "/top-performers" },
      { name: "Analytics", href: "/analytics" }
    ],
    resources: [
      { name: "Documentation", href: "/docs", icon: BookOpen },
      { name: "API Reference", href: "/api-docs", icon: ExternalLink },
      { name: "Community", href: "/community", icon: MessageCircle },
      { name: "Blog", href: "/blog", icon: ExternalLink }
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Contact", href: "/contact" }
    ],
    social: [
      { name: "GitHub", href: "https://github.com/1balancer", icon: Github },
      { name: "Twitter", href: "https://twitter.com/1balancer", icon: Twitter },
      { name: "Discord", href: "https://discord.gg/1balancer", icon: MessageCircle }
    ]
  };

  return (
    <footer 
      className="border-t transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: isDark ? '#374151' : 'var(--border-light)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="1balancer" 
                  className="h-8 w-auto" 
                />
                <h3 className="text-xl font-bold text-foreground transition-colors duration-300">
                  1balancer
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm transition-colors duration-300">
                The next-generation decentralized portfolio management platform. 
                Simplify and amplify your investment strategy with innovative DeFi tools.
              </p>
              
              {/* Newsletter Signup */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3 transition-colors duration-300">
                  Stay Updated
                </h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black"
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-sm font-medium text-foreground mb-4 transition-colors duration-300">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-sm font-medium text-foreground mb-4 transition-colors duration-300">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  >
                    {link.name}
                    {link.icon && <link.icon className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-sm font-medium text-foreground mb-4 transition-colors duration-300">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div 
          className="border-t py-6 transition-colors duration-300"
          style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <motion.p 
              className="text-sm text-muted-foreground transition-colors duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              © 2024 1balancer. All rights reserved.
            </motion.p>

            {/* Social Links */}
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {footerLinks.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isDark 
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          className="text-center pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card 
            className="inline-flex items-center gap-2 px-4 py-2 border transition-all duration-300"
            style={{ 
              backgroundColor: isDark ? 'rgba(20, 184, 166, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderColor: isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className={`text-xs font-medium ${
              isDark ? 'text-cyan-400' : 'text-blue-600'
            }`}>
              Platform Status: All Systems Operational
            </span>
          </Card>
        </motion.div>
      </div>
    </footer>
  );
}