import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~~/components/shared/dialog";
import { Card, CardContent } from "~~/components/shared/card";
import { Badge } from "~~/components/shared/badge";
import { Crown, Target, TrendingUp, Rocket, Shield, Globe, Zap, Star, Bot } from "lucide-react";

const PORTFOLIO_ICONS = {
  endgame: Crown,
  gomora: Rocket, 
  tanos: Shield,
  realyield: Globe,
  defi: Zap,
  meme: Star,
  ai: Bot
};

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: any[];
  onSelect: (template: any) => void;
}

export function TemplateSelectionModal({ isOpen, onClose, templates, onSelect }: TemplateSelectionModalProps) {
  const router = useRouter();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            Choose Portfolio Template
          </DialogTitle>
          <DialogDescription>
            Select a professional portfolio template to add to your collection. You can customize it after adding.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto scrollbar-default">
          {templates.map((template, index) => {
            const IconComponent = PORTFOLIO_ICONS[template.strategy as keyof typeof PORTFOLIO_ICONS] || Target;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="border border-border/50 bg-card/90 hover:bg-accent/50 hover:border-border/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group h-full"
                  onClick={() => {
                    // Store selected template in localStorage for portfolio creator
                    localStorage.setItem('selectedPortfolioTemplate', JSON.stringify(template));
                    
                    // Navigate to portfolio creator page
                    router.push('/wallet/create-portfolio');
                    
                    onSelect(template);
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        template.strategy === 'endgame' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        template.strategy === 'gomora' ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                        template.strategy === 'tanos' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' :
                        template.strategy === 'realyield' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                        template.strategy === 'defi' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                        template.strategy === 'meme' ? 'bg-gradient-to-br from-pink-400 to-rose-500' :
                        template.strategy === 'ai' ? 'bg-gradient-to-br from-violet-400 to-purple-500' :
                        'bg-gradient-to-br from-teal-400 to-cyan-500'
                      }`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        {template.tokens?.length || 0} Assets
                      </Badge>
                    </div>

                    {/* Portfolio Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {template.strategy === 'endgame' ? 'The ultimate DeFi portfolio combining the best protocols for maximum long-term returns and yield optimization.' :
                         template.strategy === 'gomora' ? 'High-risk, high-reward aggressive strategy targeting exponential growth through emerging DeFi protocols.' :
                         template.strategy === 'tanos' ? 'Perfectly balanced portfolio with controlled risk management and steady growth potential.' :
                         template.strategy === 'realyield' ? 'Real-world asset backed yields combining traditional finance with DeFi innovation.' :
                         template.strategy === 'defi' ? 'Pure DeFi protocol exposure focusing on established blue-chip protocols and governance tokens.' :
                         template.strategy === 'meme' ? 'Community-driven meme token portfolio capturing viral trends and social sentiment.' :
                         template.strategy === 'ai' ? 'AI and technology focused cryptocurrency portfolio targeting the future of artificial intelligence.' :
                         'Professionally managed strategy with balanced risk-reward optimization.'}
                      </p>
                    </div>

                    {/* Token Preview */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Top Holdings:</div>
                      <div className="flex flex-wrap gap-1">
                        {(template.tokens || []).slice(0, 4).map((token: any, tokenIndex: number) => (
                          <Badge key={tokenIndex} variant="outline" className="text-xs">
                            {token.symbol}
                          </Badge>
                        ))}
                        {(template.tokens || []).length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.tokens || []).length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{(template.performance || Math.random() * 30 + 5).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ${(template.totalValue || 10000).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}