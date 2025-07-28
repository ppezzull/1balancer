import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useTheme } from "../ui/use-theme";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
  trend: 'up' | 'down';
  sparkline: number[];
}

export function LiveCryptoTicker() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [hoveredCrypto, setHoveredCrypto] = useState<string | null>(null);
  const [clickedCrypto, setClickedCrypto] = useState<string | null>(null);
  const { isDark } = useTheme();

  const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'AVAX', 'MATIC', 'LINK'];

  useEffect(() => {
    const updateCryptoData = () => {
      const newData = cryptoSymbols.map(symbol => {
        const basePrice = {
          'BTC': 45000, 'ETH': 3000, 'ADA': 0.5, 'DOT': 25,
          'SOL': 100, 'AVAX': 35, 'MATIC': 0.8, 'LINK': 15
        }[symbol] || 1;

        const change = (Math.random() - 0.5) * 15;
        const price = basePrice * (1 + change / 100);
        
        // Genera sparkline dati
        const sparkline = Array.from({ length: 20 }, () => 
          basePrice + (Math.random() - 0.5) * basePrice * 0.1
        );

        return {
          symbol,
          name: symbol,
          price,
          change24h: change,
          trend: change > 0 ? 'up' as const : 'down' as const,
          volume: `${(Math.random() * 500 + 50).toFixed(1)}M`,
          marketCap: `${(Math.random() * 100 + 10).toFixed(1)}B`,
          sparkline
        };
      });
      
      setCryptoData(newData);
    };

    updateCryptoData();
    const interval = setInterval(updateCryptoData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCryptoClick = (symbol: string) => {
    setClickedCrypto(symbol);
    
    // Vibrazione se supportata
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    setTimeout(() => setClickedCrypto(null), 500);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <motion.div
        className="backdrop-blur-md overflow-hidden transition-colors duration-300"
        style={{ 
          backgroundColor: isDark 
            ? 'rgba(0, 0, 0, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)' 
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative">
          {/* Ticker scrolling */}
          <motion.div
            className="flex gap-8 py-4"
            animate={{ x: [0, -2000] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[...cryptoData, ...cryptoData].map((crypto, index) => (
              <motion.div
                key={`${crypto.symbol}-${index}`}
                className={`flex items-center gap-3 min-w-[200px] cursor-pointer transition-all duration-200 ${
                  hoveredCrypto === crypto.symbol ? 'scale-110' : ''
                }`}
                onMouseEnter={() => setHoveredCrypto(crypto.symbol)}
                onMouseLeave={() => setHoveredCrypto(null)}
                onClick={() => handleCryptoClick(crypto.symbol)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                animate={clickedCrypto === crypto.symbol ? {
                  boxShadow: [
                    "0 0 0px rgba(34, 211, 238, 0)",
                    "0 0 20px rgba(34, 211, 238, 0.8)",
                    "0 0 0px rgba(34, 211, 238, 0)"
                  ],
                  scale: [1, 1.1, 1]
                } : {}}
              >
                {/* Crypto symbol */}
                <motion.div 
                  className="font-bold text-sm transition-colors duration-300"
                  style={{ 
                    color: isDark ? '#ffffff' : '#1f2937' 
                  }}
                  animate={hoveredCrypto === crypto.symbol ? {
                    color: isDark 
                      ? ["#ffffff", "#22d3ee", "#ffffff"]
                      : ["#1f2937", "#3b82f6", "#1f2937"]
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {crypto.symbol}
                </motion.div>

                {/* Price */}
                <div 
                  className="text-sm transition-colors duration-300"
                  style={{ 
                    color: isDark ? '#d1d5db' : '#6b7280' 
                  }}
                >
                  ${crypto.price.toFixed(crypto.symbol === 'BTC' ? 0 : 2)}
                </div>

                {/* Change indicator */}
                <motion.div 
                  className={`flex items-center gap-1 ${
                    crypto.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}
                  animate={hoveredCrypto === crypto.symbol ? {
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {crypto.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs">
                    {crypto.change24h.toFixed(2)}%
                  </span>
                </motion.div>

                {/* Mini sparkline */}
                {hoveredCrypto === crypto.symbol && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 60 }}
                    className="h-8 relative"
                  >
                    <svg className="w-full h-full">
                      <motion.polyline
                        fill="none"
                        stroke={crypto.trend === 'up' ? '#10b981' : '#ef4444'}
                        strokeWidth="1"
                        points={crypto.sparkline.map((price, i) => 
                          `${i * 3},${20 - (price - Math.min(...crypto.sparkline)) / 
                            (Math.max(...crypto.sparkline) - Math.min(...crypto.sparkline)) * 16}`
                        ).join(' ')}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>


        </div>
      </motion.div>
    </div>
  );
}