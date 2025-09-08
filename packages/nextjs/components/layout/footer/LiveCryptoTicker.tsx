"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useTheme } from "~~/hooks/use-theme";
import { useGlobalState } from "~~/services/store/store";
import { CryptoData } from "~~/types";

export function LiveCryptoTicker({ initial }: { initial?: CryptoData[] } = {}) {
  const storeData = useGlobalState(s => s.tickerData);
  const setTickerData = useGlobalState(s => s.setTickerData);

  // Always seed the store immediately with initial data
  useEffect(() => {
    if (initial?.length && initial.length > 0) {
      setTickerData(initial);
    }
  }, [initial, setTickerData]);

  // Use store data, but ensure we always have data to display
  const baseData: CryptoData[] = useMemo(() => {
    const data = storeData?.length ? storeData : (initial ?? []);
    // Ensure we always have at least some data
    return data.length > 0
      ? data
      : [
          {
            symbol: "LOADING",
            name: "Loading...",
            price: 0,
            change24h: 0,
            trend: "up" as const,
            volume: "-",
            marketCap: "-",
            sparkline: [1, 1, 1, 1, 1],
          },
        ];
  }, [storeData, initial]);

  // Create enough repeated items to ensure seamless scrolling
  // Build a single segment (will be duplicated once) sized to visually fill the bar.
  const segmentItems = useMemo(() => {
    const minItems = 8; // minimum items in a segment
    const repeats = Math.max(minItems, Math.ceil(minItems / baseData.length));
    // flatten a few repeats of baseData to make a reasonably long segment
    return Array(repeats).fill(baseData).flat();
  }, [baseData]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // no separate segment wrappers; we'll render a single list duplicated
  const [loopWidth, setLoopWidth] = useState<number>(1000); // Better initial estimate
  const [hoveredCrypto, setHoveredCrypto] = useState<string | null>(null); // Now uses unique key instead of symbol
  const [clickedCrypto, setClickedCrypto] = useState<string | null>(null);
  const { isDark, mounted } = useTheme();

  const safeIsDark = mounted ? isDark : true;

  const handleCryptoClick = (uniqueKey: string) => {
    setClickedCrypto(uniqueKey);
    if ("vibrate" in navigator) navigator.vibrate(30);
    setTimeout(() => setClickedCrypto(null), 500);
  };

  // Speed tuning: pixels per second target for marquee motion.
  // Increase this value to make the ticker move faster.
  const PIXELS_PER_SECOND = 100; // pixels per second

  // duration is derived implicitly by PIXELS_PER_SECOND using a frame loop

  const toNumber = (v: any): number => {
    if (typeof v === "number") return v;
    if (v && typeof v.value === "number") return v.value;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const measure = () => {
      const el = contentRef.current;
      if (el) {
        const total = el.scrollWidth;
        const w = total / 2 || total;
        setLoopWidth(w);
      } else {
        setLoopWidth(segmentItems.length * 220);
      }
    };

    // Measure after content renders
    const timer = setTimeout(measure, 120);
    // Re-measure when fonts load to avoid seam shift
    (document as any)?.fonts?.ready?.then?.(() => {
      requestAnimationFrame(measure);
    });
    // Observe size changes of the content
    let ro: ResizeObserver | null = null;
    if (contentRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(measure);
      });
      ro.observe(contentRef.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [segmentItems, baseData.length]);

  // Continuous ticker engine using a motion value with wrap-around
  const x = useMotionValue(0);
  const wrapNeg = (value: number, width: number) => {
    if (!width || !Number.isFinite(width)) return 0;
    const w = Math.max(1, width);
    const mod = ((value % w) + w) % w; // 0..w
    return mod - w; // -w..0
  };
  useAnimationFrame((t, delta) => {
    const pxPerMs = PIXELS_PER_SECOND / 1000;
    const next = x.get() - pxPerMs * delta;
    x.set(wrapNeg(next, loopWidth));
  });
  useEffect(() => {
    x.set(wrapNeg(x.get(), loopWidth));
  }, [loopWidth, x]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <motion.div
        className="backdrop-blur-md overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: safeIsDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)" }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative" ref={containerRef}>
          <motion.div
            ref={contentRef}
            className="flex gap-8 py-4 whitespace-nowrap will-change-transform"
            style={{ x }}
          >
            {/* Render data twice in a single row for perfect wrap */}
            {[...segmentItems, ...segmentItems].map((crypto, idx) => {
              const uniqueKey = `seg-${crypto.symbol}-${idx}`;
              const sparklineNumbers: number[] = Array.isArray(crypto.sparkline)
                ? (crypto.sparkline as any[]).map(toNumber)
                : [];

              return (
                <motion.div
                  key={uniqueKey}
                  className={`flex items-center gap-3 min-w-[200px] cursor-pointer transition-all duration-200 ${
                    hoveredCrypto === uniqueKey ? "scale-110" : ""
                  }`}
                  onMouseEnter={() => setHoveredCrypto(uniqueKey)}
                  onMouseLeave={() => setHoveredCrypto(null)}
                  onClick={() => handleCryptoClick(uniqueKey)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    clickedCrypto === uniqueKey
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(34, 211, 238, 0)",
                            "0 0 20px rgba(34, 211, 238, 0.8)",
                            "0 0 0px rgba(34, 211, 238, 0)",
                          ],
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                >
                  <motion.div
                    className="font-bold text-sm transition-colors duration-300"
                    style={{ color: safeIsDark ? "#ffffff" : "#1f2937" }}
                    animate={
                      hoveredCrypto === uniqueKey
                        ? { color: safeIsDark ? ["#ffffff", "#22d3ee", "#ffffff"] : ["#1f2937", "#3b82f6", "#1f2937"] }
                        : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {crypto.symbol}
                  </motion.div>

                  <div
                    className="text-sm transition-colors duration-300"
                    style={{ color: safeIsDark ? "#d1d5db" : "#6b7280" }}
                  >
                    ${crypto.price.toFixed(crypto.symbol === "MKR" ? 0 : 2)}
                  </div>

                  <motion.div
                    className={`flex items-center gap-1 ${crypto.trend === "up" ? "text-green-400" : "text-red-400"}`}
                    animate={hoveredCrypto === uniqueKey ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {crypto.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-xs">{crypto.change24h.toFixed(2)}%</span>
                  </motion.div>

                  {hoveredCrypto === uniqueKey && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 60 }}
                      className="h-8 relative"
                    >
                      <svg className="w-full h-full">
                        <motion.polyline
                          fill="none"
                          stroke={crypto.trend === "up" ? "#10b981" : "#ef4444"}
                          strokeWidth="1"
                          points={sparklineNumbers
                            .map(
                              (price, i) =>
                                `${i * 3},${
                                  20 -
                                  ((price - Math.min(...sparklineNumbers)) /
                                    (Math.max(...sparklineNumbers) - Math.min(...sparklineNumbers) || 1)) *
                                    16
                                }`,
                            )
                            .join(" ")}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
