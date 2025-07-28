import { memo } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getTokenImage } from '../../utils/dashboard-helpers';

interface TokenAvatarProps {
  symbol: string;
  size?: string;
}

export const TokenAvatar = memo(({ symbol, size = "w-10 h-10" }: TokenAvatarProps) => {
  const imageUrl = getTokenImage(symbol);
  
  if (imageUrl) {
    return (
      <ImageWithFallback
        src={imageUrl}
        alt={`${symbol} logo`}
        className={`${size} rounded-full object-cover border-2 border-gray-600`}
      />
    );
  }
  
  return (
    <div className={`${size} rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold`}>
      {symbol.charAt(0)}
    </div>
  );
});

TokenAvatar.displayName = 'TokenAvatar';