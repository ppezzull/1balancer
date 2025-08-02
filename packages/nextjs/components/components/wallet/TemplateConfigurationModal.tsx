import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { 
  Crown, 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  Globe, 
  Zap, 
  Star, 
  Bot, 
  Clock,
  ArrowRight,
  ArrowLeft,
  TrendingDown as Drift,
  Check,
  Percent,
  Calendar,
  Settings,
  Info
} from "lucide-react";

const PORTFOLIO_ICONS = {
  endgame: Crown,
  gomora: Rocket, 
  tanos: Shield,
  realyield: Globe,
  defi: Zap,
  meme: Star,
  ai: Bot
};

interface TemplateConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any | null;
  onConfirm: (config: {
    template: any;
    rebalanceType: 'drift' | 'time';
    portfolioName: string;
    rebalanceConfig: {
      driftThreshold?: number;
      rebalanceFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual';
    };
  }) => void;
}

export function TemplateConfigurationModal({ 
  isOpen, 
  onClose, 
  template, 
  onConfirm 
}: TemplateConfigurationModalProps) {
  const [step, setStep] = useState<'rebalance' | 'config' | 'name'>('rebalance');
  const [rebalanceType, setRebalanceType] = useState<'drift' | 'time' | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  
  // Rebalancing configuration
  const [driftThreshold, setDriftThreshold] = useState(10); // Default 10% drift (recommended)
  const [driftInputValue, setDriftInputValue] = useState("10");
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'semi-annual'>('monthly');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen && template) {
      setStep('rebalance');
      setRebalanceType(null);
      setPortfolioName(template.name || '');
      setIsNameValid(true);
      setDriftThreshold(10);
      setDriftInputValue("10");
      setRebalanceFrequency('monthly');
    }
  }, [isOpen, template]);

  // Validate portfolio name
  React.useEffect(() => {
    const trimmedName = portfolioName.trim();
    setIsNameValid(trimmedName.length >= 3 && trimmedName.length <= 50);
  }, [portfolioName]);

  // Sync drift input with slider value
  React.useEffect(() => {
    setDriftInputValue(driftThreshold.toString());
  }, [driftThreshold]);

  // Handle drift input change
  const handleDriftInputChange = (value: string) => {
    setDriftInputValue(value);
    
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue) && numericValue >= 3 && numericValue <= 30) {
      setDriftThreshold(numericValue);
    }
  };

  // Handle drift input blur
  const handleDriftInputBlur = () => {
    const numericValue = parseFloat(driftInputValue);
    
    if (isNaN(numericValue) || numericValue < 3) {
      setDriftThreshold(3);
      setDriftInputValue("3");
    } else if (numericValue > 30) {
      setDriftThreshold(30);
      setDriftInputValue("30");
    } else {
      setDriftThreshold(numericValue);
      setDriftInputValue(numericValue.toString());
    }
  };

  const handleNext = () => {
    if (step === 'rebalance' && rebalanceType) {
      setStep('config');
    } else if (step === 'config') {
      setStep('name');
    }
  };

  const handleBack = () => {
    if (step === 'name') {
      setStep('config');
    } else if (step === 'config') {
      setStep('rebalance');
    }
  };

  const handleConfirm = () => {
    if (template && rebalanceType && isNameValid) {
      const rebalanceConfig = rebalanceType === 'drift' 
        ? { driftThreshold }
        : { rebalanceFrequency };

      onConfirm({
        template,
        rebalanceType,
        portfolioName: portfolioName.trim(),
        rebalanceConfig
      });
      onClose();
    }
  };

  const handleClose = () => {
    setStep('rebalance');
    setRebalanceType(null);
    setPortfolioName('');
    setDriftThreshold(10);
    setDriftInputValue("10");
    setRebalanceFrequency('monthly');
    onClose();
  };

  if (!template) return null;

  const IconComponent = PORTFOLIO_ICONS[template.strategy as keyof typeof PORTFOLIO_ICONS] || Target;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-default">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-purple-500" />
            Configure Portfolio Template
          </DialogTitle>
          <DialogDescription>
            {step === 'rebalance' 
              ? 'Choose your rebalancing strategy for this portfolio'
              : step === 'config'
              ? `Configure your ${rebalanceType}-based rebalancing settings`
              : 'Give your portfolio a custom name'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Template Preview */}
          <Card className="border border-border/50 bg-card/90">
            <CardHeader className="pb-3">
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
              
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="mt-1">
                  {template.strategy === 'endgame' ? 'The ultimate DeFi portfolio combining the best protocols for maximum long-term returns and yield optimization.' :
                   template.strategy === 'gomora' ? 'High-risk, high-reward aggressive strategy targeting exponential growth through emerging DeFi protocols.' :
                   template.strategy === 'tanos' ? 'Perfectly balanced portfolio with controlled risk management and steady growth potential.' :
                   template.strategy === 'realyield' ? 'Real-world asset backed yields combining traditional finance with DeFi innovation.' :
                   template.strategy === 'defi' ? 'Pure DeFi protocol exposure focusing on established blue-chip protocols and governance tokens.' :
                   template.strategy === 'meme' ? 'Community-driven meme token portfolio capturing viral trends and social sentiment.' :
                   template.strategy === 'ai' ? 'AI and technology focused cryptocurrency portfolio targeting the future of artificial intelligence.' :
                   'Professionally managed strategy with balanced risk-reward optimization.'}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <AnimatePresence mode="wait">
            {step === 'rebalance' && (
              <motion.div
                key="rebalance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base font-semibold">Rebalancing Strategy</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose how this portfolio should automatically maintain its target allocations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drift-based Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        rebalanceType === 'drift'
                          ? 'border-blue-500 bg-blue-500/5 shadow-md'
                          : 'border-border/50 hover:border-border/80 hover:bg-accent/50'
                      }`}
                      onClick={() => setRebalanceType('drift')}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                              <Drift className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Drift-Based</CardTitle>
                              <CardDescription className="text-xs">Dynamic rebalancing</CardDescription>
                            </div>
                          </div>
                          {rebalanceType === 'drift' && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          Automatically rebalances when asset allocations drift beyond a set threshold, 
                          responding intelligently to market volatility.
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Target className="w-3 h-3" />
                          <span>Precision-focused</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Time-based Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        rebalanceType === 'time'
                          ? 'border-blue-500 bg-blue-500/5 shadow-md'
                          : 'border-border/50 hover:border-border/80 hover:bg-accent/50'
                      }`}
                      onClick={() => setRebalanceType('time')}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Time-Based</CardTitle>
                              <CardDescription className="text-xs">Scheduled rebalancing</CardDescription>
                            </div>
                          </div>
                          {rebalanceType === 'time' && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          Rebalances on a fixed schedule (weekly, monthly, etc.) regardless of market conditions 
                          to maintain consistent target allocations.
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Clock className="w-3 h-3" />
                          <span>Schedule-based</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {rebalanceType === 'drift' ? (
                  // Drift-based configuration
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Drift Threshold</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Portfolio will rebalance when any asset allocation drifts beyond this percentage from its target
                      </p>
                    </div>

                    <Card className="border border-border/30 bg-muted/20">
                      <CardContent className="p-6 space-y-6">
                        {/* Slider */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Threshold Percentage</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={driftInputValue}
                                onChange={(e) => handleDriftInputChange(e.target.value)}
                                onBlur={handleDriftInputBlur}
                                className="w-16 h-8 text-center text-sm"
                                placeholder="10"
                              />
                              <Percent className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <Slider
                            value={[driftThreshold]}
                            onValueChange={(value) => setDriftThreshold(value[0])}
                            max={30}
                            min={3}
                            step={1}
                            className="w-full"
                          />
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>3% (Very High Frequency)</span>
                            <span>10% (Recommended)</span>
                            <span>30% (Ultra-Passive)</span>
                          </div>
                        </div>

                        {/* Drift Threshold Reference Table */}
                        <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                                Drift Threshold Guide:
                              </p>
                              <p className="text-blue-600 dark:text-blue-400 text-xs mb-3">
                                Choose your strategy based on risk tolerance and portfolio stability preferences
                              </p>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto -mx-1 px-1">
                            <table className="w-full text-xs min-w-[400px]">
                              <thead>
                                <tr className="border-b border-blue-500/20">
                                  <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Threshold</th>
                                  <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Frequency</th>
                                  <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Stability</th>
                                  <th className="text-left py-2 text-blue-700 dark:text-blue-300 font-medium">Best for</th>
                                </tr>
                              </thead>
                              <tbody className="text-blue-600 dark:text-blue-400">
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 3 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">3%</td>
                                  <td className="py-1.5 pr-3">Very High</td>
                                  <td className="py-1.5 pr-3">Maximum</td>
                                  <td className="py-1.5">Ultra-conservative users</td>
                                </tr>
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 5 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">5%</td>
                                  <td className="py-1.5 pr-3">High</td>
                                  <td className="py-1.5 pr-3">Very High</td>
                                  <td className="py-1.5">Conservative investors</td>
                                </tr>
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 10 ? 'bg-blue-500/10 ring-1 ring-blue-500/30' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">10%</td>
                                  <td className="py-1.5 pr-3">Medium</td>
                                  <td className="py-1.5 pr-3">High</td>
                                  <td className="py-1.5">Most users (recommended)</td>
                                </tr>
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 15 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">15%</td>
                                  <td className="py-1.5 pr-3">Low</td>
                                  <td className="py-1.5 pr-3">Moderate</td>
                                  <td className="py-1.5">Semi-passive strategies</td>
                                </tr>
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 20 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">20%</td>
                                  <td className="py-1.5 pr-3">Very Low</td>
                                  <td className="py-1.5 pr-3">Low</td>
                                  <td className="py-1.5">Long-term holders</td>
                                </tr>
                                <tr className={`border-b border-blue-500/10 ${driftThreshold === 25 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">25%</td>
                                  <td className="py-1.5 pr-3">Rare</td>
                                  <td className="py-1.5 pr-3">Lowest</td>
                                  <td className="py-1.5">Dynamic portfolios</td>
                                </tr>
                                <tr className={`${driftThreshold === 30 ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-1.5 pr-3 font-medium">30%</td>
                                  <td className="py-1.5 pr-3">Very Rare</td>
                                  <td className="py-1.5 pr-3">Lowest</td>
                                  <td className="py-1.5">Ultra-passive strategies</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-blue-500/20">
                            <p className="text-blue-600 dark:text-blue-400 text-xs">
                              <strong>Current selection:</strong> {driftThreshold}% - 
                              {driftThreshold === 3 ? ' Ultra-conservative with maximum stability and very high rebalancing frequency.' :
                               driftThreshold === 5 ? ' Conservative approach with very high stability and frequent rebalancing.' :
                               driftThreshold === 10 ? ' Recommended balanced approach with high stability and medium rebalancing frequency.' :
                               driftThreshold === 15 ? ' Semi-passive strategy with moderate stability and low rebalancing frequency.' :
                               driftThreshold === 20 ? ' Long-term approach with low stability and very low rebalancing frequency.' :
                               driftThreshold === 25 ? ' Dynamic portfolio strategy with lowest stability and rare rebalancing.' :
                               driftThreshold === 30 ? ' Ultra-passive strategy with lowest stability and very rare rebalancing.' :
                               ` Portfolio rebalances when any asset drifts ${driftThreshold}% from its target allocation.`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  // Time-based configuration
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Rebalance Schedule</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose how often your portfolio should automatically rebalance to maintain target allocations
                      </p>
                    </div>

                    <Card className="border border-border/30 bg-muted/20">
                      <CardContent className="p-6 space-y-4">
                        <Select value={rebalanceFrequency} onValueChange={(value: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual') => setRebalanceFrequency(value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="font-medium">Weekly</div>
                                  <div className="text-xs text-muted-foreground">Every Monday</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-green-500" />
                                <div>
                                  <div className="font-medium">Monthly</div>
                                  <div className="text-xs text-muted-foreground">1st of each month</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="quarterly">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="font-medium">Quarterly</div>
                                  <div className="text-xs text-muted-foreground">Every 3 months</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="semi-annual">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-purple-500" />
                                <div>
                                  <div className="font-medium">Semi-Annual</div>
                                  <div className="text-xs text-muted-foreground">Every 6 months</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Frequency explanation */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                                {rebalanceFrequency === 'weekly' ? 'Weekly Rebalancing:' :
                                 rebalanceFrequency === 'monthly' ? 'Monthly Rebalancing:' :
                                 rebalanceFrequency === 'quarterly' ? 'Quarterly Rebalancing:' :
                                 'Semi-Annual Rebalancing:'}
                              </p>
                              <p className="text-blue-600 dark:text-blue-400">
                                {rebalanceFrequency === 'weekly' 
                                  ? "High precision with frequent adjustments. Best for active investors who want tight control."
                                  : rebalanceFrequency === 'monthly'
                                  ? "Balanced approach - frequent enough to maintain targets without excessive fees. Recommended for most investors."
                                  : rebalanceFrequency === 'quarterly'
                                  ? "Conservative approach with lower transaction costs. Good for long-term investors."
                                  : "Minimal rebalancing with lowest fees. Best for very long-term, set-and-forget strategies."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="portfolio-name" className="text-base font-semibold">Portfolio Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a custom name for your portfolio (3-50 characters)
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    id="portfolio-name"
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    placeholder="Enter portfolio name..."
                    className="text-base"
                    maxLength={50}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isNameValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {portfolioName.length}/50 characters
                    </span>
                    {!isNameValid && portfolioName.length > 0 && (
                      <span className="text-xs text-red-500">
                        Name must be 3-50 characters
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Configuration Summary */}
                <Card className="border border-border/30 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rebalanceType === 'drift' ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                            <Drift className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {rebalanceType === 'drift' ? 'Drift-Based Rebalancing' : 'Time-Based Rebalancing'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rebalanceType === 'drift' 
                              ? 'Responds to market volatility'
                              : 'Fixed schedule rebalancing'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Selected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {(step === 'config' || step === 'name') && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            
            <div className="flex-1" />
            
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            
            {step === 'rebalance' ? (
              <Button
                onClick={handleNext}
                disabled={!rebalanceType}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : step === 'config' ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!isNameValid}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Check className="w-4 h-4" />
                Create Portfolio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}