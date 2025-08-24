import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~~/components/shared/dialog";
import { Button } from "~~/components/shared/button";
import { Input } from "~~/components/shared/input";
import { Label } from "~~/components/shared/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/shared/card";
import { Badge } from "~~/components/shared/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/shared/select";
import { Slider } from "~~/components/shared/slider";
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

 
}