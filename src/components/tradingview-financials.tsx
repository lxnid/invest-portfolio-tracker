"use client";

import React, { useEffect, useRef, memo } from "react";

export type Theme = "light" | "dark";

interface TradingViewFinancialsProps {
  symbol: string;
  theme?: Theme;
  className?: string;
  locale?: string;
  width?: string | number;
  height?: string | number;
}

function TradingViewFinancialsComponent({
  symbol,
  theme = "dark",
  className,
  locale = "en",
  width = "100%",
  height = 800,
}: TradingViewFinancialsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-financials.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      largeChartUrl: "",
      displayMode: "regular",
      width: width,
      height: height,
      symbol: symbol,
      locale: locale,
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [symbol, theme, locale, width, height]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      ref={containerRef}
    />
  );
}

export const TradingViewFinancials = memo(TradingViewFinancialsComponent);
