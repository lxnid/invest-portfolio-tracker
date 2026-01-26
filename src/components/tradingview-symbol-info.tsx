"use client";

import React, { useEffect, useRef, memo } from "react";

export type Theme = "light" | "dark";

interface TradingViewSymbolInfoProps {
  symbol: string;
  theme?: Theme;
  className?: string;
  locale?: string;
  autosize?: boolean;
}

function TradingViewSymbolInfoComponent({
  symbol,
  theme = "dark",
  className,
  locale = "en",
  autosize = true,
}: TradingViewSymbolInfoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear previous widget content to avoid duplication if effect re-runs
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: autosize ? "100%" : 1000,
      locale: locale,
      colorTheme: theme,
      isTransparent: true, // Better integration with custom backgrounds
      autosize: autosize,
      largeChartUrl: "", // Optional: Link to fuller chart
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [symbol, theme, locale, autosize]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      ref={containerRef}
      style={{ minHeight: "200px" }} // Prevent layout shift
    />
  );
}

export const TradingViewSymbolInfo = memo(TradingViewSymbolInfoComponent);
