import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "../ui/use-mobile";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

interface FinancialDataPoint {
  symbol: string;
  price: number;
  change: number;
  trend: 'up' | 'down';
  volume: string;
}

export function LiveFinancialData() {
  const [data, setData] = useState<FinancialDataPoint[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Base prices memoizzati per evitare re-calcoli - ERC-20 tokens only
  const basePrices = useMemo(() => ({
    'USDC': 1.00,
    'USDT': 1.00,
    'UNI': 12.45,
    'AAVE': 156.78,
    'LINK': 18.67,
    'COMP': 89.34
  }), []);

  const cryptos = useMemo(() => ['USDC', 'USDT', 'UNI', 'AAVE', 'LINK', 'COMP'], []);

  // Funzione di aggiornamento memoizzata
  const updateData = useCallback(() => {
    const newData = cryptos.map(symbol => {
      const basePrice = basePrices[symbol] || 1;
      const change = (Math.random() - 0.5) * 10;
      const price = basePrice + (basePrice * change / 100);

      return {
        symbol,
        price,
        change,
        trend: change > 0 ? 'up' as const : 'down' as const,
        volume: `${(Math.random() * 100).toFixed(1)}M`
      };
    });
    
    setData(newData);
  }, [cryptos, basePrices]);

  useEffect(() => {
    updateData();
    
    // Interval ottimizzato per evitare memory leaks
    const interval = setInterval(updateData, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [updateData]);

  // Handler click memoizzato
  const handleCryptoClick = useCallback((symbol: string) => {
    setSelectedCrypto(prev => prev === symbol ? null : symbol);
  }, []);

  if (isMobile) {
    return (
      <div className="absolute top-3 left-3 right-3 z-20">
        <motion.div
          className="text-cyan-400 text-xs mb-2 flex items-center justify-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Activity className="w-3 h-3" />
          LIVE MARKET
        </motion.div>

        {/* Mobile - Horizontal scrolling layout ottimizzato */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {data.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.symbol}
              className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-2 border border-gray-700 flex-shrink-0"
              style={{ minWidth: '72px', width: '72px' }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCryptoClick(item.symbol)}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-white text-xs font-mono font-bold">{item.symbol}</span>
                  {item.trend === 'up' ? (
                    <TrendingUp className="w-2 h-2 text-green-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-2 h-2 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <div className="text-white text-xs font-mono leading-tight">
                  {item.symbol === 'AAVE' ? `${Math.round(item.price)}` : 
                   item.symbol === 'COMP' ? `${Math.round(item.price)}` :
                   `${item.price.toFixed(2)}`}
                </div>
                <div className={`text-xs leading-tight ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
          {/* Padding finale per assicurare che l'ultimo elemento sia completamente visibile */}
          <div className="w-3 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // Desktop layout (originale ottimizzato)
  return (
    <div className="absolute top-20 right-8 space-y-2 z-20">
      <motion.div
        className="text-cyan-400 text-sm mb-4 flex items-center gap-2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Activity className="w-4 h-4" />
        LIVE MARKET DATA
      </motion.div>

      {data.map((item, index) => (
        <motion.div
          key={item.symbol}
          className={`bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 cursor-pointer border transition-all duration-300 ${
            selectedCrypto === item.symbol 
              ? 'border-cyan-400 bg-gray-800/80' 
              : 'border-gray-700 hover:border-gray-600'
          }`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleCryptoClick(item.symbol)}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-mono">{item.symbol}</span>
              {item.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-mono">
                ${item.price.toFixed(['AAVE', 'COMP'].includes(item.symbol) ? 0 : 2)}
              </div>
              <div className={`text-xs ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
              </div>
            </div>
          </div>

          {selectedCrypto === item.symbol && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 pt-2 border-t border-gray-600"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BarChart3 className="w-3 h-3" />
                Volume: {item.volume}
              </div>
              <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.random() * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}