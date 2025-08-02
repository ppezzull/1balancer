import { memo } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Globe } from 'lucide-react';
import { useTheme } from '../ui/use-theme';
import { NETWORKS } from '~~/utils/constants';
import type { NetworkId } from '~~/utils/constants';

interface NetworkSelectorProps {
  selectedNetwork: NetworkId;
  onNetworkChange: (networkId: NetworkId) => void;
  isInView: boolean;
  isMobile: boolean;
}

export const NetworkSelector = memo(({ 
  selectedNetwork, 
  onNetworkChange, 
  isInView, 
  isMobile 
}: NetworkSelectorProps) => {
  const { isDark } = useTheme();
  
  const getNetworkIcon = (networkId: string) => {
    switch (networkId) {
      case "all": return <Globe className="w-3 h-3" />;
      case "ethereum": return <span className="w-3 h-3 bg-purple-500 rounded-full" />;
      case "bitcoin": return <span className="w-3 h-3 bg-orange-500 rounded-full" />;
      case "polygon": return <span className="w-3 h-3 bg-purple-600 rounded-full" />;
      default: return null;
    }
  };

  const getDesktopNetworkIcon = (networkId: string) => {
    switch (networkId) {
      case "all": return <Globe className="w-4 h-4" />;
      case "ethereum": return <span className="w-4 h-4 bg-purple-500 rounded-full" />;
      case "bitcoin": return <span className="w-4 h-4 bg-orange-500 rounded-full" />;
      case "polygon": return <span className="w-4 h-4 bg-purple-600 rounded-full" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mb-4 sm:mb-8 px-3 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {isMobile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.slice(0, 2).map((network) => (
                <Button
                  key={network.id}
                  variant={selectedNetwork === network.id ? "default" : "ghost"}
                  className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors duration-200 ${
                    selectedNetwork === network.id 
                      ? isDark 
                        ? "bg-blue-600 text-white border-blue-500" 
                        : "bg-blue-500 text-white border-blue-400"
                      : isDark
                        ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-300"
                  }`}
                  onClick={() => onNetworkChange(network.id as NetworkId)}
                >
                  <div className="flex items-center gap-1">
                    {getNetworkIcon(network.id)}
                    <span>{network.name}</span>
                  </div>
                  <span className="text-xs">{network.value}</span>
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.slice(2).map((network) => (
                <Button
                  key={network.id}
                  variant={selectedNetwork === network.id ? "default" : "ghost"}
                  className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors duration-200 ${
                    selectedNetwork === network.id 
                      ? isDark 
                        ? "bg-blue-600 text-white border-blue-500" 
                        : "bg-blue-500 text-white border-blue-400"
                      : isDark
                        ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-300"
                  }`}
                  onClick={() => onNetworkChange(network.id as NetworkId)}
                >
                  <div className="flex items-center gap-1">
                    {getNetworkIcon(network.id)}
                    <span>{network.name}</span>
                  </div>
                  <span className="text-xs">{network.value}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {NETWORKS.map((network) => (
              <Button
                key={network.id}
                variant={selectedNetwork === network.id ? "default" : "ghost"}
                className={`flex items-center gap-2 whitespace-nowrap transition-colors duration-200 ${
                  selectedNetwork === network.id 
                    ? isDark 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-blue-500 text-white border-blue-400"
                    : isDark
                      ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-300"
                }`}
                onClick={() => onNetworkChange(network.id as NetworkId)}
              >
                {getDesktopNetworkIcon(network.id)}
                <span>{network.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs transition-colors duration-300 ${
                    isDark 
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {network.value}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

NetworkSelector.displayName = 'NetworkSelector';