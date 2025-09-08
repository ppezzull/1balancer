"use client";

import { motion } from "framer-motion";

export default function LiveCryptoSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <motion.div
        className="backdrop-blur-md overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative">
          <div className="flex gap-6 py-4 px-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 min-w-[200px]">
                <div className="h-4 w-10 rounded bg-gray-700/40" />
                <div className="h-4 w-16 rounded bg-gray-700/30" />
                <div className="h-3 w-10 rounded bg-gray-700/20" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
