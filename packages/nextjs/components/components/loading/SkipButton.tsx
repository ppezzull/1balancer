import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SkipForward, Check, X } from "lucide-react";

interface SkipButtonProps {
  onSkip: () => void;
  progress: number;
}

export function SkipButton({ onSkip, progress }: SkipButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const handleSkipClick = () => {
    if (progress < 50) {
      setShowConfirm(true);
    } else {
      onSkip();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSkip();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="absolute bottom-8 right-8">
      <AnimatePresence>
        {showConfirm ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30"
          >
            <div className="text-yellow-400 text-sm mb-3 text-center">
              Skip loading process?
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Check className="w-4 h-4" />
                Yes
              </motion.button>
              <motion.button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
                No
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            onClick={handleSkipClick}
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => setIsHolding(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            animate={isHolding ? { 
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
              borderColor: "rgba(99, 102, 241, 0.8)"
            } : {}}
          >
            <SkipForward className="w-4 h-4" />
            <span className="text-sm">Skip</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}