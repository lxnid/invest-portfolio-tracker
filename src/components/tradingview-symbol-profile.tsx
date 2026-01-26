"use client";

import React, { useEffect, useRef, memo } from "react";

export type Theme = "light" | "dark";

interface TradingViewSymbolProfileProps {
  symbol: string;
  theme?: Theme;
  className?: string;
  locale?: string;
  width?: string | number;
  height?: string | number;
}

function TradingViewSymbolProfileComponent({
  symbol,
  theme = "dark",
  className,
  locale = "en",
  width = "100%",
  height = 550,
}: TradingViewSymbolProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: width,
      height: height,
      colorTheme: theme,
      isTransparent: true,
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

export const TradingViewSymbolProfile = memo(TradingViewSymbolProfileComponent);
