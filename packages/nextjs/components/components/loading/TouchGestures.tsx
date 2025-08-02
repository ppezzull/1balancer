import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowUp } from "lucide-react";

interface TouchGesturesProps {
  onSpeedBoost: () => void;
}

export function TouchGestures({ onSpeedBoost }: TouchGesturesProps) {
  const [swipeCount, setSwipeCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      // Swipe up detected
      if (deltaY < -50 && Math.abs(deltaX) < 100) {
        setSwipeCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            onSpeedBoost();
            return 0;
          }
          return newCount;
        });
      }

      setTouchStart(null);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, onSpeedBoost]);

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
      <AnimatePresence>
        {showHint && swipeCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center text-gray-500 text-sm mb-2"
          >
            <div className="flex items-center gap-2 justify-center mb-1">
              <ArrowUp className="w-4 h-4" />
              <span>Swipe up to boost loading</span>
            </div>
          </motion.div>
        )}

        {swipeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">
              {swipeCount}/3 boosts
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}