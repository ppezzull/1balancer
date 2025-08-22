import { TOKEN_IMAGES, WALLET_CONFIG } from '../utils/constants';
import { toast } from "sonner";

export const getTokenImage = (symbol: string): string | null => {
  return TOKEN_IMAGES[symbol as keyof typeof TOKEN_IMAGES] || null;
};

export const copyWalletAddress = () => {
  navigator.clipboard.writeText(WALLET_CONFIG.fullAddress);
  toast.success("Wallet address copied to clipboard");
};

export const generateWalletAvatar = (isMobile: boolean) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const pattern = [];
  
  for (let i = 0; i < 64; i++) {
    const colorIndex = i % colors.length;
    pattern.push(colors[colorIndex]);
  }
  
  return (
    <div className={`rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 p-1 ${
      isMobile ? 'w-12 h-12' : 'w-16 h-16'
    }`}>
      <div className="w-full h-full rounded-lg grid grid-cols-8 gap-0 overflow-hidden">
        {pattern.map((color, index) => (
          <div 
            key={index} 
            className="w-full h-full" 
            style={{ backgroundColor: color, opacity: Math.random() > 0.3 ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
};